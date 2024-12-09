from django.core.management.base import BaseCommand
from manufacturing.models import ProductionLog

class Command(BaseCommand):
    help = 'Populate efficiency rates for existing ProductionLog entries'

    def handle(self, *args, **options):
        # Get all production logs without an efficiency rate
        production_logs = ProductionLog.objects.filter(efficiency_rate__isnull=True)
        
        total_logs = production_logs.count()
        updated_logs = 0

        for log in production_logs:
            try:
                log.calculate_efficiency()
                updated_logs += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error updating log {log.id}: {e}'))

        self.stdout.write(self.style.SUCCESS(
            f'Successfully updated {updated_logs} out of {total_logs} production logs with efficiency rates'
        ))
