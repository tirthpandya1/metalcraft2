# Generated by Django 4.2.7 on 2024-12-09 20:06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("manufacturing", "0009_alter_productionlog_workstation_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProductWorkstationSequence",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        help_text="Order of this workstation in the product manufacturing process"
                    ),
                ),
                (
                    "estimated_time",
                    models.DurationField(
                        blank=True,
                        help_text="Estimated time for this workstation process",
                        null=True,
                    ),
                ),
                (
                    "instruction_set",
                    models.JSONField(
                        blank=True,
                        help_text="Specific instructions for this workstation in the product process",
                        null=True,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workstation_sequences",
                        to="manufacturing.product",
                    ),
                ),
                (
                    "workstation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="manufacturing.workstation",
                    ),
                ),
            ],
            options={
                "ordering": ["sequence_order"],
                "unique_together": {("product", "workstation", "sequence_order")},
            },
        ),
    ]
