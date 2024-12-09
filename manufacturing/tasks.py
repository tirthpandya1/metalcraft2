from celery import shared_task
from django.utils import timezone
from .models import WorkOrder, Material, Product, ProductionLog
from .events import WorkflowEvent, EventType

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
    Periodic task to check material stock levels
    Sends notifications for materials below reorder level
    """
    low_stock_materials = Material.objects.filter(
        quantity__lte=models.F('reorder_level')
    )
    
    for material in low_stock_materials:
        WorkflowEvent.dispatch_event(
            EventType.MATERIAL_LOW_STOCK,
            {
                'material_id': material.id,
                'material_name': material.name,
                'current_quantity': material.quantity,
                'reorder_level': material.reorder_level
            }
        )

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
