from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from manufacturing.models import WorkStation, Material, Product, WorkOrder

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed initial data for the manufacturing application'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            # Create admin user if not exists
            admin_user, created = User.objects.get_or_create(
                username='admin', 
                defaults={
                    'is_staff': True, 
                    'is_superuser': True,
                    'email': 'admin@metalcraft.com'
                }
            )
            if created:
                admin_user.set_password('adminpass')
                admin_user.save()
                self.stdout.write(self.style.SUCCESS('Admin user created'))

            # Check if workstations already exist
            if not WorkStation.objects.exists():
                # Create workstations
                workstations = [
                    WorkStation(
                        name='Assembly Line 1', 
                        status='ACTIVE', 
                        description='Main assembly line for product manufacturing'
                    ),
                    WorkStation(
                        name='Packaging Station', 
                        status='INACTIVE', 
                        description='Packaging and quality check station'
                    ),
                    WorkStation(
                        name='CNC Machining Center', 
                        status='MAINTENANCE', 
                        description='Precision machining for metal parts'
                    )
                ]
                WorkStation.objects.bulk_create(workstations)
                self.stdout.write(self.style.SUCCESS('Workstations created'))

            # Fetch or create existing objects
            assembly_line = WorkStation.objects.get(name='Assembly Line 1')
            packaging_station = WorkStation.objects.get(name='Packaging Station')
            
            # Check if materials already exist
            if not Material.objects.exists():
                # Create materials
                materials = [
                    Material(
                        name='Steel Sheets', 
                        quantity=500, 
                        unit='kg', 
                        reorder_level=100,
                        description='High-grade steel sheets for manufacturing'
                    ),
                    Material(
                        name='Aluminum Profiles', 
                        quantity=250, 
                        unit='meters', 
                        reorder_level=50,
                        description='Precision aluminum profiles'
                    ),
                    Material(
                        name='Electronic Components', 
                        quantity=1000, 
                        unit='pieces', 
                        reorder_level=200,
                        description='Assorted electronic components'
                    )
                ]
                Material.objects.bulk_create(materials)
                self.stdout.write(self.style.SUCCESS('Materials created'))

            # Check if products already exist
            if not Product.objects.exists():
                # Create products
                products = [
                    Product(
                        name='Industrial Robot Arm', 
                        description='Advanced robotic arm for manufacturing'
                    ),
                    Product(
                        name='Precision Cutting Machine', 
                        description='CNC machine for precision metal cutting'
                    )
                ]
                Product.objects.bulk_create(products)
                self.stdout.write(self.style.SUCCESS('Products created'))

            # Fetch or create existing objects
            robot_arm = Product.objects.get(name='Industrial Robot Arm')
            cutting_machine = Product.objects.get(name='Precision Cutting Machine')

            # Check if work orders already exist
            if not WorkOrder.objects.exists():
                # Create work orders
                work_orders = [
                    WorkOrder(
                        product=robot_arm,
                        quantity=10,
                        start_date=timezone.now(),
                        status='QUEUED',
                        priority='HIGH',
                        notes='Urgent order for industrial robotics project'
                    ),
                    WorkOrder(
                        product=cutting_machine,
                        quantity=5,
                        start_date=timezone.now(),
                        status='PENDING',
                        priority='MEDIUM',
                        notes='Precision cutting machines for manufacturing client'
                    ),
                    WorkOrder(
                        product=robot_arm,
                        quantity=15,
                        start_date=timezone.now(),
                        status='IN_PROGRESS',
                        priority='CRITICAL',
                        notes='Large batch production for major client'
                    )
                ]
                WorkOrder.objects.bulk_create(work_orders)
                self.stdout.write(self.style.SUCCESS('Work Orders created'))

        self.stdout.write(self.style.SUCCESS('Initial data seeding completed successfully!'))
