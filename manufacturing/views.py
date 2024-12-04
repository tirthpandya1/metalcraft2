from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils import timezone
from .models import WorkStation, Material, Product, WorkOrder, ProductionLog
from .serializers import (
    WorkStationSerializer, MaterialSerializer, ProductSerializer,
    WorkOrderSerializer, ProductionLogSerializer
)

# Create your views here.

class WorkStationViewSet(viewsets.ModelViewSet):
    queryset = WorkStation.objects.all()
    serializer_class = WorkStationSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        workstation = self.get_object()
        status = request.data.get('status')
        if status in dict(WorkStation.status.field.choices):
            workstation.status = status
            workstation.save()
            return Response({'status': 'status updated'})
        return Response({'error': 'Invalid status'}, status=400)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        materials = Material.objects.filter(quantity__lte=Material.reorder_level)
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    @action(detail=True, methods=['get'])
    def material_requirements(self, request, pk=None):
        product = self.get_object()
        materials = product.productmaterial_set.all()
        data = [{
            'material': material.material.name,
            'required_quantity': material.quantity,
            'available_quantity': material.material.quantity,
            'status': 'Available' if material.material.quantity >= material.quantity else 'Insufficient'
        } for material in materials]
        return Response(data)

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    def get_queryset(self):
        queryset = WorkOrder.objects.all().order_by('-created_at')
        
        # Optional filtering parameters
        status = self.request.query_params.get('status', None)
        product_id = self.request.query_params.get('product', None)
        start_date_from = self.request.query_params.get('start_date_from', None)
        start_date_to = self.request.query_params.get('start_date_to', None)

        # Log the query parameters for debugging
        print(f"WorkOrder Query Params: status={status}, product_id={product_id}, "
              f"start_date_from={start_date_from}, start_date_to={start_date_to}")

        if status:
            queryset = queryset.filter(status=status)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)

        # Log the number of work orders after filtering
        print(f"Total WorkOrders after filtering: {queryset.count()}")

        return queryset

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        Start a pending work order
        """
        work_order = self.get_object()
        
        # Validate current status
        if work_order.status != 'PENDING':
            return Response({
                'error': 'Work order can only be started from PENDING status'
            }, status=400)
        
        # Check material availability
        for product_material in work_order.product.productmaterial_set.all():
            material = product_material.material
            required_quantity = product_material.quantity * work_order.quantity
            
            if material.quantity < required_quantity:
                return Response({
                    'error': f'Insufficient material: {material.name}. '
                             f'Required: {required_quantity}, Available: {material.quantity}'
                }, status=400)
        
        # Deduct materials
        for product_material in work_order.product.productmaterial_set.all():
            material = product_material.material
            required_quantity = product_material.quantity * work_order.quantity
            material.quantity -= required_quantity
            material.save()
        
        # Update work order
        work_order.status = 'IN_PROGRESS'
        work_order.start_date = timezone.now()
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete an in-progress work order
        """
        work_order = self.get_object()
        
        # Validate current status
        if work_order.status != 'IN_PROGRESS':
            return Response({
                'error': 'Work order can only be completed from IN_PROGRESS status'
            }, status=400)
        
        # Optional actual quantity parameter
        actual_quantity = request.data.get('actual_quantity', work_order.quantity)
        
        # Create production log
        ProductionLog.objects.create(
            work_order=work_order,
            quantity_produced=actual_quantity,
            start_time=work_order.start_date,
            end_time=timezone.now(),
            status='COMPLETED'
        )
        
        # Update work order
        work_order.status = 'COMPLETED'
        work_order.end_date = timezone.now()
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a pending or in-progress work order
        """
        work_order = self.get_object()
        
        # Validate current status
        if work_order.status not in ['PENDING', 'IN_PROGRESS']:
            return Response({
                'error': 'Work order can only be cancelled when PENDING or IN_PROGRESS'
            }, status=400)
        
        # Optional cancellation reason
        reason = request.data.get('reason', '')
        
        # If work order was in progress, restore materials
        if work_order.status == 'IN_PROGRESS':
            for product_material in work_order.product.productmaterial_set.all():
                material = product_material.material
                required_quantity = product_material.quantity * work_order.quantity
                material.quantity += required_quantity
                material.save()
        
        # Update work order
        work_order.status = 'CANCELLED'
        work_order.notes = f"Cancelled: {reason}"
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Comprehensive work order dashboard statistics
        """
        today = timezone.now().date()
        
        stats = {
            'total_orders': {
                'count': WorkOrder.objects.count(),
                'by_status': WorkOrder.objects.values('status').annotate(count=Count('id'))
            },
            'today_orders': {
                'total': WorkOrder.objects.filter(start_date__date=today).count(),
                'completed': WorkOrder.objects.filter(
                    status='COMPLETED', 
                    end_date__date=today
                ).count(),
                'in_progress': WorkOrder.objects.filter(
                    status='IN_PROGRESS', 
                    start_date__date=today
                ).count()
            },
            'production_summary': {
                'total_quantity_planned': WorkOrder.objects.aggregate(
                    total_quantity=Sum('quantity')
                )['total_quantity'] or 0,
                'total_quantity_completed': WorkOrder.objects.filter(
                    status='COMPLETED'
                ).aggregate(
                    total_quantity=Sum('quantity')
                )['total_quantity'] or 0
            }
        }
        
        return Response(stats)

class ProductionLogViewSet(viewsets.ModelViewSet):
    queryset = ProductionLog.objects.all()
    serializer_class = ProductionLogSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    def perform_create(self, serializer):
        # Only set created_by if a user is authenticated
        if self.request.user.is_authenticated:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def production_stats(self, request):
        today = timezone.now().date()
        today_stats = ProductionLog.objects.filter(created_at__date=today).aggregate(
            total_produced=Sum('quantity_produced'),
            total_wastage=Sum('wastage')
        )

        return Response({
            'today_production': today_stats['total_produced'] or 0,
            'today_wastage': today_stats['total_wastage'] or 0
        })
