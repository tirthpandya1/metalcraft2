from rest_framework import serializers
from django.contrib.auth.models import User
from .models import WorkStation, Material, Product, ProductMaterial, WorkOrder, ProductionLog, MaterialReservation
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class WorkStationSerializer(serializers.ModelSerializer):
    last_maintenance_display = serializers.SerializerMethodField()

    class Meta:
        model = WorkStation
        fields = ['id', 'name', 'description', 'status', 'created_at', 'updated_at', 
                  'last_maintenance', 'last_maintenance_display']
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_maintenance']

    def get_last_maintenance_display(self, obj):
        """
        Format last maintenance date for display
        """
        if obj.last_maintenance:
            return obj.last_maintenance.strftime('%Y-%m-%d %H:%M:%S')
        return 'No maintenance records'

class MaterialSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = ['id', 'name', 'description', 'quantity', 'unit', 'reorder_level', 'cost_per_unit', 'created_at', 'status']
        read_only_fields = ['id', 'created_at', 'status']

    def get_status(self, obj):
        """
        Compute stock status based on quantity and reorder level
        """
        try:
            quantity = float(obj.quantity)
            reorder_level = float(obj.reorder_level)

            if quantity <= 0:
                return 'Out of Stock'
            
            if quantity <= reorder_level:
                return 'Low Stock'
            
            return 'In Stock'
        except (TypeError, ValueError):
            return 'Unknown'

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
    stock_status_display = serializers.CharField(source='get_stock_status_display', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'materials', 
            'current_quantity', 
            'restock_level', 
            'max_stock_level', 
            'stock_status', 
            'stock_status_display',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'stock_status', 'stock_status_display']

    def create(self, validated_data):
        # Extract materials data, ensuring we handle potential Material objects
        materials_data = validated_data.pop('productmaterial_set', [])
        
        # Create the product with stock-related fields
        product = Product.objects.create(**validated_data)
        
        # Create associated product materials
        for material_data in materials_data:
            # Ensure material_id is an integer
            if isinstance(material_data['material_id'], Material):
                material_data['material_id'] = material_data['material_id'].id
            
            ProductMaterial.objects.create(
                product=product, 
                material_id=material_data['material_id'],
                quantity=material_data.get('quantity', 0)
            )
        
        # Update stock status
        product.update_stock_status()
        
        return product

    def update(self, instance, validated_data):
        materials_data = validated_data.pop('productmaterial_set', [])
        
        # Update basic product fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.current_quantity = validated_data.get('current_quantity', instance.current_quantity)
        instance.restock_level = validated_data.get('restock_level', instance.restock_level)
        instance.max_stock_level = validated_data.get('max_stock_level', instance.max_stock_level)
        
        instance.save()  # This will trigger stock status update
        
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

class MaterialReservationSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = MaterialReservation
        fields = [
            'id', 
            'material', 
            'material_name', 
            'quantity_reserved', 
            'reserved_at'
        ]

class WorkOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField(read_only=True)
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
    material_reservations = MaterialReservationSerializer(many=True, read_only=True)
    
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
            'material_reservations',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'can_start', 'is_overdue', 'material_reservations']

    def get_product_name(self, obj):
        """
        Safely get the product name, handling cases where product might be None
        """
        try:
            return obj.product.name if obj.product else 'No Product'
        except Exception as e:
            print(f"Error fetching product name: {e}")
            return 'No Product'

    def get_can_start(self, obj):
        return obj.can_start()

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def validate_status(self, value):
        """
        Validate work order status transitions
        """
        instance = getattr(self, 'instance', None)
        if instance:
            try:
                instance.validate_status_transition(value)
            except ValueError as e:
                raise serializers.ValidationError(str(e))
        return value

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
        """
        Custom update method to handle workflow logic
        """
        # Check if status is being changed
        if 'status' in validated_data:
            new_status = validated_data['status']
            
            # Perform specific actions based on status
            if new_status == 'IN_PROGRESS':
                # Check material availability and reserve
                material_status = instance.check_material_availability()
                if not material_status['available']:
                    raise serializers.ValidationError({
                        'status': 'Insufficient materials to start work order',
                        'material_details': material_status['materials']
                    })
                
                # Reserve materials
                instance.reserve_materials()
            
            elif new_status == 'COMPLETED':
                # Complete work order workflow
                instance.complete_work_order()
            
            elif new_status == 'CANCELLED':
                # Release reserved materials
                instance.release_reserved_materials()
        
        # Proceed with standard update
        return super().update(instance, validated_data)

class ProductionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionLog
        fields = ['id', 'work_order_id', 'workstation_id', 'quantity_produced', 'wastage', 'start_time', 'end_time', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']
