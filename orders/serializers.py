from rest_framework import serializers
from django.utils import timezone
from accounts.models import User
from .models import ProductOrder, ProductOrderItem, ProductOrderInvoice, OrderStatusTransition
from customers.serializers import CustomerSerializer
from products.serializers import ProductSerializer
from products.models import Product
from customers.models import Customer
from django.db import transaction

class ProductOrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )

    class Meta:
        model = ProductOrderItem
        fields = [
            'id', 
            'product', 
            'product_id', 
            'quantity', 
            'unit_price', 
            'total_price', 
            'production_status',
            'customization_details'
        ]
        read_only_fields = ['total_price']


class ProductOrderInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOrderInvoice
        fields = [
            'id', 
            'invoice_number', 
            'invoice_date', 
            'total_amount', 
            'payment_status', 
            'payment_due_date', 
            'payment_method', 
            'notes'
        ]
        read_only_fields = ['invoice_date']


class OrderStatusTransitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusTransition
        fields = [
            'id', 
            'from_status', 
            'to_status', 
            'transitioned_at', 
            'notes'
        ]
        read_only_fields = ['transitioned_at']


class ProductOrderSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), 
        source='customer', 
        write_only=True
    )
    
    sales_rep_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='sales_rep', 
        write_only=True,
        required=False,
        allow_null=True
    )
    
    items = ProductOrderItemSerializer(many=True)
    invoice = ProductOrderInvoiceSerializer(read_only=True)
    status_transitions = OrderStatusTransitionSerializer(many=True, read_only=True)

    class Meta:
        model = ProductOrder
        fields = [
            'id', 
            'order_number', 
            'customer', 
            'customer_id', 
            'status', 
            'priority', 
            'created_at', 
            'updated_at', 
            'expected_production_start', 
            'expected_delivery_date', 
            'total_cost', 
            'shipping_method', 
            'shipping_cost', 
            'tracking_number', 
            'customer_notes', 
            'internal_notes', 
            'sales_rep_id', 
            'items', 
            'invoice',
            'status_transitions'
        ]
        read_only_fields = ['created_at', 'updated_at', 'order_number']

    def create(self, validated_data):
        """
        Custom create method to handle nested items and generate order number
        """
        # Extract items data
        items_data = validated_data.pop('items', [])
        
        # Generate unique order number
        last_order = ProductOrder.objects.order_by('-id').first()
        order_number = f'PO-{(last_order.id + 1):05d}' if last_order else 'PO-00001'
        validated_data['order_number'] = order_number

        # Create product order
        with transaction.atomic():
            product_order = ProductOrder.objects.create(**validated_data)
            
            # Create order items
            total_cost = 0
            for item_data in items_data:
                item_data['order'] = product_order
                order_item = ProductOrderItem.objects.create(**item_data)
                total_cost += order_item.total_price
            
            # Update total cost
            product_order.total_cost = total_cost
            product_order.save()
        
        return product_order

    def update(self, instance, validated_data):
        """
        Custom update method to handle status changes and nested items
        """
        # Track status changes
        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        
        # Remove items from validated data if present
        items_data = validated_data.pop('items', None)
        
        # Update the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle status transition
        if old_status != new_status:
            OrderStatusTransition.objects.create(
                product_order=instance,
                from_status=old_status,
                to_status=new_status,
                transitioned_by=self.context['request'].user
            )
        
        # Update items if provided
        if items_data:
            # Clear existing items
            instance.items.all().delete()
            
            # Recreate items
            total_cost = 0
            for item_data in items_data:
                item_data['order'] = instance
                order_item = ProductOrderItem.objects.create(**item_data)
                total_cost += order_item.total_price
            
            # Update total cost
            instance.total_cost = total_cost
        
        instance.save()
        return instance
