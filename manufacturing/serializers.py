from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import APIException
import logging
from django.utils import timezone
from .models import (
    WorkStation, Material, Product, ProductMaterial, WorkOrder, 
    ProductionLog, MaterialReservation, WorkstationProcess, 
    WorkstationEfficiencyMetric, ProductionDesign, ProductionEvent, 
    ProductWorkstationSequence, Supplier, SupplierMaterial
)
from .exceptions import MaterialShortageError, WorkOrderStatusTransitionError

# Configure logging
logger = logging.getLogger(__name__)

class MaterialShortageAPIException(APIException):
    """
    Custom API Exception for Material Shortage
    """
    status_code = 400
    default_detail = "Insufficient materials to create work order"
    default_code = 'material_shortage'

    def __init__(self, material_details=None, detail=None):
        if detail is None:
            detail = self.default_detail
        
        # Ensure material details are in a consistent format
        formatted_details = []
        for material in (material_details or []):
            formatted_details.append({
                'material_name': material.get('material_name', 'Unknown Material'),
                'material_id': material.get('material_id'),
                'required_quantity': material.get('required_quantity', 0),
                'available_quantity': material.get('available_quantity', 0),
                'shortage_percentage': material.get('shortage_percentage', 0)
            })
        
        # Prepare error details
        error_details = {
            'type': 'MaterialShortageError',
            'message': detail,
            'material_details': formatted_details
        }
        
        super().__init__(detail=error_details)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

class SupplierMaterialSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_unit = serializers.CharField(source='material.unit', read_only=True)
    material_id = serializers.PrimaryKeyRelatedField(
        queryset=Material.objects.all(),
        source='material'
    )

    class Meta:
        model = SupplierMaterial
        fields = [
            'material_id', 
            'material_name', 
            'material_unit', 
            'typical_lead_time', 
            'typical_price_per_unit', 
            'is_preferred_supplier'
        ]

class SupplierSerializer(serializers.ModelSerializer):
    materials = SupplierMaterialSerializer(
        source='suppliermaterial_set', 
        many=True, 
        read_only=True
    )
    add_materials = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            required=False
        ),
        write_only=True,
        required=False
    )

    class Meta:
        model = Supplier
        fields = [
            'id', 
            'name', 
            'contact_person', 
            'email', 
            'phone', 
            'address', 
            'materials',
            'add_materials',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Extract materials data if provided
        materials_data = validated_data.pop('add_materials', None)
        
        # Create supplier
        supplier = Supplier.objects.create(**validated_data)
        
        # Add materials if provided
        if materials_data:
            for material_info in materials_data:
                material_id = material_info.get('material_id')
                lead_time = material_info.get('typical_lead_time')
                price = material_info.get('typical_price_per_unit')
                is_preferred = material_info.get('is_preferred_supplier', False)
                
                try:
                    material = Material.objects.get(id=material_id)
                    SupplierMaterial.objects.create(
                        supplier=supplier,
                        material=material,
                        typical_lead_time=lead_time,
                        typical_price_per_unit=price,
                        is_preferred_supplier=is_preferred
                    )
                except Material.DoesNotExist:
                    # Optionally handle invalid material ID
                    pass
        
        return supplier

    def update(self, instance, validated_data):
        # Extract materials data if provided
        materials_data = validated_data.pop('add_materials', None)
        
        # Update supplier details
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update materials if provided
        if materials_data:
            # Remove existing supplier-material relationships
            instance.suppliermaterial_set.all().delete()
            
            # Add new materials
            for material_info in materials_data:
                material_id = material_info.get('material_id')
                lead_time = material_info.get('typical_lead_time')
                price = material_info.get('typical_price_per_unit')
                is_preferred = material_info.get('is_preferred_supplier', False)
                
                try:
                    material = Material.objects.get(id=material_id)
                    SupplierMaterial.objects.create(
                        supplier=instance,
                        material=material,
                        typical_lead_time=lead_time,
                        typical_price_per_unit=price,
                        is_preferred_supplier=is_preferred
                    )
                except Material.DoesNotExist:
                    # Optionally handle invalid material ID
                    pass
        
        return instance

class WorkStationSerializer(serializers.ModelSerializer):
    last_maintenance_display = serializers.SerializerMethodField()
    hourly_operating_cost = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = WorkStation
        fields = ['id', 'name', 'description', 'status', 'process_type', 'created_at', 'updated_at', 
                  'last_maintenance', 'last_maintenance_display', 'hourly_operating_cost']
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
    materials = serializers.SerializerMethodField()
    productmaterial_set = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField(),
            required=False
        ),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'materials', 
            'sell_cost', 
            'labor_cost',
            'current_quantity', 
            'restock_level', 
            'max_stock_level', 
            'stock_status', 
            'created_at', 
            'updated_at',
            'productmaterial_set'
        ]
        read_only_fields = ['stock_status', 'created_at', 'updated_at']

    def get_materials(self, obj):
        """
        Retrieve materials for the product with their quantities
        """
        return [
            {
                'material_id': pm.material.id,
                'material_name': pm.material.name,
                'quantity': pm.quantity
            } 
            for pm in obj.productmaterial_set.select_related('material')
        ]

    def validate_productmaterial_set(self, value):
        """
        Validate material requirements:
        1. Ensure unique materials
        2. Validate material existence
        3. Validate quantity > 0
        """
        if not value:
            return value

        material_ids = set()
        validated_materials = []

        for material_data in value:
            material_id = material_data.get('material_id')
            quantity = material_data.get('quantity', 0)

            # Validate material existence
            try:
                material = Material.objects.get(id=material_id)
            except Material.DoesNotExist:
                raise serializers.ValidationError(f"Material with ID {material_id} does not exist")

            # Check for duplicate materials
            if material_id in material_ids:
                raise serializers.ValidationError(f"Duplicate material: {material_id}")
            material_ids.add(material_id)

            # Validate quantity
            if quantity <= 0:
                raise serializers.ValidationError(f"Quantity for material {material_id} must be greater than 0")

            validated_materials.append({
                'material_id': material_id,
                'quantity': quantity
            })

        return validated_materials

    def create(self, validated_data):
        """
        Create product with material requirements
        """
        import logging
        import json
        logger = logging.getLogger('manufacturing')
        
        logger.debug('Product Creation - Raw Validated Data: %s', 
            json.dumps(validated_data, default=str))
        
        productmaterial_set = validated_data.pop('productmaterial_set', [])
        
        validated_data.setdefault('labor_cost', 0.00)
        
        try:
            product = Product.objects.create(**validated_data)
            
            logger.info('Product Created - ID: %s, Name: %s, Labor Cost: %s', 
                product.id, product.name, product.labor_cost)
            
            for material_data in productmaterial_set:
                ProductMaterial.objects.create(
                    product=product, 
                    material_id=material_data.get('material_id'),
                    quantity=material_data.get('quantity', 0)
                )
            
            return product
        except Exception as e:
            logger.error('Error Creating Product: %s', str(e), exc_info=True)
            raise

    def update(self, instance, validated_data):
        """
        Update product with material requirements
        """
        import logging
        import json
        logger = logging.getLogger('manufacturing')
        
        logger.debug('Product Update - Raw Validated Data: %s', 
            json.dumps(validated_data, default=str))
        logger.debug('Existing Product - ID: %s, Current Labor Cost: %s', 
            instance.id, instance.labor_cost)
        
        productmaterial_set = validated_data.pop('productmaterial_set', [])
        
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            if 'labor_cost' not in validated_data:
                validated_data['labor_cost'] = instance.labor_cost or 0.00
            
            instance.save()
            
            logger.info('Product Updated - ID: %s, Name: %s, Labor Cost: %s', 
                instance.id, instance.name, instance.labor_cost)
            
            instance.productmaterial_set.all().delete()
            
            for material_data in productmaterial_set:
                ProductMaterial.objects.create(
                    product=instance, 
                    material_id=material_data.get('material_id'),
                    quantity=material_data.get('quantity', 0)
                )
            
            return instance
        except Exception as e:
            logger.error('Error Updating Product: %s', str(e), exc_info=True)
            raise

    def to_internal_value(self, data):
        """
        Custom validation to ensure labor_cost is handled correctly
        """
        # Ensure labor_cost is converted to a decimal
        if 'labor_cost' in data:
            try:
                data['labor_cost'] = float(data['labor_cost'])
            except (TypeError, ValueError):
                data['labor_cost'] = 0.00
        
        # Log the processed data for debugging
        import logging
        logger = logging.getLogger('manufacturing')
        logger.debug('Product Serializer - Processed Data: %s', data)
        
        return super().to_internal_value(data)

class ProductWorkstationSequenceSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductWorkstationSequence to provide detailed workstation sequence information
    """
    workstation_name = serializers.CharField(source='workstation.name', read_only=True)
    workstation_code = serializers.CharField(source='workstation.code', read_only=True)
    
    class Meta:
        model = ProductWorkstationSequence
        fields = [
            'id', 
            'workstation', 
            'workstation_name', 
            'workstation_code',
            'sequence_order', 
            'estimated_time', 
            'instruction_set'
        ]

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
    product_name = serializers.SerializerMethodField()
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

    def validate(self, data):
        """
        Additional validation for work order creation/update
        """
        # Validate product is provided
        if 'product' not in data:
            raise serializers.ValidationError({"product": "Product is required"})
        
        # Validate quantity
        quantity = data.get('quantity')
        if quantity is None or quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero"})
        
        # Validate start and end dates
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                "start_date": "Start date cannot be later than end date"
            })
        
        return data

    def create(self, validated_data):
        """
        Custom create method with comprehensive validation
        """
        # Log the incoming data for debugging
        logger.info(f"Creating Work Order with data: {validated_data}")
        
        # Extract dependencies if provided
        dependencies_data = validated_data.pop('dependencies', [])
        
        # Check product availability
        product = validated_data.get('product')
        quantity = validated_data.get('quantity')
        
        # Validate if there are enough materials to create the work order
        insufficient_materials = []
        for product_material in product.productmaterial_set.all():
            material = product_material.material
            required_quantity = product_material.quantity * quantity
            
            if material.quantity < required_quantity:
                insufficient_materials.append({
                    'material_name': material.name,
                    'material_id': material.id,
                    'required_quantity': required_quantity,
                    'available_quantity': material.quantity,
                    'shortage_percentage': (required_quantity - material.quantity) / required_quantity * 100
                })
        
        # If there are insufficient materials, raise a detailed error
        if insufficient_materials:
            logger.error(f"Material shortage when creating work order: {insufficient_materials}")
            raise MaterialShortageAPIException(
                material_details=insufficient_materials, 
                detail="Insufficient materials to create work order"
            )
        
        # Set default status if not provided
        if 'status' not in validated_data:
            validated_data['status'] = 'PENDING'
        
        # Set default dates if not provided
        if 'start_date' not in validated_data:
            validated_data['start_date'] = timezone.now()
        
        # Create work order
        try:
            work_order = super().create(validated_data)
            
            # Add dependencies
            if dependencies_data:
                work_order.dependencies.set(dependencies_data)
            
            logger.info(f"Successfully created Work Order: {work_order.id}")
            return work_order
        
        except Exception as e:
            logger.error(f"Error creating Work Order: {str(e)}", exc_info=True)
            raise

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

    def update(self, instance, validated_data):
        # Extract dependencies if present
        dependencies_data = validated_data.pop('dependencies', None)
        
        try:
            # Validate status transition
            new_status = validated_data.get('status', instance.status)
            instance.validate_status_transition(new_status)
            
            # If status is changing to IN_PROGRESS
            if new_status == 'IN_PROGRESS':
                # Check material availability
                material_status = instance.check_material_availability()
                
                if not material_status['available']:
                    # Raise custom exception with material shortage details
                    raise MaterialShortageError(
                        "Insufficient materials to start work order", 
                        material_details=material_status['materials']
                    )
                
                # Reserve materials
                instance.reserve_materials()
            
            elif new_status == 'COMPLETED':
                # Complete work order workflow
                instance.complete_work_order()
            
            elif new_status == 'CANCELLED':
                # Release reserved materials
                instance.release_reserved_materials()
            
            # Update other fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()

            # Handle dependencies separately after save
            if dependencies_data is not None:
                # Clear existing dependencies and set new ones
                instance.dependencies.clear()
                if dependencies_data:
                    instance.dependencies.add(*dependencies_data)
            
            return instance
        
        except (MaterialShortageError, WorkOrderStatusTransitionError) as e:
            # These exceptions will be caught by the custom exception handler
            raise

class ProductionLogSerializer(serializers.ModelSerializer):
    work_order = serializers.SerializerMethodField()
    machine = serializers.SerializerMethodField()
    operation = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at')

    class Meta:
        model = ProductionLog
        fields = [
            'id', 
            'work_order', 
            'machine', 
            'operation', 
            'quantity_produced', 
            'wastage', 
            'timestamp', 
            'notes'
        ]
        read_only_fields = ['id', 'timestamp']

    def get_work_order(self, obj):
        return str(obj.work_order.id) if obj.work_order else None

    def get_machine(self, obj):
        return obj.workstation.name if obj.workstation else None

    def get_operation(self, obj):
        # Derive operation from work order or other logic
        return obj.work_order.product.name if obj.work_order else None

class WorkstationProcessSerializer(serializers.ModelSerializer):
    """
    Serializer for WorkstationProcess model
    Provides detailed information about manufacturing processes
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    workstation_name = serializers.CharField(source='workstation.name', read_only=True)
    
    class Meta:
        model = WorkstationProcess
        fields = [
            'id', 
            'product', 
            'product_name', 
            'workstation', 
            'workstation_name',
            'process_type', 
            'sequence_order', 
            'estimated_time', 
            'instruction_set',
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class WorkstationEfficiencyMetricSerializer(serializers.ModelSerializer):
    """Serializer for WorkstationEfficiencyMetric model
    Provides comprehensive efficiency tracking
    """
    workstation_name = serializers.CharField(source='workstation.name', read_only=True)
    
    # Computed efficiency percentage
    efficiency_percentage = serializers.SerializerMethodField()
    
    # Performance category based on efficiency
    performance_category = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkstationEfficiencyMetric
        fields = [
            'id', 
            'workstation', 
            'workstation_name',
            'total_working_time', 
            'total_idle_time', 
            'total_material_used', 
            'total_material_wasted',
            'total_items_processed', 
            'total_items_with_defects', 
            'timestamp',
            'idle_time_percentage', 
            'material_wastage_percentage', 
            'defect_rate',
            'efficiency_percentage',
            'performance_category'
        ]
        read_only_fields = [
            'id', 'timestamp', 'idle_time_percentage', 
            'material_wastage_percentage', 'defect_rate',
            'efficiency_percentage', 'performance_category'
        ]
    
    def get_efficiency_percentage(self, obj):
        """Calculate overall efficiency percentage"""
        # Combine multiple metrics into a single efficiency score
        # Lower idle time, material wastage, and defect rate means higher efficiency
        idle_penalty = float(obj.idle_time_percentage)
        wastage_penalty = float(obj.material_wastage_percentage)
        defect_penalty = float(obj.defect_rate)
        
        # Calculate efficiency: start at 100 and subtract penalties
        efficiency = max(0, 100 - (idle_penalty + wastage_penalty + defect_penalty))
        return round(efficiency, 2)
    
    def get_performance_category(self, obj):
        """Categorize performance based on efficiency percentage"""
        efficiency = self.get_efficiency_percentage(obj)
        
        if efficiency >= 90:
            return 'HIGH'
        elif efficiency >= 70:
            return 'STANDARD'
        elif efficiency >= 50:
            return 'LOW'
        else:
            return 'CRITICAL'

class ProductionDesignSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductionDesign model
    Manages design specifications and cutting diagrams
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionDesign
        fields = [
            'id', 
            'product', 
            'product_name',
            'design_file', 
            'nested_cutting_diagram', 
            'instruction_set',
            'created_by', 
            'created_by_username',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ProductionEventSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductionEvent model
    Provides comprehensive event tracking for production workflow
    """
    product_name = serializers.CharField(source='product.name', read_only=True)
    work_order_status = serializers.CharField(source='work_order.status', read_only=True)
    workstation_name = serializers.CharField(source='workstation.name', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProductionEvent
        fields = [
            'id', 
            'event_type', 
            'work_order', 
            'work_order_status',
            'product', 
            'product_name',
            'workstation', 
            'workstation_name',
            'details', 
            'created_at', 
            'created_by', 
            'created_by_username'
        ]
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        """
        Custom representation to handle complex event details
        """
        representation = super().to_representation(instance)
        
        # Attempt to parse and format details if it's a dictionary
        if isinstance(representation.get('details'), dict):
            representation['details_summary'] = ', '.join([
                f"{k}: {v}" for k, v in representation['details'].items()
            ])
        
        return representation
