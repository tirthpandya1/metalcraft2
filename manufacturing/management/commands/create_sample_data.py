from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from manufacturing.models import (
    WorkStation, Material, Product, ProductMaterial, 
    WorkOrder, ProductionLog
)
from django.utils import timezone
import random

class Command(BaseCommand):
    help = 'Creates sample data for the manufacturing management system'

    def handle(self, *args, **kwargs):
        # Clear existing data
        WorkStation.objects.all().delete()
        Material.objects.all().delete()
        Product.objects.all().delete()
        WorkOrder.objects.all().delete()
        ProductionLog.objects.all().delete()

        # Create WorkStations
        workstations = [
            WorkStation.objects.create(
                name=f"Workstation {i}", 
                description=f"Manufacturing station {i} for production", 
                status=random.choice(['ACTIVE', 'INACTIVE', 'MAINTENANCE'])
            ) for i in range(1, 6)
        ]
        self.stdout.write(self.style.SUCCESS('Created WorkStations'))

        # Create Materials
        materials = [
            Material.objects.create(
                name=name, 
                unit=unit, 
                quantity=random.randint(100, 1000), 
                reorder_level=random.randint(50, 200),
                cost_per_unit=round(random.uniform(10, 100), 2)
            ) for name, unit in [
                ('Steel Sheets', 'kg'), 
                ('Aluminum Bars', 'meter'), 
                ('Copper Wire', 'meter'), 
                ('Plastic Pellets', 'kg'), 
                ('Electronic Components', 'piece')
            ]
        ]
        self.stdout.write(self.style.SUCCESS('Created Materials'))

        # Create Products
        products = []
        for i in range(1, 4):
            product = Product.objects.create(
                name=f"Product {i}", 
                description=f"Manufacturing product {i}"
            )
            products.append(product)

            # Create Product Materials (Bill of Materials)
            ProductMaterial.objects.create(
                product=product, 
                material=materials[i-1], 
                quantity=random.randint(5, 50)
            )
        self.stdout.write(self.style.SUCCESS('Created Products'))

        # Create Work Orders
        work_orders = []
        for i in range(1, 6):
            work_order = WorkOrder.objects.create(
                product=random.choice(products),
                quantity=random.randint(10, 100),
                status=random.choice(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
                start_date=timezone.now(),
                end_date=timezone.now() + timezone.timedelta(days=random.randint(1, 10)),
                workstation=random.choice(workstations),
                assigned_to=User.objects.first()
            )
            work_orders.append(work_order)
        self.stdout.write(self.style.SUCCESS('Created Work Orders'))

        # Create Production Logs
        for work_order in work_orders:
            ProductionLog.objects.create(
                work_order=work_order,
                workstation=work_order.workstation,
                quantity_produced=random.randint(5, work_order.quantity),
                wastage=random.randint(0, 10),
                notes=f"Production log for {work_order.product.name}",
                created_by=User.objects.first()
            )
        self.stdout.write(self.style.SUCCESS('Created Production Logs'))

        self.stdout.write(self.style.SUCCESS('Successfully created sample data!'))
