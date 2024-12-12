from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from manufacturing.models import ProductionLog, WorkOrder, WorkStation
from datetime import timedelta, datetime, time
import random
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed production logs for the past week'

    def handle(self, *args, **options):
        # Get admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.create_superuser('admin', 'admin@metalcraft.com', 'adminpass')

        # Get work orders and workstations
        work_orders = list(WorkOrder.objects.filter(status='COMPLETED'))
        workstations = list(WorkStation.objects.all())

        if not work_orders:
            self.stdout.write(self.style.WARNING('No completed work orders found. Skipping production log seeding.'))
            return

        # Clear existing production logs for the past week
        one_week_ago = timezone.now() - timedelta(days=7)
        ProductionLog.objects.filter(created_at__gte=one_week_ago).delete()

        # Generate production logs for the past week
        production_logs = []
        
        # Use the current timestamp as reference
        current_time = timezone.now()
        
        # Distribute logs across the past week
        for days_ago in range(7):
            # Base date for this day
            base_date = current_time - timedelta(days=days_ago)
            
            # Randomly select 1-3 work orders for this day
            day_work_orders = random.sample(work_orders, min(random.randint(1, 3), len(work_orders)))
            
            for work_order in day_work_orders:
                # Randomize log time within the day (between 6 AM and 6 PM)
                random_hour = random.randint(6, 18)
                random_minute = random.randint(0, 59)
                
                log_time = base_date.replace(
                    hour=random_hour, 
                    minute=random_minute, 
                    second=random.randint(0, 59), 
                    microsecond=random.randint(0, 999999)
                )
                
                # Randomize production quantity within work order quantity
                quantity_produced = Decimal(str(random.uniform(0.7, 1.0))) * work_order.quantity
                
                # Select a random workstation
                workstation = random.choice(workstations)
                
                # Calculate efficiency rate
                efficiency_rate = Decimal(str(random.uniform(75, 100)))
                
                # Calculate wastage (between 0-10% of total quantity)
                wastage = quantity_produced * Decimal(str(random.uniform(0, 0.1)))
                
                production_log = ProductionLog(
                    work_order=work_order,
                    workstation=workstation,
                    quantity_produced=round(quantity_produced, 2),
                    wastage=round(wastage, 2),
                    efficiency_rate=round(efficiency_rate, 2),
                    notes=f"Daily production log for {work_order.product.name}",
                    created_by=admin_user,
                    created_at=log_time,
                    updated_at=log_time
                )
                production_logs.append(production_log)

        # Bulk create production logs
        ProductionLog.objects.bulk_create(production_logs)

        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(production_logs)} production logs for the past week'))
