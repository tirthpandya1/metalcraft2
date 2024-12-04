from django.contrib import admin
from .models import WorkStation, Material, Product, ProductMaterial, WorkOrder, ProductionLog

# Register your models here.

@admin.register(WorkStation)
class WorkStationAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'created_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('name', 'description')

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit', 'quantity', 'reorder_level', 'cost_per_unit')
    list_filter = ('unit',)
    search_fields = ('name', 'description')

class ProductMaterialInline(admin.TabularInline):
    model = ProductMaterial
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at')
    search_fields = ('name', 'description')
    inlines = [ProductMaterialInline]

@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'product', 'quantity', 'status', 'start_date', 'end_date', 'assigned_to')
    list_filter = ('status', 'start_date', 'workstation')
    search_fields = ('product__name', 'assigned_to__username')
    raw_id_fields = ('product', 'assigned_to', 'workstation')

@admin.register(ProductionLog)
class ProductionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'work_order', 'workstation', 'quantity_produced', 'wastage', 'created_at')
    list_filter = ('created_at', 'workstation')
    search_fields = ('work_order__product__name', 'notes')
    raw_id_fields = ('work_order', 'workstation', 'created_by')
