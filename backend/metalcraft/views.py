from rest_framework import viewsets, permissions
from .models import WorkStation, Material, Product, WorkOrder, ProductionLog
from .serializers import (
    WorkStationSerializer, MaterialSerializer, 
    ProductSerializer, WorkOrderSerializer, ProductionLogSerializer
)

class WorkStationViewSet(viewsets.ModelViewSet):
    queryset = WorkStation.objects.all()
    serializer_class = WorkStationSerializer
    permission_classes = [permissions.IsAuthenticated]

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductionLogViewSet(viewsets.ModelViewSet):
    queryset = ProductionLog.objects.all()
    serializer_class = ProductionLogSerializer
    permission_classes = [permissions.IsAuthenticated]
