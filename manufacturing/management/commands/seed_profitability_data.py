from django.core.management.base import BaseCommand
from django.utils import timezone
from manufacturing.models import (
    Product, Material, ProductMaterial, 
    WorkStation, ProductWorkstationSequence
)
from django.db import transaction

class Command(BaseCommand):
    help = 'Seed initial profitability data for products'

    @transaction.atomic
    def handle(self, *args, **options):
        # Clear existing data
        ProductWorkstationSequence.objects.all().delete()
        ProductMaterial.objects.all().delete()
        Product.objects.all().delete()
        Material.objects.all().delete()
        WorkStation.objects.all().delete()

        # Create Workstations
        cutting_station = WorkStation.objects.create(
            name='Cutting Station', 
            hourly_operating_cost=35.50,
            process_type='AUTOMATIC'
        )
        welding_station = WorkStation.objects.create(
            name='Welding Station', 
            hourly_operating_cost=45.75,
            process_type='MANUAL'
        )
        assembly_station = WorkStation.objects.create(
            name='Assembly Station', 
            hourly_operating_cost=40.25,
            process_type='MANUAL'
        )
        painting_station = WorkStation.objects.create(
            name='Painting Station', 
            hourly_operating_cost=30.00,
            process_type='AUTOMATIC'
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

        # Create Products with Detailed Profitability Scenarios
        industrial_chair = Product.objects.create(
            name='Industrial Ergonomic Chair', 
            description='High-performance ergonomic chair for industrial use',
            sell_cost=450.00,  # Higher sell price
            labor_cost=75.50,
            current_quantity=50,
            restock_level=20
        )
        ProductMaterial.objects.create(
            product=industrial_chair, 
            material=steel, 
            quantity=2.5  # 2.5 sq meters of steel per chair
        )
        ProductMaterial.objects.create(
            product=industrial_chair, 
            material=screws, 
            quantity=0.5  # Half a pack of screws per chair
        )
        ProductMaterial.objects.create(
            product=industrial_chair, 
            material=paint, 
            quantity=0.25  # Quarter liter of paint per chair
        )

        # Create Workstation Sequence for Industrial Chair
        ProductWorkstationSequence.objects.create(
            product=industrial_chair,
            workstation=cutting_station,
            sequence_order=1,
            estimated_time=timezone.timedelta(hours=1),
            process_type='AUTOMATIC'
        )
        ProductWorkstationSequence.objects.create(
            product=industrial_chair,
            workstation=welding_station,
            sequence_order=2,
            estimated_time=timezone.timedelta(hours=1.5),
            process_type='MANUAL'
        )
        ProductWorkstationSequence.objects.create(
            product=industrial_chair,
            workstation=painting_station,
            sequence_order=3,
            estimated_time=timezone.timedelta(hours=0.5),
            process_type='AUTOMATIC'
        )

        # Create a second product with different profitability profile
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
            quantity=3  # 3 meters of aluminum per desk
        )
        ProductMaterial.objects.create(
            product=modular_desk, 
            material=steel, 
            quantity=1.5  # 1.5 sq meters of steel per desk
        )
        ProductMaterial.objects.create(
            product=modular_desk, 
            material=screws, 
            quantity=0.75  # Three-quarters pack of screws per desk
        )

        # Create Workstation Sequence for Modular Desk
        ProductWorkstationSequence.objects.create(
            product=modular_desk,
            workstation=cutting_station,
            sequence_order=1,
            estimated_time=timezone.timedelta(hours=1.5),
            process_type='AUTOMATIC'
        )
        ProductWorkstationSequence.objects.create(
            product=modular_desk,
            workstation=assembly_station,
            sequence_order=2,
            estimated_time=timezone.timedelta(hours=2),
            process_type='MANUAL'
        )
        ProductWorkstationSequence.objects.create(
            product=modular_desk,
            workstation=painting_station,
            sequence_order=3,
            estimated_time=timezone.timedelta(hours=0.75),
            process_type='AUTOMATIC'
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded profitability data'))
