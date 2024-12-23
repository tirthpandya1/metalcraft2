from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone

from .models import ProductOrder, ProductOrderInvoice

@shared_task
def send_order_status_update_notification(order_id):
    """
    Send email notification when order status changes
    """
    try:
        order = ProductOrder.objects.get(id=order_id)
        
        # Render email templates
        email_context = {
            'order': order,
            'company_name': settings.COMPANY_NAME
        }
        
        html_message = render_to_string(
            'emails/orders/status_update.html', 
            email_context
        )
        plain_message = strip_tags(html_message)
        
        # Send email to customer
        send_mail(
            subject=f'{settings.COMPANY_NAME} - Order {order.order_number} Status Update',
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer.email],
            html_message=html_message
        )
    
    except ProductOrder.DoesNotExist:
        # Log error or handle order not found
        pass


@shared_task
def check_overdue_invoices():
    """
    Periodic task to check and notify about overdue invoices
    """
    # Find overdue invoices
    overdue_invoices = ProductOrderInvoice.objects.filter(
        payment_status__in=['UNPAID', 'PARTIALLY_PAID'],
        payment_due_date__lt=timezone.now().date()
    )
    
    if not overdue_invoices.exists():
        return
    
    # Prepare email context
    email_context = {
        'overdue_invoices': overdue_invoices,
        'company_name': settings.COMPANY_NAME
    }
    
    # Render email templates
    html_message = render_to_string(
        'emails/orders/overdue_invoices.html', 
        email_context
    )
    plain_message = strip_tags(html_message)
    
    # Send email to finance team
    send_mail(
        subject=f'{settings.COMPANY_NAME} - Overdue Invoices Alert',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.FINANCE_TEAM_EMAILS,
        html_message=html_message
    )


@shared_task
def send_production_reminder():
    """
    Send reminders for orders in production
    """
    # Find orders in production for more than 7 days
    production_orders = ProductOrder.objects.filter(
        status='IN_PRODUCTION',
        updated_at__lt=timezone.now() - timezone.timedelta(days=7)
    )
    
    if not production_orders.exists():
        return
    
    # Prepare email context
    email_context = {
        'production_orders': production_orders,
        'company_name': settings.COMPANY_NAME
    }
    
    # Render email templates
    html_message = render_to_string(
        'emails/orders/production_reminder.html', 
        email_context
    )
    plain_message = strip_tags(html_message)
    
    # Send email to production team
    send_mail(
        subject=f'{settings.COMPANY_NAME} - Production Backlog Reminder',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.PRODUCTION_TEAM_EMAILS,
        html_message=html_message
    )


@shared_task
def generate_monthly_sales_report():
    """
    Generate and email monthly sales report
    """
    # Calculate start and end of previous month
    end_date = timezone.now().replace(day=1) - timezone.timedelta(days=1)
    start_date = end_date.replace(day=1)
    
    # Aggregate sales data
    monthly_sales = ProductOrder.objects.filter(
        created_at__range=[start_date, end_date]
    ).aggregate(
        total_sales=Sum('total_cost'),
        total_orders=Count('id')
    )
    
    # Prepare email context
    email_context = {
        'monthly_sales': monthly_sales,
        'start_date': start_date,
        'end_date': end_date,
        'company_name': settings.COMPANY_NAME
    }
    
    # Render email templates
    html_message = render_to_string(
        'emails/orders/monthly_sales_report.html', 
        email_context
    )
    plain_message = strip_tags(html_message)
    
    # Send email to management
    send_mail(
        subject=f'{settings.COMPANY_NAME} - Monthly Sales Report',
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=settings.MANAGEMENT_TEAM_EMAILS,
        html_message=html_message
    )
