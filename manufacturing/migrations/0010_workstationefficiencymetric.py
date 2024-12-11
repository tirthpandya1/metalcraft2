from django.db import migrations, models
import django.db.models.deletion
from django.utils import timezone
import random

def create_workstation_efficiency_metrics(apps, schema_editor):
    # Get the model classes
    WorkStation = apps.get_model('manufacturing', 'WorkStation')
    WorkstationEfficiencyMetric = apps.get_model('manufacturing', 'WorkstationEfficiencyMetric')

    # Get all existing workstations
    workstations = WorkStation.objects.all()

    # Create efficiency metrics for each workstation
    for workstation in workstations:
        # Generate some realistic sample data
        total_working_hours = random.uniform(10, 100)  # hours
        total_items_processed = random.randint(50, 500)
        total_items_with_defects = random.randint(0, total_items_processed // 10)
        
        total_material_used = random.uniform(100, 1000)  # kg or units
        total_material_wasted = total_material_used * random.uniform(0.01, 0.1)  # 1-10% wastage
        
        WorkstationEfficiencyMetric.objects.create(
            workstation=workstation,
            total_working_time=timezone.timedelta(hours=total_working_hours),
            total_idle_time=timezone.timedelta(hours=random.uniform(1, total_working_hours/5)),
            total_material_used=total_material_used,
            total_material_wasted=total_material_wasted,
            total_items_processed=total_items_processed,
            total_items_with_defects=total_items_with_defects,
            timestamp=timezone.now()
        )

def remove_workstation_efficiency_metrics(apps, schema_editor):
    # Optional: clean up method if needed
    WorkstationEfficiencyMetric = apps.get_model('manufacturing', 'WorkstationEfficiencyMetric')
    WorkstationEfficiencyMetric.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('manufacturing', '0009_alter_productionlog_workstation_and_more'),
    ]

    operations = [
        migrations.RunPython(create_workstation_efficiency_metrics, remove_workstation_efficiency_metrics)
    ]
