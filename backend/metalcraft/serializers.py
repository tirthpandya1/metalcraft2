from rest_framework import serializers
from .models import WorkStation, Material, Product, WorkOrder, ProductionLog

class WorkStationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkStation
        fields = '__all__'

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class WorkOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = '__all__'

class ProductionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLog
        fields = '__all__'
