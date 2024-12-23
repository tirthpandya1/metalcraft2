from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Sum

from .models import ProductOrder, ProductOrderItem, ProductOrderInvoice
from .serializers import (
    ProductOrderSerializer, 
    ProductOrderItemSerializer, 
    ProductOrderInvoiceSerializer
)

class ProductOrderViewSet(viewsets.ModelViewSet):
    """
    Comprehensive viewset for managing product orders
    """
    queryset = ProductOrder.objects.prefetch_related(
        'items', 
        'invoice', 
        'status_transitions'
    ).select_related('customer', 'sales_rep')
    
    serializer_class = ProductOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Customize queryset based on query parameters
        """
        queryset = super().get_queryset()
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer_id', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        if start_date and end_date:
            queryset = queryset.filter(
                created_at__range=[start_date, end_date]
            )
        
        return queryset

    @action(detail=True, methods=['POST'])
    def update_status(self, request, pk=None):
        """
        Update order status with additional validation
        """
        order = self.get_object()
        new_status = request.data.get('status')
        
        # Validate status transition
        if not new_status:
            return Response({
                'error': 'Status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order.status = new_status
            order.save()
            
            return Response({
                'message': 'Order status updated successfully',
                'order': self.get_serializer(order).data
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['POST'])
    def create_invoice(self, request, pk=None):
        """
        Create an invoice for a product order
        """
        order = self.get_object()
        
        # Check if invoice already exists
        if hasattr(order, 'invoice'):
            return Response({
                'error': 'Invoice already exists for this order'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate invoice data
        serializer = ProductOrderInvoiceSerializer(data=request.data)
        if serializer.is_valid():
            # Set total amount from order
            serializer.validated_data['total_amount'] = order.total_cost
            serializer.validated_data['product_order'] = order
            
            # Set default payment due date (30 days from now)
            serializer.validated_data['payment_due_date'] = (
                timezone.now() + timezone.timedelta(days=30)
            ).date()
            
            invoice = serializer.save()
            
            return Response({
                'message': 'Invoice created successfully',
                'invoice': serializer.data
            })
        
        return Response(
            serializer.errors, 
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['GET'])
    def sales_summary(self, request):
        """
        Provide a summary of sales
        """
        # Total sales by status
        status_sales = ProductOrder.objects.values('status').annotate(
            total_sales=Sum('total_cost')
        )
        
        # Sales by customer
        customer_sales = ProductOrder.objects.values(
            'customer__name'
        ).annotate(
            total_sales=Sum('total_cost')
        )
        
        # Recent orders
        recent_orders = ProductOrder.objects.filter(
            created_at__gte=timezone.now() - timezone.timedelta(days=30)
        ).order_by('-created_at')[:10]
        
        return Response({
            'status_sales': status_sales,
            'customer_sales': customer_sales,
            'recent_orders': self.get_serializer(recent_orders, many=True).data
        })

    @action(detail=True, methods=['POST'])
    def add_tracking_info(self, request, pk=None):
        """
        Add shipping tracking information
        """
        order = self.get_object()
        
        tracking_number = request.data.get('tracking_number')
        shipping_method = request.data.get('shipping_method')
        
        if not tracking_number or not shipping_method:
            return Response({
                'error': 'Tracking number and shipping method are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order.tracking_number = tracking_number
        order.shipping_method = shipping_method
        order.status = 'SHIPPED'
        order.save()
        
        return Response({
            'message': 'Tracking information added successfully',
            'order': self.get_serializer(order).data
        })


class ProductOrderItemViewSet(viewsets.ModelViewSet):
    """
    Viewset for managing individual product order items
    """
    queryset = ProductOrderItem.objects.select_related('order', 'product')
    serializer_class = ProductOrderItemSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['PATCH'])
    def update_production_status(self, request, pk=None):
        """
        Update production status of a specific order item
        """
        order_item = self.get_object()
        new_status = request.data.get('production_status')
        
        if not new_status:
            return Response({
                'error': 'Production status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order_item.production_status = new_status
        order_item.save()
        
        return Response({
            'message': 'Production status updated successfully',
            'order_item': self.get_serializer(order_item).data
        })


class ProductOrderInvoiceViewSet(viewsets.ModelViewSet):
    """
    Viewset for managing product order invoices
    """
    queryset = ProductOrderInvoice.objects.select_related('product_order')
    serializer_class = ProductOrderInvoiceSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['POST'])
    def mark_paid(self, request, pk=None):
        """
        Mark an invoice as paid
        """
        invoice = self.get_object()
        
        invoice.payment_status = 'PAID'
        invoice.save()
        
        # Update associated order status if all invoices are paid
        order = invoice.product_order
        if order.invoice and order.invoice.payment_status == 'PAID':
            order.status = 'DELIVERED'
            order.save()
        
        return Response({
            'message': 'Invoice marked as paid',
            'invoice': self.get_serializer(invoice).data
        })

    @action(detail=False, methods=['GET'])
    def overdue_invoices(self, request):
        """
        Retrieve overdue invoices
        """
        overdue_invoices = ProductOrderInvoice.objects.filter(
            Q(payment_status__in=['UNPAID', 'PARTIALLY_PAID']) &
            Q(payment_due_date__lt=timezone.now().date())
        )
        
        return Response({
            'overdue_invoices': self.get_serializer(overdue_invoices, many=True).data
        })
