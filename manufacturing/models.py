from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

# Create your models here.

# Get the current user model
User = get_user_model()

class WorkStation(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    status_choices = [
        ('ACTIVE', 'Active'),
        ('MAINTENANCE', 'Maintenance'),
        ('INACTIVE', 'Inactive')
    ]
    
    status = models.CharField(
        max_length=20, 
        choices=status_choices, 
        default='ACTIVE'
    )
    
    # New field to track last maintenance
    last_maintenance = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text='Date and time of last maintenance'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Track last maintenance when status changes from MAINTENANCE to ACTIVE
        original = None
        if self.pk:
            original = WorkStation.objects.get(pk=self.pk)
        
        # If status was MAINTENANCE and is now ACTIVE, update last_maintenance
        if (original and 
            original.status == 'MAINTENANCE' and 
            self.status == 'ACTIVE'):
            self.last_maintenance = timezone.now()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Material(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reorder_level = models.DecimalField(max_digits=10, decimal_places=2)
    cost_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        default=0.00
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    STOCK_STATUS_CHOICES = [
        ('IN_STOCK', 'In Stock'),
        ('LOW_STOCK', 'Low Stock'),
        ('OUT_OF_STOCK', 'Out of Stock'),
        ('DISCONTINUED', 'Discontinued')
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    materials = models.ManyToManyField(Material, through='ProductMaterial')
    
    # New stock-related fields
    current_quantity = models.IntegerField(default=0)
    restock_level = models.IntegerField(default=10)
    max_stock_level = models.IntegerField(default=100)
    stock_status = models.CharField(
        max_length=20, 
        choices=STOCK_STATUS_CHOICES, 
        default='IN_STOCK'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def update_stock_status(self, save_instance=True):
        """
        Compute stock status based on current quantity and restock level
        """
        if self.current_quantity <= 0:
            self.stock_status = 'OUT_OF_STOCK'
        elif self.current_quantity <= self.restock_level:
            self.stock_status = 'LOW_STOCK'
        elif self.current_quantity >= self.max_stock_level:
            self.stock_status = 'IN_STOCK'
        else:
            self.stock_status = 'IN_STOCK'
        
        if save_instance:
            # Use update to avoid recursive save
            Product.objects.filter(pk=self.pk).update(stock_status=self.stock_status)

    def save(self, *args, **kwargs):
        # Call update_stock_status with save_instance=False to prevent recursion
        self.update_stock_status(save_instance=False)
        
        # Call the parent save method
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (Stock: {self.current_quantity})"

class ProductMaterial(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('product', 'material')

class WorkOrder(models.Model):
    WORK_ORDER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('QUEUED', 'Queued'),
        ('READY', 'Ready to Start'),
        ('IN_PROGRESS', 'In Progress'),
        ('PAUSED', 'Paused'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('BLOCKED', 'Blocked')
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('HIGH', 'High Priority'),
        ('CRITICAL', 'Critical Priority')
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='work_orders')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=WORK_ORDER_STATUS_CHOICES, 
        default='PENDING'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIUM'
    )
    
    # Tracking fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Optional notes or description
    notes = models.TextField(null=True, blank=True)
    
    # Reference to the specific workstation if applicable
    workstation = models.ForeignKey(
        'WorkStation', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='work_orders'
    )
    
    # Reference to the assigned user if applicable
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Workflow tracking
    dependencies = models.ManyToManyField('self', symmetrical=False, blank=True, related_name='dependent_orders')
    blocking_reason = models.TextField(null=True, blank=True)
    
    def validate_status_transition(self, new_status):
        """
        Validate allowed status transitions
        Prevents invalid workflow movements
        """
        valid_transitions = {
            'PENDING': ['QUEUED', 'READY', 'CANCELLED'],
            'QUEUED': ['READY', 'CANCELLED'],
            'READY': ['IN_PROGRESS', 'CANCELLED'],
            'IN_PROGRESS': ['PAUSED', 'COMPLETED', 'BLOCKED', 'CANCELLED'],
            'PAUSED': ['IN_PROGRESS', 'CANCELLED'],
            'BLOCKED': ['READY', 'CANCELLED'],
            'COMPLETED': [],  # Terminal state
            'CANCELLED': []   # Terminal state
        }

        if new_status not in valid_transitions.get(self.status, []):
            raise ValueError(f"Invalid status transition from {self.status} to {new_status}")

    def check_material_availability(self):
        """
        Comprehensive material availability check
        
        Returns a dictionary with:
        - available: Boolean indicating if all materials are available
        - materials: List of materials with insufficient quantities
        """
        # Get materials required for the product
        product_materials = ProductMaterial.objects.filter(product=self.product)
        
        material_status = {
            'available': True,
            'materials': []
        }
        
        # Debug logging
        print(f"Checking material availability for Work Order {self.id}")
        print(f"Product: {self.product.name}")
        print(f"Work Order Quantity: {self.quantity}")
        print(f"Total Product Materials: {product_materials.count()}")
        
        for product_material in product_materials:
            material = product_material.material
            required_quantity = product_material.quantity * self.quantity
            
            # Additional debug logging
            print(f"Material: {material.name}")
            print(f"Material Quantity: {material.quantity}")
            print(f"Required Quantity: {required_quantity}")
            
            if material.quantity < required_quantity:
                material_status['available'] = False
                material_status['materials'].append({
                    'material_id': material.id,
                    'material_name': material.name,
                    'required_quantity': required_quantity,
                    'available_quantity': material.quantity
                })
                
                # More detailed debug logging for insufficient materials
                print(f"INSUFFICIENT MATERIAL: {material.name}")
                print(f"Available: {material.quantity}")
                print(f"Required: {required_quantity}")
        
        return material_status

    def reserve_materials(self):
        """
        Reserve materials for the work order
        Reduces material quantities and tracks reservations
        """
        # First, print out product materials for debugging
        self.print_product_materials()
        
        # Check material availability
        material_status = self.check_material_availability()
        
        if not material_status['available']:
            # Raise a more informative error
            error_message = "Insufficient materials to start work order:\n"
            for material in material_status['materials']:
                error_message += (
                    f"Material: {material['material_name']} "
                    f"(ID: {material['material_id']})\n"
                    f"Required: {material['required_quantity']} "
                    f"Available: {material['available_quantity']}\n"
                )
            raise ValueError(error_message)
        
        # Get materials required for the product
        product_materials = ProductMaterial.objects.filter(product=self.product)
        
        # Create material reservations
        for product_material in product_materials:
            material = product_material.material
            required_quantity = product_material.quantity * self.quantity
            
            MaterialReservation.objects.create(
                work_order=self,
                material=material,
                quantity_reserved=required_quantity
            )
        
        # Update work order status
        self.status = 'IN_PROGRESS'
        self.start_date = timezone.now()
        self.save()

    def release_reserved_materials(self):
        """
        Release reserved materials when work order is cancelled
        """
        # Retrieve material reservations
        material_reservations = self.material_reservations.all()
        
        # Delete material reservations
        material_reservations.delete()
        
        # Update work order status
        self.status = 'CANCELLED'
        self.save()

    def complete_work_order(self):
        """
        Complete work order workflow
        Updates product quantity, logs production, releases materials
        """
        # Validate current status
        self.validate_status_transition('COMPLETED')

        # Retrieve material reservations
        material_reservations = self.material_reservations.all()

        # Deduct materials from inventory
        for reservation in material_reservations:
            material = reservation.material
            material.quantity -= reservation.quantity_reserved
            material.save()

        # Update product quantity
        self.product.current_quantity += self.quantity
        self.product.update_stock_status()
        self.product.save()

        # Create production log with optional workstation
        log_data = {
            'work_order': self,
            'quantity_produced': self.quantity,
            'created_by': self.assigned_to
        }

        # Only add workstation if it exists
        if self.workstation:
            log_data['workstation'] = self.workstation

        ProductionLog.objects.create(**log_data)

        # Mark work order as completed
        self.status = 'COMPLETED'
        self.end_date = timezone.now()
        self.save()

        # Delete material reservations after completion
        material_reservations.delete()

    def save(self, *args, **kwargs):
        """
        Override save method to handle workflow logic
        """
        # Perform stock status update before saving
        if hasattr(self, 'product'):
            self.product.update_stock_status(save_instance=False)
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Work Order for {self.product.name} - {self.status}"

    def calculate_estimated_completion(self):
        """
        Estimate completion time based on product and quantity
        This is a placeholder and should be replaced with more sophisticated logic
        """
        # Assume 1 hour per unit as a basic estimation
        estimated_hours = float(self.quantity)
        return self.start_date + timezone.timedelta(hours=estimated_hours) if self.start_date else None
    
    def is_overdue(self):
        """
        Check if the work order is overdue
        """
        return (
            self.status not in ['COMPLETED', 'CANCELLED'] and 
            self.end_date and 
            timezone.now() > self.end_date
        )
    
    def can_start(self):
        """
        Check if all dependencies are completed
        """
        return all(dep.status == 'COMPLETED' for dep in self.dependencies.all())
    
    def update_status(self, new_status):
        """
        Update work order status with validation
        """
        if new_status not in dict(self.WORK_ORDER_STATUS_CHOICES):
            raise ValueError("Invalid status")
        
        self.status = new_status
        self.save()

    def print_product_materials(self):
        """
        Debug method to print out all materials for this product
        """
        print(f"\n--- Product Materials for {self.product.name} ---")
        product_materials = ProductMaterial.objects.filter(product=self.product)
        
        print(f"Total Product Materials: {product_materials.count()}")
        for pm in product_materials:
            print(f"Material: {pm.material.name}")
            print(f"Material Quantity: {pm.material.quantity}")
            print(f"Required Quantity per Unit: {pm.quantity}")
            print(f"Total Required for Work Order: {pm.quantity * self.quantity}")
            print("---")

    class Meta:
        ordering = ['-priority', '-created_at']
        verbose_name = 'Work Order'
        verbose_name_plural = 'Work Orders'

class MaterialReservation(models.Model):
    """
    Track material reservations for work orders
    Enables precise material tracking and potential rollback
    """
    work_order = models.ForeignKey(
        WorkOrder, 
        on_delete=models.CASCADE, 
        related_name='material_reservations'
    )
    material = models.ForeignKey(
        Material, 
        on_delete=models.CASCADE, 
        related_name='reservations'
    )
    quantity_reserved = models.DecimalField(
        max_digits=10, 
        decimal_places=2
    )
    reserved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.material.name} - {self.quantity_reserved} (WO: {self.work_order_id})"

class ProductionLog(models.Model):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE)
    workstation = models.ForeignKey(WorkStation, on_delete=models.CASCADE, null=True)
    quantity_produced = models.IntegerField()
    wastage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add efficiency calculation
    efficiency_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True, 
        help_text="Calculated efficiency rate (0-100%)"
    )

    def calculate_efficiency(self):
        """
        Calculate efficiency based on quantity produced vs expected quantity
        This is a placeholder method and should be customized based on specific business logic
        """
        try:
            expected_quantity = self.work_order.quantity
            efficiency = (self.quantity_produced / float(expected_quantity)) * 100 if expected_quantity > 0 else 0
            self.efficiency_rate = min(max(efficiency, 0), 100)  # Clamp between 0 and 100
            self.save()
        except Exception as e:
            print(f"Error calculating efficiency: {e}")
        
        return self.efficiency_rate

    def save(self, *args, **kwargs):
        # Automatically calculate efficiency before saving
        if not self.efficiency_rate:
            self.calculate_efficiency()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Log-{self.id} - WO-{self.work_order.id}"

class WorkstationProcess(models.Model):
    """
    Defines a specific manufacturing process for a product at a workstation
    """
    PROCESS_TYPE_CHOICES = [
        ('AUTOMATIC', 'Automatic'),
        ('MANUAL', 'Manual'),
    ]

    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='processes')
    workstation = models.ForeignKey('WorkStation', on_delete=models.CASCADE, related_name='processes')
    
    process_type = models.CharField(
        max_length=20, 
        choices=PROCESS_TYPE_CHOICES, 
        default='MANUAL'
    )
    
    sequence_order = models.PositiveIntegerField(
        help_text='Order of this process in the manufacturing sequence'
    )
    
    estimated_time = models.DurationField(
        null=True, 
        blank=True, 
        help_text='Estimated time to complete this process'
    )
    
    instruction_set = models.JSONField(
        null=True, 
        blank=True, 
        help_text='Machine-specific instruction set for this process'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sequence_order']
        unique_together = ('product', 'workstation', 'sequence_order')

    def __str__(self):
        return f"{self.product.name} - {self.workstation.name} Process"

class WorkstationEfficiencyMetric(models.Model):
    """
    Tracks detailed efficiency metrics for each workstation
    """
    workstation = models.ForeignKey('WorkStation', on_delete=models.CASCADE, related_name='efficiency_metrics')
    
    # Time-based efficiency
    total_working_time = models.DurationField(default=timezone.timedelta(seconds=0))
    total_idle_time = models.DurationField(default=timezone.timedelta(seconds=0))
    
    # Material efficiency
    total_material_used = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    total_material_wasted = models.DecimalField(max_digits=15, decimal_places=4, default=0)
    
    # Performance metrics
    total_items_processed = models.IntegerField(default=0)
    total_items_with_defects = models.IntegerField(default=0)
    
    # Timestamp for tracking
    timestamp = models.DateTimeField(auto_now_add=True)

    @property
    def idle_time_percentage(self):
        """Calculate percentage of idle time"""
        total_time = self.total_working_time + self.total_idle_time
        return (self.total_idle_time / total_time * 100) if total_time > timezone.timedelta(seconds=0) else 0

    @property
    def material_wastage_percentage(self):
        """Calculate percentage of material wasted"""
        return (self.total_material_wasted / self.total_material_used * 100) if self.total_material_used > 0 else 0

    @property
    def defect_rate(self):
        """Calculate defect rate"""
        return (self.total_items_with_defects / self.total_items_processed * 100) if self.total_items_processed > 0 else 0

    def __str__(self):
        return f"{self.workstation.name} Efficiency Metrics - {self.timestamp}"

class ProductionDesign(models.Model):
    """
    Stores design specifications and nested cutting diagrams
    """
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='designs')
    
    design_file = models.FileField(
        upload_to='production_designs/', 
        null=True, 
        blank=True
    )
    
    nested_cutting_diagram = models.FileField(
        upload_to='nested_diagrams/', 
        null=True, 
        blank=True
    )
    
    instruction_set = models.JSONField(
        null=True, 
        blank=True, 
        help_text='Machine-specific instruction set for cutting/design'
    )
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Design for {self.product.name}"

class ProductionEvent(models.Model):
    """
    Comprehensive event tracking for production workflow
    """
    EVENT_TYPES = [
        ('WORK_ORDER_CREATED', 'Work Order Created'),
        ('WORK_ORDER_STARTED', 'Work Order Started'),
        ('WORK_ORDER_COMPLETED', 'Work Order Completed'),
        ('WORKSTATION_PROCESSING_STARTED', 'Workstation Processing Started'),
        ('WORKSTATION_PROCESSING_COMPLETED', 'Workstation Processing Completed'),
        ('MATERIAL_USED', 'Material Used'),
        ('MATERIAL_WASTED', 'Material Wasted'),
        ('QUALITY_CHECK_PASSED', 'Quality Check Passed'),
        ('QUALITY_CHECK_FAILED', 'Quality Check Failed'),
        ('PACKAGING_STARTED', 'Packaging Started'),
        ('PACKAGING_COMPLETED', 'Packaging Completed'),
    ]

    event_type = models.CharField(
        max_length=50, 
        choices=EVENT_TYPES
    )
    
    work_order = models.ForeignKey('WorkOrder', on_delete=models.CASCADE, related_name='events')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='events')
    workstation = models.ForeignKey('WorkStation', on_delete=models.SET_NULL, null=True, related_name='events')
    
    details = models.JSONField(
        null=True, 
        blank=True, 
        help_text='Additional event-specific details'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} - {self.product.name} - {self.created_at}"
