from rest_framework import serializers
from django.contrib.auth.models import User
from .models import WorkStation, Material, Product, ProductMaterial, WorkOrder, ProductionLog
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class WorkStationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkStation
        fields = ['id', 'name', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'description', 'quantity', 'unit', 'reorder_level', 'cost_per_unit', 'created_at']
        read_only_fields = ['id', 'created_at']

class ProductMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    material_id = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(), 
        required=True
    )

    class Meta:
        model = ProductMaterial
        fields = ['material_id', 'quantity', 'material_name', 'material_unit']

    def to_internal_value(self, data):
        # If material_id is a Material instance, extract its ID
        if isinstance(data.get('material_id'), Material):
            data['material_id'] = data['material_id'].id
        
        return super().to_internal_value(data)

class ProductSerializer(serializers.ModelSerializer):
    materials = ProductMaterialSerializer(source='productmaterial_set', many=True, required=False)

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'materials', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        # Extract materials data, ensuring we handle potential Material objects
        materials_data = validated_data.pop('productmaterial_set', [])
        
        # Validate materials data
        if not materials_data:
            raise serializers.ValidationError("At least one material is required")
        
        # Validate and convert material_id
        for material_data in materials_data:
            # Ensure material_id is an integer
            if isinstance(material_data['material_id'], Material):
                material_data['material_id'] = material_data['material_id'].id
            
            if not isinstance(material_data['material_id'], int):
                try:
                    material_data['material_id'] = int(material_data['material_id'])
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"Invalid material_id: {material_data['material_id']}")
        
        # Create product
        product = Product.objects.create(**validated_data)
        
        # Create product materials
        for material_data in materials_data:
            ProductMaterial.objects.create(product=product, **material_data)
        
        return product

    def update(self, instance, validated_data):
        materials_data = validated_data.pop('productmaterial_set', [])
        
        # Update basic product fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        
        # Update materials
        # First, remove existing materials
        instance.productmaterial_set.all().delete()
        
        # Then add new materials
        for material_data in materials_data:
            # Ensure material_id is an integer
            if isinstance(material_data['material_id'], Material):
                material_data['material_id'] = material_data['material_id'].id
            
            ProductMaterial.objects.create(product=instance, **material_data)
        
        return instance

class WorkOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    workstation_name = serializers.CharField(source='workstation.name', read_only=True, allow_null=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    
    # New fields for workflow management
    dependencies = serializers.PrimaryKeyRelatedField(
        queryset=WorkOrder.objects.all(), 
        many=True, 
        required=False, 
        allow_null=True
    )
    can_start = serializers.SerializerMethodField(read_only=True)
    is_overdue = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = WorkOrder
        fields = [
            'id', 
            'product', 
            'product_name',
            'quantity', 
            'start_date', 
            'end_date', 
            'status', 
            'priority',
            'notes',
            'workstation', 
            'workstation_name',
            'assigned_to',
            'assigned_to_username',
            'dependencies',
            'blocking_reason',
            'can_start',
            'is_overdue',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'can_start', 'is_overdue']

    def get_can_start(self, obj):
        return obj.can_start()

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def create(self, validated_data):
        # Extract dependencies if provided
        dependencies_data = validated_data.pop('dependencies', [])
        
        # Additional validation
        if validated_data.get('quantity', 0) <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero")
        
        # Check product availability
        product = validated_data.get('product')
        quantity = validated_data.get('quantity')
        
        # Validate if there are enough materials to create the work order
        for product_material in product.productmaterial_set.all():
            material = product_material.material
            required_quantity = product_material.quantity * quantity
            
            if material.quantity < required_quantity:
                raise serializers.ValidationError(
                    f"Insufficient material {material.name}. "
                    f"Required: {required_quantity}, Available: {material.quantity}"
                )
        
        # Create work order
        work_order = super().create(validated_data)
        
        # Add dependencies
        if dependencies_data:
            work_order.dependencies.set(dependencies_data)
        
        return work_order

    def update(self, instance, validated_data):
        # Extract dependencies if provided
        dependencies_data = validated_data.pop('dependencies', None)
        
        # Update status logic
        new_status = validated_data.get('status', instance.status)
        
        # If work order is completed, set end date
        if new_status == 'COMPLETED' and instance.status != 'COMPLETED':
            validated_data['end_date'] = timezone.now()
        
        # Update work order
        work_order = super().update(instance, validated_data)
        
        # Update dependencies if provided
        if dependencies_data is not None:
            work_order.dependencies.set(dependencies_data)
        
        return work_order

class ProductionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLog
        fields = ['id', 'work_order_id', 'workstation_id', 'quantity_produced', 'wastage', 'start_time', 'end_time', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
