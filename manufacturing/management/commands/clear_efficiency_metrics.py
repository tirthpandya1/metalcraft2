from django.core.management.base import BaseCommand
from manufacturing.models import WorkstationEfficiencyMetric

class Command(BaseCommand):
    help = 'Clear all WorkstationEfficiencyMetric data'

    def handle(self, *args, **kwargs):
        WorkstationEfficiencyMetric.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Successfully cleared all WorkstationEfficiencyMetric data'))
