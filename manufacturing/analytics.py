from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField, Q, Value
from django.db.models.functions import TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import logging

from .models import WorkOrder, ProductionLog, Material, Product, WorkStation

logger = logging.getLogger(__name__)

class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Production Overview
            total_work_orders = WorkOrder.objects.count()
            completed_work_orders = WorkOrder.objects.filter(status='COMPLETED').count()
            in_progress_work_orders = WorkOrder.objects.filter(status='IN_PROGRESS').count()

            # Total material consumption for percentage calculation
            total_material_consumption = Material.objects.aggregate(
                total_consumed=Sum('productmaterial__quantity', default=0)
            )['total_consumed'] or 1

            # Material Usage Analytics with percentage and sorting
            material_usage = Material.objects.annotate(
                total_consumed=Sum('productmaterial__quantity', default=0),
                percentage=ExpressionWrapper(
                    F('total_consumed') / Value(total_material_consumption) * 100, 
                    output_field=DecimalField()
                )
            ).values('name', 'total_consumed', 'percentage').order_by('-total_consumed')

            # Production Performance
            monthly_production = WorkOrder.objects.annotate(
                month=TruncMonth('created_at'),
                total_production=Sum('quantity', default=0)
            ).values('month').annotate(
                avg_quantity=Avg('quantity', default=0)
            ).order_by('month')

            # Workstation Utilization
            workstation_utilization = WorkStation.objects.annotate(
                total_work_orders=Count('work_orders'),
                active_work_orders=Count('work_orders', filter=Q(work_orders__status='IN_PROGRESS'))
            ).values('name', 'total_work_orders', 'active_work_orders')

            # Product Performance
            product_performance = Product.objects.annotate(
                total_produced=Sum('work_orders__quantity', default=0),
                total_work_orders=Count('work_orders')
            ).values('name', 'total_produced', 'total_work_orders')

            return Response({
                'work_orders': {
                    'total': total_work_orders,
                    'completed': completed_work_orders,
                    'in_progress': in_progress_work_orders
                },
                'material_usage': list(material_usage),
                'monthly_production': list(monthly_production),
                'workstation_utilization': list(workstation_utilization),
                'product_performance': list(product_performance)
            })
        except Exception as e:
            logger.error(f"Dashboard Analytics Error: {str(e)}")
            return Response({'error': str(e)}, status=500)

class EfficiencyTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Detailed efficiency trends
            efficiency_trend = ProductionLog.objects.annotate(
                month=TruncMonth('created_at')
            ).values('month').annotate(
                avg_efficiency=Avg('efficiency_rate', default=0),
                total_production=Sum('quantity_produced', default=0)
            ).order_by('month')

            return Response(list(efficiency_trend))
        except Exception as e:
            logger.error(f"Efficiency Trend Error: {str(e)}")
            return Response({'error': str(e)}, status=500)

class CostAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Cost-related analytics
            material_cost_analysis = Material.objects.annotate(
                total_cost=ExpressionWrapper(
                    F('quantity') * F('cost_per_unit'), 
                    output_field=DecimalField()
                )
            ).values('name', 'total_cost')

            # Calculate estimated work order costs based on materials used
            work_order_cost_analysis = WorkOrder.objects.annotate(
                estimated_material_cost=Sum(
                    F('product__productmaterial__material__cost_per_unit') * 
                    F('product__productmaterial__quantity'),
                    output_field=DecimalField()
                )
            ).values('id', 'product__name', 'estimated_material_cost')

            # Aggregate work order cost statistics
            work_order_cost_summary = WorkOrder.objects.aggregate(
                total_cost=Sum(
                    F('product__productmaterial__material__cost_per_unit') * 
                    F('product__productmaterial__quantity'),
                    output_field=DecimalField(),
                    default=0
                ),
                avg_cost=Avg(
                    F('product__productmaterial__material__cost_per_unit') * 
                    F('product__productmaterial__quantity'),
                    output_field=DecimalField(),
                    default=0
                )
            )

            return Response({
                'material_cost_analysis': list(material_cost_analysis),
                'work_order_cost_analysis': list(work_order_cost_analysis),
                'work_order_cost': {
                    'total_cost': work_order_cost_summary['total_cost'],
                    'avg_cost': work_order_cost_summary['avg_cost']
                }
            })
        except Exception as e:
            logger.error(f"Cost Analytics Error: {str(e)}")
            return Response({'error': str(e)}, status=500)
