from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.

class WorkStation(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Maintenance')
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
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    materials = models.ManyToManyField(Material, through='ProductMaterial')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProductMaterial(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ('product', 'material')

class WorkOrder(models.Model):
    WORK_ORDER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled')
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
            self.status != 'COMPLETED' and 
            self.end_date and 
            timezone.now() > self.end_date
        )
    
    class Meta:
        ordering = ['-created_at']
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

    def __str__(self):
        return f"Log-{self.id} - WO-{self.work_order.id}"
