# Generated by Django 4.2.7 on 2024-12-12 11:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("manufacturing", "0014_remove_product_material_cost_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="workstation",
            name="hourly_operating_cost",
            field=models.DecimalField(
                decimal_places=2,
                default=0.0,
                help_text="Hourly operating cost for this workstation",
                max_digits=10,
            ),
        ),
    ]
