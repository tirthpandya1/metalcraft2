from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DecimalField, Q, Value
from django.db.models.functions import TruncDay, TruncMonth
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import logging

from .models import WorkOrder, ProductionLog, Material, Product, WorkStation, ProductWorkstationSequence

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

            # Daily Production
            daily_production = ProductionLog.objects.annotate(
                day=TruncDay('created_at')
            ).values('day').annotate(
                total_quantity=Sum('quantity_produced')
            ).order_by('day')

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
                'daily_production': list(daily_production),
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

class ProfitabilityAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def calculate_product_profitability(self, product):
        """
        Calculate the profitability of a product by considering:
        1. Material costs
        2. Labor costs
        3. Workstation operating costs
        4. Sell price
        
        Returns a dictionary with detailed profitability metrics
        """
        from django.db.models import Sum, F
        import logging
        logger = logging.getLogger(__name__)

        try:
            logger.info(f"Calculating profitability for product: {product.name}")
            logger.info(f"Product details - Sell Cost: {product.sell_cost}, Labor Cost: {product.labor_cost}")

            # Calculate total material cost with detailed logging
            material_costs_query = product.productmaterial_set.annotate(
                material_total_cost=F('material__cost_per_unit') * F('quantity')
            )
            material_costs = material_costs_query.aggregate(
                total_material_cost=Sum('material_total_cost')
            )['total_material_cost'] or 0

            # Detailed material cost breakdown
            material_breakdown = list(material_costs_query.values('material__name', 'material_total_cost'))
            
            # Log material details
            logger.info(f"Material Costs: {material_costs}")
            logger.info(f"Material Breakdown: {material_breakdown}")

            # Get the workstation sequence for this product
            workstation_sequence = ProductWorkstationSequence.objects.filter(
                product=product
            ).select_related('workstation')

            # Calculate total workstation operating costs
            workstation_costs = 0
            workstation_breakdown = []
            for ws in workstation_sequence:
                # Ensure hourly_operating_cost and estimated_time are not None
                hourly_rate = ws.workstation.hourly_operating_cost or 0
                estimated_hours = (ws.estimated_time.total_seconds() / 3600) if ws.estimated_time else 0
                
                ws_cost = hourly_rate * estimated_hours
                workstation_costs += ws_cost
                
                workstation_breakdown.append({
                    'workstation_name': ws.workstation.name,
                    'hourly_rate': hourly_rate,
                    'estimated_time_hours': estimated_hours,
                    'cost': ws_cost
                })
                
                logger.info(f"Workstation {ws.workstation.name}: Hourly Rate = {hourly_rate}, Estimated Hours = {estimated_hours}, Cost = {ws_cost}")

            # Ensure sell_cost and labor_cost are not None
            sell_cost = product.sell_cost or 0
            labor_cost = product.labor_cost or 0

            # Calculate total costs
            total_cost = material_costs + labor_cost + workstation_costs

            # Calculate profitability
            profit = sell_cost - total_cost
            profit_margin = (profit / sell_cost * 100) if sell_cost > 0 else 0

            # Categorize profitability
            profitability_category = (
                'Highly Profitable' if profit_margin > 30 else
                'Profitable' if profit_margin > 15 else
                'Low Margin' if profit_margin > 0 else
                'Loss-Making'
            )

            # Comprehensive logging of profitability calculation
            logger.info(f"Profitability Calculation for {product.name}:")
            logger.info(f"Material Costs: {material_costs}")
            logger.info(f"Labor Costs: {labor_cost}")
            logger.info(f"Workstation Costs: {workstation_costs}")
            logger.info(f"Total Cost: {total_cost}")
            logger.info(f"Sell Cost: {sell_cost}")
            logger.info(f"Profit: {profit}")
            logger.info(f"Profit Margin: {profit_margin}%")
            logger.info(f"Profitability Category: {profitability_category}")

            return {
                'product_id': product.id,
                'product_name': product.name,
                'material_costs': material_costs,
                'material_breakdown': material_breakdown,
                'labor_costs': labor_cost,
                'workstation_costs': workstation_costs,
                'workstation_breakdown': workstation_breakdown,
                'total_cost': total_cost,
                'sell_cost': sell_cost,
                'profit': profit,
                'profit_margin': profit_margin,
                'profitability_category': profitability_category
            }
        except Exception as e:
            logger.error(f"Error calculating profitability for product {product.name}: {str(e)}", exc_info=True)
            return None

    def get(self, request):
        """
        Generate an overall profitability summary for all products
        """
        import logging
        logger = logging.getLogger(__name__)

        try:
            # Fetch all products with more details
            products = Product.objects.prefetch_related(
                'productmaterial_set', 
                'productmaterial_set__material',
                'workstation_sequences',
                'workstation_sequences__workstation'
            )
            
            logger.debug(f"Total number of products: {products.count()}")
            
            # If no products exist
            if not products.exists():
                logger.warning("No products found in the database")
                return Response({
                    'total_products': 0,
                    'total_sell_cost': 0,
                    'total_cost': 0,
                    'total_profit': 0,
                    'average_profit_margin': 0,
                    'products': []
                })
            
            # Calculate profitability for each product
            profitability_data = []
            for product in products:
                logger.debug(f"Processing product: {product.name}")
                
                # Log product details for debugging
                logger.debug(f"Product ID: {product.id}")
                logger.debug(f"Sell Cost: {product.sell_cost}")
                logger.debug(f"Labor Cost: {product.labor_cost}")
                
                # Log materials
                materials = product.productmaterial_set.all()
                logger.debug(f"Number of materials: {materials.count()}")
                for material in materials:
                    logger.debug(f"Material: {material.material.name}, Quantity: {material.quantity}")
                
                # Log workstation sequences
                workstation_sequences = product.workstation_sequences.all()
                logger.debug(f"Number of workstation sequences: {workstation_sequences.count()}")
                for seq in workstation_sequences:
                    logger.debug(f"Workstation: {seq.workstation.name}, Estimated Time: {seq.estimated_time}")

                try:
                    product_profitability = self.calculate_product_profitability(product)
                    if product_profitability:
                        profitability_data.append(product_profitability)
                except Exception as prod_error:
                    logger.error(f"Error processing product {product.id}: {str(prod_error)}", exc_info=True)

            # If no products have profitability calculated
            if not profitability_data:
                logger.warning("No products could be processed for profitability")
                return Response({
                    'total_products': len(products),
                    'total_sell_cost': 0,
                    'total_cost': 0,
                    'total_profit': 0,
                    'average_profit_margin': 0,
                    'products': []
                })

            # Calculate summary metrics
            summary = {
                'total_products': len(products),
                'total_sell_cost': sum(item['sell_cost'] for item in profitability_data),
                'total_cost': sum(item['total_cost'] for item in profitability_data),
                'total_profit': sum(item['profit'] for item in profitability_data),
                'average_profit_margin': sum(item['profit_margin'] for item in profitability_data) / len(profitability_data),
                'products': profitability_data
            }

            logger.info(f"Profitability Summary: {summary}")
            return Response(summary)

        except Exception as e:
            logger.error(f"Unexpected error in profitability analytics: {str(e)}", exc_info=True)
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
