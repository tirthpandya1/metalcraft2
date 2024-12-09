# Generated by Django 4.2.7 on 2024-12-09 13:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("manufacturing", "0004_alter_workstation_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="productionlog",
            name="efficiency_rate",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Calculated efficiency rate (0-100%)",
                max_digits=5,
                null=True,
            ),
        ),
    ]