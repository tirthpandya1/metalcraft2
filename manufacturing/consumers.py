import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import WorkStation, WorkOrder, ProductionLog

class ManufacturingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            "manufacturing_updates",
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            "manufacturing_updates",
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'workstation_update':
            await self.channel_layer.group_send(
                "manufacturing_updates",
                {
                    "type": "workstation_status",
                    "data": text_data_json.get('data')
                }
            )
        elif message_type == 'production_update':
            await self.channel_layer.group_send(
                "manufacturing_updates",
                {
                    "type": "production_status",
                    "data": text_data_json.get('data')
                }
            )

    async def workstation_status(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def production_status(self, event):
        await self.send(text_data=json.dumps(event['data']))
