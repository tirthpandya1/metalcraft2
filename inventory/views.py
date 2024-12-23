from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone

from .models import MaterialOrder, MaterialOrderItem, Invoice
from manufacturing.models import Material
from .serializers import MaterialOrderSerializer, MaterialOrderItemSerializer, InvoiceSerializer

class MaterialOrderViewSet(viewsets.ModelViewSet):
    """
    Comprehensive viewset for managing material orders
    """
    queryset = MaterialOrder.objects.prefetch_related('items', 'invoice')
    serializer_class = MaterialOrderSerializer

    def get_queryset(self):
        """
        Customize queryset based on query parameters
        """
        queryset = super().get_queryset()
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by supplier
        supplier_id = self.request.query_params.get('supplier_id', None)
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(
                created_at__range=[start_date, end_date]
            )
        
        return queryset

    @action(detail=True, methods=['POST'])
    def approve_order(self, request, pk=None):
        """
        Approve a material order
        """
        order = self.get_object()
        
        if order.status != 'PENDING':
            return Response({
                'error': 'Only pending orders can be approved'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'APPROVED'
        order.save()
        
        return Response({
            'message': 'Order approved successfully',
            'order': self.get_serializer(order).data
        })

    @action(detail=True, methods=['POST'])
    def receive_items(self, request, pk=None):
        """
        Receive items for a material order
        """
        order = self.get_object()
        received_items = request.data.get('items', [])
        
        with transaction.atomic():
            for item_data in received_items:
                try:
                    order_item = MaterialOrderItem.objects.get(
                        order=order, 
                        material_id=item_data['material_id']
                    )
                    
                    # Update received quantity
                    received_qty = item_data.get('quantity_received', 0)
                    order_item.quantity_received += received_qty
                    
                    # Update item status
                    if order_item.quantity_received >= order_item.quantity_ordered:
                        order_item.status = 'COMPLETED'
                    elif order_item.quantity_received > 0:
                        order_item.status = 'PARTIALLY_RECEIVED'
                    
                    order_item.save()
                    
                    # Update material inventory
                    material = order_item.material
                    material.quantity += received_qty
                    material.save()
                
                except MaterialOrderItem.DoesNotExist:
                    return Response({
                        'error': f'Material item not found in order: {item_data["material_id"]}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update overall order status
            completed_items = order.items.filter(status='COMPLETED')
            if completed_items.count() == order.items.count():
                order.status = 'COMPLETED'
            elif completed_items.exists():
                order.status = 'PARTIALLY_RECEIVED'
            
            order.save()
        
        return Response({
            'message': 'Items received successfully',
            'order': self.get_serializer(order).data
        })

    @action(detail=False, methods=['GET'])
    def low_stock_orders(self, request):
        """
        Get suggested material orders for low stock materials
        """
        low_stock_materials = Material.objects.filter(
            quantity__lte=F('reorder_level')
        )
        
        suggested_orders = []
        
        for material in low_stock_materials:
            # Calculate required quantity
            order_quantity = material.max_stock_level - material.quantity
            
            # Find preferred suppliers for this material
            preferred_suppliers = material.suppliers.filter(
                is_preferred_supplier=True
            )
            
            if preferred_suppliers.exists():
                supplier = preferred_suppliers.first()
                
                suggested_order = {
                    'material': MaterialSerializer(material).data,
                    'suggested_quantity': order_quantity,
                    'suggested_supplier': SupplierSerializer(supplier).data
                }
                
                suggested_orders.append(suggested_order)
        
        return Response(suggested_orders)


class MaterialOrderItemViewSet(viewsets.ModelViewSet):
    """
    Viewset for managing individual material order items
    """
    queryset = MaterialOrderItem.objects.select_related('order', 'material')
    serializer_class = MaterialOrderItemSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Viewset for managing invoices
    """
    queryset = Invoice.objects.select_related('material_order')
    serializer_class = InvoiceSerializer

    @action(detail=True, methods=['POST'])
    def mark_paid(self, request, pk=None):
        """
        Mark an invoice as paid
        """
        invoice = self.get_object()
        
        invoice.payment_status = 'PAID'
        invoice.save()
        
        return Response({
            'message': 'Invoice marked as paid',
            'invoice': self.get_serializer(invoice).data
        })
