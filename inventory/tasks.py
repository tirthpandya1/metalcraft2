from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import Material
from suppliers.models import Supplier

@shared_task
def check_low_stock_and_notify():
    """
    Periodic task to check for low stock materials and send notifications
    """
    # Find materials below reorder level
    low_stock_materials = Material.objects.filter(
        quantity__lte=F('reorder_level')
    )
    
    if not low_stock_materials.exists():
        return
    
    # Prepare email context
    email_context = {
        'low_stock_materials': low_stock_materials,
        'company_name': settings.COMPANY_NAME
    }
    
    # Render email templates
    html_message = render_to_string(
        'emails/procurement/low_stock_alert.html', 
        email_context
    )
    plain_message = strip_tags(html_message)
    
    # Send email to procurement team
    send_mail(
        subject=f'{settings.COMPANY_NAME} - Low Stock Alert',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.PROCUREMENT_TEAM_EMAILS,
        html_message=html_message
    )
    
    # Automatically create purchase orders for low stock materials
    for material in low_stock_materials:
        create_automatic_purchase_order.delay(material.id)


@shared_task
def create_automatic_purchase_order(material_id):
    """
    Create an automatic purchase order for a low stock material
    """
    try:
        material = Material.objects.get(id=material_id)
        
        # Calculate order quantity
        order_quantity = material.max_stock_level - material.quantity
        
        # Find preferred suppliers for this material
        preferred_suppliers = material.suppliers.filter(
            is_preferred_supplier=True
        )
        
        if not preferred_suppliers.exists():
            # Fallback to all suppliers if no preferred supplier
            preferred_suppliers = material.suppliers.all()
        
        if not preferred_suppliers.exists():
            # No suppliers found, send an alert
            send_no_supplier_alert.delay(material_id)
            return
        
        # Choose the first preferred supplier
        supplier = preferred_suppliers.first()
        
        # Create material order
        material_order = MaterialOrder.objects.create(
            supplier=supplier,
            status='DRAFT',
            priority='HIGH',
            expected_delivery_date=timezone.now() + timedelta(days=7),
            internal_notes=f'Automatic reorder for low stock material: {material.name}'
        )
        
        # Create order item
        MaterialOrderItem.objects.create(
            order=material_order,
            material=material,
            quantity_ordered=order_quantity,
            unit_price=material.typical_price_per_unit,
            total_price=order_quantity * material.typical_price_per_unit
        )
        
        # Update material order total cost
        material_order.total_cost = material_order.items.aggregate(
            total=Sum('total_price')
        )['total'] or 0
        material_order.save()
        
        # Notify procurement team about automatic order
        send_automatic_order_notification.delay(material_order.id)
    
    except Material.DoesNotExist:
        # Log error or handle material not found
        pass


@shared_task
def send_no_supplier_alert(material_id):
    """
    Send an alert when no suppliers are found for a material
    """
    try:
        material = Material.objects.get(id=material_id)
        
        # Render email templates
        email_context = {
            'material': material,
            'company_name': settings.COMPANY_NAME
        }
        
        html_message = render_to_string(
            'emails/procurement/no_supplier_alert.html', 
            email_context
        )
        plain_message = strip_tags(html_message)
        
        # Send email to procurement team
        send_mail(
            subject=f'{settings.COMPANY_NAME} - No Supplier Found for Low Stock Material',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=settings.PROCUREMENT_TEAM_EMAILS,
            html_message=html_message
        )
    
    except Material.DoesNotExist:
        # Log error or handle material not found
        pass


@shared_task
def send_automatic_order_notification(material_order_id):
    """
    Send notification about an automatically created purchase order
    """
    try:
        material_order = MaterialOrder.objects.get(id=material_order_id)
        
        # Render email templates
        email_context = {
            'material_order': material_order,
            'company_name': settings.COMPANY_NAME
        }
        
        html_message = render_to_string(
            'emails/procurement/automatic_order_created.html', 
            email_context
        )
        plain_message = strip_tags(html_message)
        
        # Send email to procurement team
        send_mail(
            subject=f'{settings.COMPANY_NAME} - Automatic Purchase Order Created',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=settings.PROCUREMENT_TEAM_EMAILS,
            html_message=html_message
        )
    
    except MaterialOrder.DoesNotExist:
        # Log error or handle order not found
        pass
