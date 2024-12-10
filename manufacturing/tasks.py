from celery import shared_task
from django.utils import timezone
from .models import WorkOrder, Material, Product, ProductionLog, InventoryHealthReport
from .events import WorkflowEvent, EventType
from django.db.models import F, ExpressionWrapper, FloatField, Sum, Count
from django.db.models.functions import Max
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def process_work_order_completion(self, work_order_id):
    """
    Asynchronous task to process work order completion
    Handles:
    - Material updates
    - Product inventory updates
    - Production logging
    - Event notifications
    """
    try:
        work_order = WorkOrder.objects.get(id=work_order_id)
        
        # 1. Update Product Inventory
        product = work_order.product
        product.current_quantity += work_order.quantity
        product.save()
        
        # 2. Update Material Consumption
        for product_material in product.productmaterial_set.all():
            material = product_material.material
            consumed_quantity = product_material.quantity * work_order.quantity
            material.quantity -= consumed_quantity
            material.save()
        
        # 3. Create Production Log
        production_log = ProductionLog.objects.create(
            work_order=work_order,
            workstation=work_order.workstation,
            quantity_produced=work_order.quantity,
            created_by=work_order.assigned_to
        )
        
        # 4. Update Work Order Status
        work_order.status = 'COMPLETED'
        work_order.end_date = timezone.now()
        work_order.save()
        
        # 5. Trigger Event Notifications
        WorkflowEvent.dispatch_event(
            EventType.WORK_ORDER_COMPLETED,
            {
                'work_order_id': work_order.id,
                'product_name': product.name,
                'quantity_produced': work_order.quantity,
                'total_product_inventory': product.current_quantity
            }
        )
        
        return {
            'status': 'success',
            'work_order_id': work_order_id,
            'product_name': product.name
        }
    
    except WorkOrder.DoesNotExist:
        return {
            'status': 'error',
            'message': f'Work Order {work_order_id} not found'
        }
    except Exception as e:
        # Log the error and re-raise
        self.retry(exc=e, max_retries=3, countdown=60)
        return {
            'status': 'error',
            'message': str(e)
        }

@shared_task
def check_low_stock_materials():
    """
    Advanced periodic task to check material stock levels
    Sends comprehensive notifications for materials below reorder level
    Provides detailed insights and recommendations
    """
    # Fetch materials below reorder level with detailed filtering
    low_stock_materials = Material.objects.annotate(
        shortage_percentage=ExpressionWrapper(
            (F('reorder_level') - F('quantity')) * 100.0 / F('reorder_level'),
            output_field=FloatField()
        )
    ).filter(
        quantity__lte=F('reorder_level')
    ).order_by('shortage_percentage')

    # Track materials for different notification levels
    critical_materials = []
    warning_materials = []
    
    for material in low_stock_materials:
        # Categorize materials based on shortage percentage
        shortage_percentage = material.shortage_percentage
        
        if shortage_percentage >= 75:
            critical_materials.append(material)
        else:
            warning_materials.append(material)
        
        # Dispatch detailed workflow events
        WorkflowEvent.dispatch_event(
            EventType.MATERIAL_LOW_STOCK,
            {
                'material_id': material.id,
                'material_name': material.name,
                'current_quantity': material.quantity,
                'reorder_level': material.reorder_level,
                'shortage_percentage': shortage_percentage,
                'recommended_reorder_quantity': max(
                    material.max_stock_level - material.quantity, 
                    material.reorder_level * 2
                )
            }
        )
    
    # Optional: Send aggregated notification
    if critical_materials or warning_materials:
        send_stock_alert_notification.delay(
            critical_materials=critical_materials, 
            warning_materials=warning_materials
        )
    
    return {
        'total_low_stock_materials': len(low_stock_materials),
        'critical_materials_count': len(critical_materials),
        'warning_materials_count': len(warning_materials)
    }

@shared_task
def send_stock_alert_notification(critical_materials=None, warning_materials=None):
    """
    Send comprehensive stock alert notifications via multiple channels
    """
    critical_materials = critical_materials or []
    warning_materials = warning_materials or []
    
    # Prepare notification content
    notification_content = {
        'subject': 'Inventory Stock Alert',
        'body': '',
        'severity': 'high' if critical_materials else 'medium'
    }
    
    # Construct detailed message
    if critical_materials:
        notification_content['body'] += "CRITICAL LOW STOCK MATERIALS:\n"
        for material in critical_materials:
            notification_content['body'] += (
                f"- {material.name}: {material.quantity} units "
                f"(Reorder Level: {material.reorder_level})\n"
            )
    
    if warning_materials:
        notification_content['body'] += "\nWARNING LOW STOCK MATERIALS:\n"
        for material in warning_materials:
            notification_content['body'] += (
                f"- {material.name}: {material.quantity} units "
                f"(Reorder Level: {material.reorder_level})\n"
            )
    
    # Send notifications via multiple channels
    try:
        # Email notification
        send_email_notification(notification_content)
        
        # Slack/Teams notification
        send_team_chat_notification(notification_content)
        
        # SMS notification for critical materials
        if critical_materials:
            send_sms_notification(notification_content)
    
    except Exception as e:
        logger.error(f"Error sending stock alert notifications: {e}")
    
    return notification_content

def send_email_notification(notification_content):
    """Send email notification about low stock materials"""
    from django.core.mail import send_mail
    
    send_mail(
        subject=notification_content['subject'],
        message=notification_content['body'],
        from_email='inventory@metalcraft.com',
        recipient_list=['inventory_manager@metalcraft.com'],
        fail_silently=False
    )

def send_team_chat_notification(notification_content):
    """Send notification to team communication platform"""
    # Placeholder for Slack/Teams integration
    # You would replace this with actual API calls to your preferred platform
    logger.info(f"Team Chat Notification: {notification_content['body']}")

def send_sms_notification(notification_content):
    """Send SMS notification for critical stock levels"""
    # Placeholder for SMS gateway integration
    # You would replace this with actual SMS gateway API calls
    logger.info(f"SMS Notification: {notification_content['body']}")

@shared_task
def generate_production_report(start_date=None, end_date=None):
    """
    Generate a comprehensive production report
    
    Args:
        start_date (datetime, optional): Start of reporting period
        end_date (datetime, optional): End of reporting period
    """
    if not start_date:
        start_date = timezone.now() - timezone.timedelta(days=30)
    if not end_date:
        end_date = timezone.now()
    
    # Aggregate production data
    production_data = WorkOrder.objects.filter(
        status='COMPLETED',
        end_date__range=[start_date, end_date]
    ).values('product__name').annotate(
        total_quantity=Sum('quantity'),
        total_work_orders=Count('id')
    )
    
    # Dispatch report generation event
    WorkflowEvent.dispatch_event(
        'production.report_generated',
        {
            'start_date': str(start_date),
            'end_date': str(end_date),
            'production_data': list(production_data)
        }
    )
    
    return production_data

@shared_task
def generate_inventory_health_report():
    """
    Generate detailed inventory health report
    """
    # Calculate inventory metrics
    total_materials = Material.objects.count()
    low_stock_materials = Material.objects.filter(quantity__lte=F('reorder_level')).count()
    
    report = {
        'total_materials': total_materials,
        'low_stock_materials': low_stock_materials,
        'low_stock_percentage': (low_stock_materials / total_materials) * 100 if total_materials > 0 else 0,
        'generated_at': timezone.now()
    }
    
    # Optional: Store report in database or send via email
    InventoryHealthReport.objects.create(**report)
    
    return report

@shared_task(run_every=timedelta(hours=6))
def periodic_inventory_check():
    """
    Comprehensive periodic inventory management task
    Runs checks and generates reports
    """
    low_stock_result = check_low_stock_materials.delay()
    
    # Optional: Generate inventory health report
    generate_inventory_health_report.delay()
    
    return low_stock_result
