# Generated by Django 4.2.7 on 2024-12-11 16:44

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("manufacturing", "0008_materialreservation"),
    ]

    operations = [
        migrations.AddField(
            model_name="workstation",
            name="process_type",
            field=models.CharField(
                choices=[("AUTOMATIC", "Automatic"), ("MANUAL", "Manual")],
                default="MANUAL",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="productionlog",
            name="workstation",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="manufacturing.workstation",
            ),
        ),
        migrations.CreateModel(
            name="WorkstationEfficiencyMetric",
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
                    "total_working_time",
                    models.DurationField(default=datetime.timedelta(0)),
                ),
                (
                    "total_idle_time",
                    models.DurationField(default=datetime.timedelta(0)),
                ),
                (
                    "total_material_used",
                    models.DecimalField(decimal_places=4, default=0, max_digits=15),
                ),
                (
                    "total_material_wasted",
                    models.DecimalField(decimal_places=4, default=0, max_digits=15),
                ),
                ("total_items_processed", models.IntegerField(default=0)),
                ("total_items_with_defects", models.IntegerField(default=0)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                (
                    "workstation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="efficiency_metrics",
                        to="manufacturing.workstation",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ProductionEvent",
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
                    "event_type",
                    models.CharField(
                        choices=[
                            ("WORK_ORDER_CREATED", "Work Order Created"),
                            ("WORK_ORDER_STARTED", "Work Order Started"),
                            ("WORK_ORDER_COMPLETED", "Work Order Completed"),
                            (
                                "WORKSTATION_PROCESSING_STARTED",
                                "Workstation Processing Started",
                            ),
                            (
                                "WORKSTATION_PROCESSING_COMPLETED",
                                "Workstation Processing Completed",
                            ),
                            ("MATERIAL_USED", "Material Used"),
                            ("MATERIAL_WASTED", "Material Wasted"),
                            ("QUALITY_CHECK_PASSED", "Quality Check Passed"),
                            ("QUALITY_CHECK_FAILED", "Quality Check Failed"),
                            ("PACKAGING_STARTED", "Packaging Started"),
                            ("PACKAGING_COMPLETED", "Packaging Completed"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "details",
                    models.JSONField(
                        blank=True,
                        help_text="Additional event-specific details",
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="manufacturing.product",
                    ),
                ),
                (
                    "work_order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="events",
                        to="manufacturing.workorder",
                    ),
                ),
                (
                    "workstation",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="events",
                        to="manufacturing.workstation",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ProductionDesign",
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
                    "design_file",
                    models.FileField(
                        blank=True, null=True, upload_to="production_designs/"
                    ),
                ),
                (
                    "nested_cutting_diagram",
                    models.FileField(
                        blank=True, null=True, upload_to="nested_diagrams/"
                    ),
                ),
                (
                    "instruction_set",
                    models.JSONField(
                        blank=True,
                        help_text="Machine-specific instruction set for cutting/design",
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="designs",
                        to="manufacturing.product",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="WorkstationProcess",
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
                    "process_type",
                    models.CharField(
                        choices=[("AUTOMATIC", "Automatic"), ("MANUAL", "Manual")],
                        default="MANUAL",
                        max_length=20,
                    ),
                ),
                (
                    "sequence_order",
                    models.PositiveIntegerField(
                        help_text="Order of this process in the manufacturing sequence"
                    ),
                ),
                (
                    "estimated_time",
                    models.DurationField(
                        blank=True,
                        help_text="Estimated time to complete this process",
                        null=True,
                    ),
                ),
                (
                    "instruction_set",
                    models.JSONField(
                        blank=True,
                        help_text="Machine-specific instruction set for this process",
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="processes",
                        to="manufacturing.product",
                    ),
                ),
                (
                    "workstation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="processes",
                        to="manufacturing.workstation",
                    ),
                ),
            ],
            options={
                "ordering": ["sequence_order"],
                "unique_together": {("product", "workstation", "sequence_order")},
            },
        ),
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
                    "process_type",
                    models.CharField(
                        choices=[("AUTOMATIC", "Automatic"), ("MANUAL", "Manual")],
                        default="MANUAL",
                        max_length=20,
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
