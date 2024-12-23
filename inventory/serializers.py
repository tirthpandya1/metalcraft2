from rest_framework import serializers
from .models import MaterialOrder, MaterialOrderItem, Invoice
from manufacturing.models import Material, Supplier
from .material_serializer import MaterialSerializer
from manufacturing.serializers import SupplierSerializer

class MaterialOrderItemSerializer(serializers.ModelSerializer):
    material = MaterialSerializer(read_only=True)
    material_id = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), 
        source='material', 
        write_only=True
    )

    class Meta:
        model = MaterialOrderItem
        fields = [
            'id', 
            'material', 
            'material_id', 
            'quantity_ordered', 
            'quantity_received', 
            'unit_price', 
            'total_price', 
            'status'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 
            'invoice_number', 
            'invoice_date', 
            'total_amount', 
            'payment_status', 
            'payment_due_date', 
            'notes'
        ]


class MaterialOrderSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), 
        source='supplier', 
        write_only=True
    )
    
    items = MaterialOrderItemSerializer(many=True, read_only=True)
    invoice = InvoiceSerializer(read_only=True)
    
    class Meta:
        model = MaterialOrder
        fields = [
            'id', 
            'order_number', 
            'supplier', 
            'supplier_id', 
            'status', 
            'priority', 
            'created_at', 
            'updated_at', 
            'expected_delivery_date', 
            'total_cost', 
            'internal_notes', 
            'items', 
            'invoice'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        # Handle creating material order with items
        items_data = self.context.get('items', [])
        
        # Remove items from validated data if present
        validated_data.pop('items', None)
        
        # Create the material order
        material_order = MaterialOrder.objects.create(**validated_data)
        
        # Create order items
        for item_data in items_data:
            item_data['order'] = material_order
            MaterialOrderItem.objects.create(**item_data)
        
        return material_order
