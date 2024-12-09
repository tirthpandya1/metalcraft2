from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

# Create your models here.

# Get the current user model
User = get_user_model()

class WorkStation(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('MAINTENANCE', 'Maintenance')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
    
    class Meta:
        ordering = ['-priority', '-created_at']
        verbose_name = 'Work Order'
        verbose_name_plural = 'Work Orders'

class ProductionLog(models.Model):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE)
    workstation = models.ForeignKey(WorkStation, on_delete=models.CASCADE)
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
