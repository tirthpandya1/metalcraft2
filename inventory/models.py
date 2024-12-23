from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.conf import settings
from manufacturing.models import Material
from manufacturing.models import Supplier

class MaterialOrder(models.Model):
    """
    Represents a purchase order for materials from a specific supplier
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('ORDERED', 'Ordered'),
        ('PARTIALLY_RECEIVED', 'Partially Received'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled')
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent')
    ]

    # Relationship to Supplier
    supplier = models.ForeignKey(
        Supplier, 
        on_delete=models.SET_NULL, 
        related_name='material_orders',
        null=True
    )

    # Order Details
    order_number = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Unique identifier for the material order"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='DRAFT'
    )
    
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='MEDIUM'
    )

    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expected_delivery_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Expected date of material delivery"
    )

    # Financial Details
    total_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Notes and Additional Information
    internal_notes = models.TextField(
        blank=True, 
        null=True, 
        help_text="Internal notes about the order"
    )
    
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        related_name='requested_material_orders',
        null=True
    )

    def __str__(self):
        return f"Material Order {self.order_number} - {self.supplier.name if self.supplier else 'No Supplier'}"

    class Meta:
        verbose_name = "Material Order"
        verbose_name_plural = "Material Orders"
        ordering = ['-created_at']


class MaterialOrderItem(models.Model):
    """
    Represents individual items in a material order
    """
    order = models.ForeignKey(
        MaterialOrder, 
        related_name='items', 
        on_delete=models.CASCADE
    )
    
    material = models.ForeignKey(
        Material, 
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    
    quantity_ordered = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    quantity_received = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    total_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    status = models.CharField(
        max_length=20, 
        choices=[
            ('PENDING', 'Pending'),
            ('PARTIALLY_RECEIVED', 'Partially Received'),
            ('COMPLETED', 'Completed')
        ],
        default='PENDING'
    )

    def save(self, *args, **kwargs):
        # Automatically calculate total price
        self.total_price = self.quantity_ordered * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.material.name} - Order {self.order.order_number}"

    class Meta:
        verbose_name = "Material Order Item"
        verbose_name_plural = "Material Order Items"


class Invoice(models.Model):
    """
    Represents an invoice for a material order
    """
    material_order = models.OneToOneField(
        MaterialOrder, 
        on_delete=models.CASCADE, 
        related_name='invoice'
    )
    
    invoice_number = models.CharField(
        max_length=50, 
        unique=True
    )
    
    invoice_date = models.DateField()
    
    total_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    payment_status = models.CharField(
        max_length=20, 
        choices=[
            ('UNPAID', 'Unpaid'),
            ('PARTIALLY_PAID', 'Partially Paid'),
            ('PAID', 'Paid')
        ],
        default='UNPAID'
    )
    
    payment_due_date = models.DateField()
    
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.material_order.order_number}"

    class Meta:
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"
