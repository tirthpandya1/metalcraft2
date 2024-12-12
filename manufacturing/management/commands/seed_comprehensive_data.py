from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from manufacturing.models import (
    Product, Material, ProductMaterial, 
    WorkStation, ProductWorkstationSequence,
    WorkOrder, ProductionLog, 
    WorkstationEfficiencyMetric,
    ProductionEvent
)
from django.db import transaction
import random
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed comprehensive manufacturing data including work orders and efficiency metrics'

    @transaction.atomic
    def handle(self, *args, **options):
        # Clear existing data
        ProductionEvent.objects.all().delete()
        WorkstationEfficiencyMetric.objects.all().delete()
        ProductionLog.objects.all().delete()
        WorkOrder.objects.all().delete()
        ProductWorkstationSequence.objects.all().delete()
        ProductMaterial.objects.all().delete()
        Product.objects.all().delete()
        Material.objects.all().delete()
        WorkStation.objects.all().delete()

        # Create admin user if not exists
        admin_user, _ = User.objects.get_or_create(
            username='admin', 
            defaults={
                'email': 'admin@metalcraft.com', 
                'is_staff': True, 
                'is_superuser': True
            }
        )

        # Create Workstations
        cutting_station = WorkStation.objects.create(
            name='Cutting Station', 
            hourly_operating_cost=35.50,
            process_type='AUTOMATIC',
            status='ACTIVE'
        )
        welding_station = WorkStation.objects.create(
            name='Welding Station', 
            hourly_operating_cost=45.75,
            process_type='MANUAL',
            status='ACTIVE'
        )
        assembly_station = WorkStation.objects.create(
            name='Assembly Station', 
            hourly_operating_cost=40.25,
            process_type='MANUAL',
            status='ACTIVE'
        )
        painting_station = WorkStation.objects.create(
            name='Painting Station', 
            hourly_operating_cost=30.00,
            process_type='AUTOMATIC',
            status='ACTIVE'
        )

        # Create Materials
        steel = Material.objects.create(
            name='Steel Sheet', 
            unit='sq meter', 
            quantity=1000,
            cost_per_unit=25.50,
            reorder_level=100
        )
        aluminum = Material.objects.create(
            name='Aluminum Tube', 
            unit='meter', 
            quantity=500,
            cost_per_unit=15.75,
            reorder_level=50
        )
        paint = Material.objects.create(
            name='Industrial Paint', 
            unit='liter', 
            quantity=200,
            cost_per_unit=40.00,
            reorder_level=20
        )
        screws = Material.objects.create(
            name='Stainless Steel Screws', 
            unit='pack', 
            quantity=1000,
            cost_per_unit=5.25,
            reorder_level=100
        )

        # Create Products
        industrial_chair = Product.objects.create(
            name='Industrial Ergonomic Chair', 
            description='High-performance ergonomic chair for industrial use',
            sell_cost=450.00,
            labor_cost=75.50,
            current_quantity=50,
            restock_level=20
        )
        ProductMaterial.objects.create(
            product=industrial_chair, 
            material=steel, 
            quantity=2.5
        )
        ProductMaterial.objects.create(
            product=industrial_chair, 
            material=screws, 
            quantity=0.5
        )
        ProductMaterial.objects.create(
            product=industrial_chair, 
            material=paint, 
            quantity=0.25
        )

        modular_desk = Product.objects.create(
            name='Modular Office Desk', 
            description='Adjustable height modular desk',
            sell_cost=350.00,
            labor_cost=65.00,
            current_quantity=30,
            restock_level=15
        )
        ProductMaterial.objects.create(
            product=modular_desk, 
            material=aluminum, 
            quantity=3
        )
        ProductMaterial.objects.create(
            product=modular_desk, 
            material=steel, 
            quantity=1.5
        )
        ProductMaterial.objects.create(
            product=modular_desk, 
            material=screws, 
            quantity=0.75
        )

        # Create Workstation Sequences
        ProductWorkstationSequence.objects.create(
            product=industrial_chair,
            workstation=cutting_station,
            sequence_order=1,
            estimated_time=timedelta(hours=1),
            process_type='AUTOMATIC'
        )
        ProductWorkstationSequence.objects.create(
            product=industrial_chair,
            workstation=welding_station,
            sequence_order=2,
            estimated_time=timedelta(hours=1.5),
            process_type='MANUAL'
        )
        ProductWorkstationSequence.objects.create(
            product=industrial_chair,
            workstation=painting_station,
            sequence_order=3,
            estimated_time=timedelta(hours=0.5),
            process_type='AUTOMATIC'
        )

        ProductWorkstationSequence.objects.create(
            product=modular_desk,
            workstation=cutting_station,
            sequence_order=1,
            estimated_time=timedelta(hours=1.5),
            process_type='AUTOMATIC'
        )
        ProductWorkstationSequence.objects.create(
            product=modular_desk,
            workstation=assembly_station,
            sequence_order=2,
            estimated_time=timedelta(hours=2),
            process_type='MANUAL'
        )
        ProductWorkstationSequence.objects.create(
            product=modular_desk,
            workstation=painting_station,
            sequence_order=3,
            estimated_time=timedelta(hours=0.75),
            process_type='AUTOMATIC'
        )

        # Create Work Orders
        work_order_1 = WorkOrder.objects.create(
            product=industrial_chair,
            quantity=25,
            start_date=timezone.now() - timedelta(days=3),
            end_date=timezone.now() - timedelta(days=1),
            status='COMPLETED',
            priority='HIGH'
        )
        work_order_2 = WorkOrder.objects.create(
            product=modular_desk,
            quantity=20,
            start_date=timezone.now() - timedelta(days=5),
            end_date=timezone.now() - timedelta(days=2),
            status='COMPLETED',
            priority='MEDIUM'
        )

        # Create Production Logs
        production_log_1 = ProductionLog.objects.create(
            work_order=work_order_1,
            workstation=cutting_station,
            quantity_produced=23,
            wastage=2,
            notes='Minor cutting inconsistencies',
            created_by=admin_user,
            efficiency_rate=92.0
        )
        production_log_2 = ProductionLog.objects.create(
            work_order=work_order_2,
            workstation=assembly_station,
            quantity_produced=19,
            wastage=1,
            notes='Smooth assembly process',
            created_by=admin_user,
            efficiency_rate=95.0
        )

        # Create Workstation Efficiency Metrics
        WorkstationEfficiencyMetric.objects.create(
            workstation=cutting_station,
            total_working_time=timedelta(hours=10),
            total_idle_time=timedelta(hours=2),
            total_material_used=50.5,
            total_material_wasted=3.2,
            total_items_processed=50,
            total_items_with_defects=3,
            timestamp=timezone.now()
        )
        WorkstationEfficiencyMetric.objects.create(
            workstation=assembly_station,
            total_working_time=timedelta(hours=12),
            total_idle_time=timedelta(hours=1.5),
            total_material_used=75.3,
            total_material_wasted=2.1,
            total_items_processed=60,
            total_items_with_defects=2,
            timestamp=timezone.now()
        )

        # Create Production Events
        ProductionEvent.objects.create(
            event_type='WORK_ORDER_CREATED',
            work_order=work_order_1,
            product=industrial_chair,
            workstation=cutting_station,
            created_by=admin_user
        )
        ProductionEvent.objects.create(
            event_type='WORK_ORDER_COMPLETED',
            work_order=work_order_1,
            product=industrial_chair,
            workstation=painting_station,
            created_by=admin_user
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded comprehensive manufacturing data'))
