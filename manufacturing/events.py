from django.dispatch import receiver
from django.db.models.signals import post_save, pre_save
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

from .models import WorkOrder, Material, Product, ProductionLog, WorkStation

User = get_user_model()
channel_layer = get_channel_layer()

class EventType:
    """Standardized event types for consistent messaging"""
    WORK_ORDER_CREATED = 'work_order.created'
    WORK_ORDER_STARTED = 'work_order.started'
    WORK_ORDER_COMPLETED = 'work_order.completed'
    MATERIAL_LOW_STOCK = 'material.low_stock'
    PRODUCT_STATUS_CHANGED = 'product.status_changed'
    WORKSTATION_PROCESSING_STARTED = 'workstation.processing_started'
    WORKSTATION_PROCESSING_COMPLETED = 'workstation.processing_completed'
    WORKSTATION_EFFICIENCY_UPDATE = 'workstation.efficiency_update'
    PRODUCT_DESIGN_GENERATED = 'product.design_generated'
    INSTRUCTION_SET_CREATED = 'instruction.set_created'
    MATERIAL_WASTAGE_RECORDED = 'material.wastage_recorded'
    PRODUCTION_BOTTLENECK_DETECTED = 'production.bottleneck_detected'
    PRODUCT_QUALITY_CHECK = 'product.quality_check'
    PACKAGING_STARTED = 'packaging.started'
    PACKAGING_COMPLETED = 'packaging.completed'

class WorkflowEvent:
    """
    Central event management class for manufacturing workflows
    Handles event creation, logging, and notification dispatch
    """
    @staticmethod
    async def dispatch_event(event_type, data, group_name='manufacturing'):
        """
        Dispatch an event to WebSocket channel
        
        Args:
            event_type (str): Type of event from EventType
            data (dict): Event payload
            group_name (str): Channel group to send event
        """
        try:
            await channel_layer.group_send(group_name, {
                'type': 'event_message',
                'event_type': event_type,
                'data': data,
                'timestamp': timezone.now().isoformat()  # Add timestamp to all events
            })
        except Exception as e:
            # Log event dispatch errors
            print(f"Event Dispatch Error: {e}")
    
    @staticmethod
    def create_production_log(event_type, work_order, product, workstation=None, details=None):
        """
        Create a comprehensive production log entry
        
        Args:
            event_type (str): Type of event from EventType
            work_order (WorkOrder): Associated work order
            product (Product): Associated product
            workstation (WorkStation, optional): Associated workstation
            details (dict, optional): Additional event details
        """
        from .models import ProductionLog  # Import here to avoid circular import
        
        log_entry = ProductionLog.objects.create(
            event_type=event_type,
            work_order=work_order,
            product=product,
            workstation=workstation,
            details=details or {}
        )
        return log_entry
    
    @staticmethod
    async def track_workstation_efficiency(workstation, processing_time, material_used, material_wasted):
        """
        Track and log workstation efficiency metrics
        
        Args:
            workstation (WorkStation): Workstation being tracked
            processing_time (timedelta): Time taken to process
            material_used (float): Total material used
            material_wasted (float): Material wasted during processing
        """
        efficiency_data = {
            'processing_time': processing_time.total_seconds(),
            'material_used': material_used,
            'material_wasted': material_wasted,
            'wastage_percentage': (material_wasted / material_used) * 100 if material_used > 0 else 0
        }
        
        await WorkflowEvent.dispatch_event(
            EventType.WORKSTATION_EFFICIENCY_UPDATE, 
            {
                'workstation_id': workstation.id,
                'efficiency_metrics': efficiency_data
            }
        )
        
        return efficiency_data

class WorkOrderEventHandler:
    """Specialized handler for work order related events"""
    
    @classmethod
    def handle_work_order_creation(cls, work_order):
        """
        Process events when a work order is created
        
        Args:
            work_order (WorkOrder): Newly created work order
        """
        # Check material availability
        material_status = cls._check_material_availability(work_order)
        
        # Dispatch creation event
        async_to_sync(WorkflowEvent.dispatch_event)(
            EventType.WORK_ORDER_CREATED, 
            {
                'work_order_id': work_order.id,
                'product_name': work_order.product.name,
                'quantity': work_order.quantity,
                'material_status': material_status
            }
        )
    
    @classmethod
    def _check_material_availability(cls, work_order):
        """
        Check if required materials are available for work order
        
        Returns:
            dict: Status of material availability
        """
        material_status = {}
        for product_material in work_order.product.productmaterial_set.all():
            material = product_material.material
            required_quantity = product_material.quantity * work_order.quantity
            
            material_status[material.name] = {
                'required': required_quantity,
                'available': material.quantity,
                'sufficient': material.quantity >= required_quantity
            }
        
        return material_status

    @classmethod
    def handle_work_order_start(cls, work_order):
        """
        Handle material reservation when work order starts
        
        Args:
            work_order (WorkOrder): Work order being started
        """
        # Reserve materials
        material_reservations = []
        for product_material in work_order.product.productmaterial_set.all():
            material = product_material.material
            required_quantity = product_material.quantity * work_order.quantity
            
            # Reduce material quantity
            material.quantity -= required_quantity
            material.save()
            
            # Track reservation
            material_reservations.append({
                'material_name': material.name,
                'quantity_reserved': required_quantity,
                'remaining_quantity': material.quantity
            })
        
        # Dispatch start event
        async_to_sync(WorkflowEvent.dispatch_event)(
            EventType.WORK_ORDER_STARTED,
            {
                'work_order_id': work_order.id,
                'product_name': work_order.product.name,
                'quantity': work_order.quantity,
                'material_reservations': material_reservations
            }
        )
    
    @classmethod
    def handle_work_order_completion(cls, work_order):
        """
        Handle product and material updates on work order completion
        
        Args:
            work_order (WorkOrder): Completed work order
        """
        # Update product quantity
        product = work_order.product
        product.current_quantity += work_order.quantity
        product.update_stock_status()
        product.save()
        
        # Create production log
        ProductionLog.objects.create(
            work_order=work_order,
            workstation=work_order.workstation,
            quantity_produced=work_order.quantity,
            created_by=work_order.assigned_to
        )
        
        # Dispatch completion event
        async_to_sync(WorkflowEvent.dispatch_event)(
            EventType.WORK_ORDER_COMPLETED,
            {
                'work_order_id': work_order.id,
                'product_name': product.name,
                'quantity_produced': work_order.quantity,
                'new_product_quantity': product.current_quantity,
                'product_status': product.stock_status
            }
        )
    
    @classmethod
    def handle_work_order_cancellation(cls, work_order):
        """
        Handle material restoration on work order cancellation
        
        Args:
            work_order (WorkOrder): Cancelled work order
        """
        # Restore reserved materials
        material_restorations = []
        for product_material in work_order.product.productmaterial_set.all():
            material = product_material.material
            reserved_quantity = product_material.quantity * work_order.quantity
            
            # Restore material quantity
            material.quantity += reserved_quantity
            material.save()
            
            # Track restoration
            material_restorations.append({
                'material_name': material.name,
                'quantity_restored': reserved_quantity,
                'new_quantity': material.quantity
            })
        
        # Dispatch cancellation event
        async_to_sync(WorkflowEvent.dispatch_event)(
            'work_order.cancelled',
            {
                'work_order_id': work_order.id,
                'product_name': work_order.product.name,
                'material_restorations': material_restorations
            }
        )

# Signal Receivers
@receiver(post_save, sender=WorkOrder)
def work_order_created(sender, instance, created, **kwargs):
    """
    Signal receiver for work order creation
    """
    if created:
        WorkOrderEventHandler.handle_work_order_creation(instance)

@receiver(pre_save, sender=WorkOrder)
def work_order_status_changed(sender, instance, **kwargs):
    """
    Handle work order status transitions
    """
    if instance.pk:  # Existing work order
        original = WorkOrder.objects.get(pk=instance.pk)
        
        # Detect status change
        if original.status != instance.status:
            if instance.status == 'IN_PROGRESS':
                WorkOrderEventHandler.handle_work_order_start(instance)
            elif instance.status == 'COMPLETED':
                WorkOrderEventHandler.handle_work_order_completion(instance)
            elif instance.status == 'CANCELLED':
                WorkOrderEventHandler.handle_work_order_cancellation(instance)
            
            # Dispatch generic status change event
            async_to_sync(WorkflowEvent.dispatch_event)(
                'work_order.status_changed',
                {
                    'work_order_id': instance.id,
                    'old_status': original.status,
                    'new_status': instance.status
                }
            )

@receiver(post_save, sender=Material)
def material_stock_changed(sender, instance, **kwargs):
    """
    Monitor material stock levels and trigger low stock alerts
    """
    if instance.quantity <= instance.reorder_level:
        async_to_sync(WorkflowEvent.dispatch_event)(
            EventType.MATERIAL_LOW_STOCK,
            {
                'material_id': instance.id,
                'material_name': instance.name,
                'current_quantity': instance.quantity,
                'reorder_level': instance.reorder_level
            }
        )

@receiver(post_save, sender=Product)
def product_status_changed(sender, instance, **kwargs):
    """
    Monitor product stock status changes
    """
    if hasattr(instance, '_previous_stock_status'):
        if instance._previous_stock_status != instance.stock_status:
            async_to_sync(WorkflowEvent.dispatch_event)(
                EventType.PRODUCT_STATUS_CHANGED,
                {
                    'product_id': instance.id,
                    'product_name': instance.name,
                    'old_status': instance._previous_stock_status,
                    'new_status': instance.stock_status
                }
            )
