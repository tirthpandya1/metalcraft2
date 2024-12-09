from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from manufacturing.models import WorkStation, Material, Product, ProductMaterial, WorkOrder

class Command(BaseCommand):
    help = 'Populates the database with initial manufacturing data'

    def handle(self, *args, **kwargs):
        # Create a superuser if not exists
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Create WorkStations
        workstations = [
            {'name': 'Assembly Line 1', 'description': 'Main assembly line', 'status': 'ACTIVE'},
            {'name': 'Packaging Station', 'description': 'Product packaging area', 'status': 'ACTIVE'},
            {'name': 'Quality Control', 'description': 'Inspection and testing', 'status': 'MAINTENANCE'},
        ]
        created_workstations = []
        for ws_data in workstations:
            ws, created = WorkStation.objects.get_or_create(name=ws_data['name'], defaults=ws_data)
            created_workstations.append(ws)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created workstation: {ws.name}'))

        # Create Materials
        materials = [
            {'name': 'Steel Plate', 'description': 'Industrial grade steel', 'unit': 'kg', 'quantity': 1000, 'reorder_level': 100, 'cost_per_unit': 5.50},
            {'name': 'Aluminum Sheet', 'description': 'Lightweight aluminum', 'unit': 'kg', 'quantity': 500, 'reorder_level': 50, 'cost_per_unit': 3.75},
            {'name': 'Plastic Resin', 'description': 'High-density polymer', 'unit': 'kg', 'quantity': 750, 'reorder_level': 75, 'cost_per_unit': 2.25},
        ]
        created_materials = []
        for mat_data in materials:
            mat, created = Material.objects.get_or_create(name=mat_data['name'], defaults=mat_data)
            created_materials.append(mat)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created material: {mat.name}'))

        # Create Products
        products = [
            {'name': 'Industrial Robot Arm', 'description': 'Precision robotic arm for manufacturing'},
            {'name': 'Conveyor Belt System', 'description': 'Modular conveyor belt for production lines'},
        ]
        created_products = []
        for prod_data in products:
            prod, created = Product.objects.get_or_create(name=prod_data['name'], defaults=prod_data)
            created_products.append(prod)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created product: {prod.name}'))

        # Create Product Materials
        if created_products and created_materials:
            # Robot Arm requires Steel Plate and Aluminum Sheet
            ProductMaterial.objects.get_or_create(
                product=created_products[0], 
                material=created_materials[0],  # Steel Plate
                defaults={'quantity': 10}
            )
            ProductMaterial.objects.get_or_create(
                product=created_products[0], 
                material=created_materials[1],  # Aluminum Sheet
                defaults={'quantity': 5}
            )

            # Conveyor Belt requires Steel Plate and Plastic Resin
            ProductMaterial.objects.get_or_create(
                product=created_products[1], 
                material=created_materials[0],  # Steel Plate
                defaults={'quantity': 15}
            )
            ProductMaterial.objects.get_or_create(
                product=created_products[1], 
                material=created_materials[2],  # Plastic Resin
                defaults={'quantity': 8}
            )

        # Create Work Orders
        if created_products and created_workstations:
            work_orders = [
                {
                    'product': created_products[0],
                    'quantity': 10,
                    'status': 'PENDING',
                    'workstation': created_workstations[0],
                    'priority': 'HIGH'
                },
                {
                    'product': created_products[1],
                    'quantity': 5,
                    'status': 'QUEUED',
                    'workstation': created_workstations[1],
                    'priority': 'MEDIUM'
                }
            ]
            for wo_data in work_orders:
                WorkOrder.objects.get_or_create(
                    product=wo_data['product'], 
                    quantity=wo_data['quantity'], 
                    defaults=wo_data
                )

        self.stdout.write(self.style.SUCCESS('Successfully populated initial manufacturing data'))
