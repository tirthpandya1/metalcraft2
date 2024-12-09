import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import WorkStation, WorkOrder, ProductionLog, Material, Product
from .events import EventType

logger = logging.getLogger(__name__)

class ManufacturingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Handle new WebSocket connection
        Add user to manufacturing updates group
        """
        await self.channel_layer.group_add(
            "manufacturing",  # Matches event dispatch group
            self.channel_name
        )
        await self.accept()
        
        # Optional: Send initial state on connection
        await self.send_initial_state()

    async def disconnect(self, close_code):
        """
        Remove user from manufacturing updates group on disconnect
        """
        await self.channel_layer.group_discard(
            "manufacturing",
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Handle incoming WebSocket messages
        Supports various client-side request types
        """
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            # Dispatch based on message type
            if message_type == 'request_initial_state':
                await self.send_initial_state()
            elif message_type == 'request_workorder_details':
                work_order_id = text_data_json.get('work_order_id')
                await self.send_workorder_details(work_order_id)
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"WebSocket receive error: {e}")

    async def send_initial_state(self):
        """
        Send initial manufacturing state to connected client
        """
        initial_state = {
            'workstations': await self.get_workstation_status(),
            'low_stock_materials': await self.get_low_stock_materials(),
            'pending_work_orders': await self.get_pending_work_orders()
        }
        await self.send(text_data=json.dumps({
            'type': 'initial_state',
            'data': initial_state
        }))

    async def send_workorder_details(self, work_order_id):
        """
        Send detailed information about a specific work order
        """
        details = await self.get_workorder_details(work_order_id)
        await self.send(text_data=json.dumps({
            'type': 'workorder_details',
            'data': details
        }))

    async def event_message(self, event):
        """
        Generic event handler for all manufacturing events
        Broadcasts events to connected clients
        """
        await self.send(text_data=json.dumps({
            'type': 'manufacturing_event',
            'event_type': event['event_type'],
            'data': event['data']
        }))

    @database_sync_to_async
    def get_workstation_status(self):
        """Retrieve current workstation statuses"""
        return list(WorkStation.objects.values('id', 'name', 'status'))

    @database_sync_to_async
    def get_low_stock_materials(self):
        """Retrieve materials below reorder level"""
        return list(Material.objects.filter(
            quantity__lte=models.F('reorder_level')
        ).values('id', 'name', 'quantity', 'reorder_level'))

    @database_sync_to_async
    def get_pending_work_orders(self):
        """Retrieve pending work orders"""
        return list(WorkOrder.objects.filter(
            status='PENDING'
        ).values('id', 'product__name', 'quantity'))

    @database_sync_to_async
    def get_workorder_details(self, work_order_id):
        """Retrieve detailed information about a specific work order"""
        try:
            work_order = WorkOrder.objects.get(id=work_order_id)
            return {
                'id': work_order.id,
                'product_name': work_order.product.name,
                'quantity': work_order.quantity,
                'status': work_order.status,
                'start_date': str(work_order.start_date) if work_order.start_date else None,
                'materials': [
                    {
                        'name': pm.material.name,
                        'required_quantity': pm.quantity * work_order.quantity,
                        'available_quantity': pm.material.quantity
                    } for pm in work_order.product.productmaterial_set.all()
                ]
            }
        except WorkOrder.DoesNotExist:
            return None
