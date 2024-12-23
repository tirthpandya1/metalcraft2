from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.conf import settings

class ProductOrder(models.Model):
    """
    Represents a customer product order
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Confirmation'),
        ('CONFIRMED', 'Confirmed'),
        ('IN_PRODUCTION', 'In Production'),
        ('QUALITY_CHECK', 'Quality Check'),
        ('READY_TO_SHIP', 'Ready to Ship'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned')
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('STANDARD', 'Standard'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent')
    ]

    # Customer and Order Details
    customer = models.ForeignKey(
        'customers.Customer', 
        on_delete=models.SET_NULL, 
        related_name='product_orders',
        null=True
    )

    order_number = models.CharField(
        max_length=50, 
        unique=True, 
        help_text="Unique identifier for the product order"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='DRAFT'
    )
    
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_CHOICES, 
        default='STANDARD'
    )

    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    expected_production_start = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Expected date to start production"
    )
    
    expected_delivery_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Expected date of product delivery"
    )

    # Financial Details
    total_cost = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )

    # Shipping Details
    shipping_method = models.CharField(
        max_length=50, 
        null=True, 
        blank=True
    )
    
    shipping_cost = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    tracking_number = models.CharField(
        max_length=100, 
        null=True, 
        blank=True
    )

    # Notes and Additional Information
    customer_notes = models.TextField(
        blank=True, 
        null=True, 
        help_text="Notes from the customer"
    )
    
    internal_notes = models.TextField(
        blank=True, 
        null=True, 
        help_text="Internal notes about the order"
    )

    # Sales Representative
    sales_rep = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        related_name='managed_product_orders',
        null=True
    )

    def __str__(self):
        return f"Product Order {self.order_number} - {self.customer.name if self.customer else 'No Customer'}"

    class Meta:
        verbose_name = "Product Order"
        verbose_name_plural = "Product Orders"
        ordering = ['-created_at']
        permissions = [
            ("can_manage_orders", "Can manage product orders"),
            ("can_view_sensitive_order_info", "Can view sensitive order information")
        ]


class ProductOrderItem(models.Model):
    """
    Represents individual product items within a product order
    """
    order = models.ForeignKey(
        ProductOrder, 
        related_name='items', 
        on_delete=models.CASCADE
    )
    
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.PROTECT,
        related_name='order_items'
    )
    
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)]
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
    
    production_status = models.CharField(
        max_length=20, 
        choices=[
            ('PENDING', 'Pending'),
            ('IN_PRODUCTION', 'In Production'),
            ('QUALITY_CHECK', 'Quality Check'),
            ('COMPLETED', 'Completed')
        ],
        default='PENDING'
    )
    
    customization_details = models.JSONField(
        null=True, 
        blank=True, 
        help_text="JSON field for storing product customization details"
    )

    def save(self, *args, **kwargs):
        # Automatically calculate total price
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - Order {self.order.order_number}"

    class Meta:
        verbose_name = "Product Order Item"
        verbose_name_plural = "Product Order Items"


class ProductOrderInvoice(models.Model):
    """
    Represents an invoice for a product order
    """
    product_order = models.OneToOneField(
        ProductOrder, 
        on_delete=models.CASCADE, 
        related_name='invoice'
    )
    
    invoice_number = models.CharField(
        max_length=50, 
        unique=True
    )
    
    invoice_date = models.DateField(default=timezone.now)
    
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
            ('PAID', 'Paid'),
            ('OVERDUE', 'Overdue')
        ],
        default='UNPAID'
    )
    
    payment_due_date = models.DateField()
    
    payment_method = models.CharField(
        max_length=50, 
        null=True, 
        blank=True
    )
    
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Invoice {self.invoice_number} - Order {self.product_order.order_number}"

    class Meta:
        verbose_name = "Product Order Invoice"
        verbose_name_plural = "Product Order Invoices"


class OrderStatusTransition(models.Model):
    """
    Tracks status transitions for product orders
    """
    product_order = models.ForeignKey(
        ProductOrder, 
        related_name='status_transitions', 
        on_delete=models.CASCADE
    )
    
    from_status = models.CharField(
        max_length=20, 
        choices=ProductOrder.STATUS_CHOICES
    )
    
    to_status = models.CharField(
        max_length=20, 
        choices=ProductOrder.STATUS_CHOICES
    )
    
    transitioned_at = models.DateTimeField(auto_now_add=True)
    
    transitioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )
    
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.product_order.order_number}: {self.from_status} -> {self.to_status}"

    class Meta:
        verbose_name = "Order Status Transition"
        verbose_name_plural = "Order Status Transitions"
        ordering = ['-transitioned_at']
