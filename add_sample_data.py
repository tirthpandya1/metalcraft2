import os
import django
import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "metalcraft.settings")
django.setup()

# Import Django models
from manufacturing.models import (
    Material, Product, WorkStation, 
    WorkstationEfficiencyMetric, ProductionLog, WorkOrder
)

# Get the default user
User = get_user_model()

def create_sample_data():
    # Get or create a default user
    user, _ = User.objects.get_or_create(
        username='admin', 
        defaults={'email': 'admin@example.com'}
    )

    # Create Materials
    ss_sheet = Material.objects.create(
        name='SS Sheet',
        unit='pieces',
        quantity=1000,
        reorder_level=100,
        cost_per_unit=50.00,
        description='Stainless Steel Sheet for Manufacturing'
    )

    aluminium_sheet = Material.objects.create(
        name='Aluminium Sheet',
        unit='pieces',
        quantity=800,
        reorder_level=80,
        cost_per_unit=40.00,
        description='Aluminium Sheet for Manufacturing'
    )

    # Create Products
    ss_flex_box = Product.objects.create(
        name='SS Flex Box',
        description='Flexible Stainless Steel Box',
        current_quantity=200,
        max_stock_level=500,
        restock_level=50
    )
    ss_flex_box.materials.add(ss_sheet, through_defaults={'quantity': 2})

    aluminium_flex_box = Product.objects.create(
        name='Aluminium Flex Box',
        description='Flexible Aluminium Box',
        current_quantity=250,
        max_stock_level=600,
        restock_level=60
    )
    aluminium_flex_box.materials.add(aluminium_sheet, through_defaults={'quantity': 2})

    # Create Workstations
    workstations = [
        WorkStation.objects.create(
            name='AMADA Laser Cutting Station',
            status='ACTIVE',
            process_type='AUTOMATIC',
            last_maintenance=timezone.now() - timedelta(days=random.randint(30, 90))
        ),
        WorkStation.objects.create(
            name='AMADA Metal Forming Station',
            status='ACTIVE',
            process_type='AUTOMATIC',
            last_maintenance=timezone.now() - timedelta(days=random.randint(30, 90))
        ),
        WorkStation.objects.create(
            name='VNC Cutting Station 1',
            status='ACTIVE',
            process_type='AUTOMATIC',
            last_maintenance=timezone.now() - timedelta(days=random.randint(30, 90))
        ),
        WorkStation.objects.create(
            name='VNC Cutting Station 2',
            status='ACTIVE',
            process_type='AUTOMATIC',
            last_maintenance=timezone.now() - timedelta(days=random.randint(30, 90))
        ),
        WorkStation.objects.create(
            name='Drilling Station',
            status='ACTIVE',
            process_type='MANUAL',
            last_maintenance=timezone.now() - timedelta(days=random.randint(30, 90))
        ),
        WorkStation.objects.create(
            name='Grafting Station',
            status='ACTIVE',
            process_type='MANUAL',
            last_maintenance=timezone.now() - timedelta(days=random.randint(30, 90))
        )
    ]

    # Create Work Orders
    work_orders = [
        WorkOrder.objects.create(
            product=ss_flex_box,
            quantity=100,
            status='PENDING',
            priority='MEDIUM',
            assigned_to=user,
            workstation=random.choice(workstations)
        ),
        WorkOrder.objects.create(
            product=aluminium_flex_box,
            quantity=150,
            status='PENDING',
            priority='MEDIUM',
            assigned_to=user,
            workstation=random.choice(workstations)
        )
    ]

    # Create Workstation Efficiency Metrics
    for station in workstations:
        WorkstationEfficiencyMetric.objects.create(
            workstation=station,
            total_working_time=timedelta(hours=random.uniform(50, 200)),
            total_idle_time=timedelta(hours=random.uniform(10, 50)),
            total_material_used=random.uniform(500, 2000),
            total_material_wasted=random.uniform(50, 200),
            total_items_processed=random.randint(100, 500),
            total_items_with_defects=random.randint(5, 50)
        )

    # Create some sample Production Logs
    for work_order in work_orders:
        ProductionLog.objects.create(
            work_order=work_order,
            workstation=work_order.workstation,
            quantity_produced=random.randint(10, 50),
            efficiency_rate=random.uniform(0.7, 0.95),
            notes=f"Production log for {work_order.product.name}"
        )

    print("Sample data created successfully!")

if __name__ == '__main__':
    create_sample_data()
