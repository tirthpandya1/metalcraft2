from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, fields
from django.utils import timezone
from .models import (
    WorkStation, Material, Product, WorkOrder, ProductionLog, 
    WorkstationProcess, WorkstationEfficiencyMetric, 
    ProductionDesign, ProductionEvent, ProductWorkstationSequence
)
from .serializers import (
    WorkStationSerializer, MaterialSerializer, ProductSerializer,
    WorkOrderSerializer, ProductionLogSerializer, 
    WorkstationProcessSerializer, WorkstationEfficiencyMetricSerializer,
    ProductionDesignSerializer, ProductionEventSerializer,
    ProductWorkstationSequenceSerializer
)
import logging
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination
from datetime import datetime
from .analytics import ProfitabilityAnalyticsView

logger = logging.getLogger(__name__)

# Create your views here.

class WorkStationViewSet(viewsets.ModelViewSet):
    queryset = WorkStation.objects.all()
    serializer_class = WorkStationSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    def list(self, request):
        """
        Override list method to add logging and custom response
        """
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            
            # Log the number of workstations and their details
            logger.info(f"Fetching workstations: Total {queryset.count()} workstations")
            for workstation in queryset:
                logger.info(f"Workstation: {workstation.id}, Name: {workstation.name}, Status: {workstation.status}")
            
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching workstations: {str(e)}")
            return Response({'error': 'Failed to fetch workstations'}, status=500)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        workstation = self.get_object()
        status = request.data.get('status')
        if status in dict(WorkStation.status.field.choices):
            workstation.status = status
            workstation.save()
            return Response({'status': 'status updated'})
        return Response({'error': 'Invalid status'}, status=400)

    @action(detail=False, methods=['get'])
    def real_time_status(self, request):
        """
        Provide real-time status of all workstations
        """
        workstations = WorkStation.objects.all()
        status_data = []
        
        for workstation in workstations:
            # Get the most recent work order for this workstation
            current_work_order = WorkOrder.objects.filter(
                workstation=workstation, 
                status='IN_PROGRESS'
            ).first()
            
            # Get the most recent production log
            latest_log = ProductionLog.objects.filter(
                workstation=workstation
            ).order_by('-created_at').first()
            
            status_data.append({
                'id': workstation.id,
                'name': workstation.name,
                'status': workstation.status,
                'current_work_order': {
                    'id': current_work_order.id if current_work_order else None,
                    'product_name': current_work_order.product.name if current_work_order else None,
                    'quantity': current_work_order.quantity if current_work_order else None,
                },
                'latest_production': {
                    'quantity_produced': latest_log.quantity_produced if latest_log else 0,
                    'created_at': latest_log.created_at if latest_log else None,
                },
                'utilization_rate': workstation.calculate_utilization_rate() if hasattr(workstation, 'calculate_utilization_rate') else None
            })
        
        return Response(status_data)

class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        materials = Material.objects.filter(quantity__lte=Material.reorder_level)
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    def list(self, request):
        # Log the incoming request
        logger.info("Product list request received")
        
        # Get all products with related materials
        queryset = Product.objects.prefetch_related('materials').all()
        
        # Log the number of products
        logger.info(f"Total number of products: {queryset.count()}")
        
        # Serialize the products
        serializer = self.get_serializer(queryset, many=True)
        
        # Log the serialized data
        logger.info("Serialized product data: %s", serializer.data)
        
        # Return the response
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def material_requirements(self, request, pk=None):
        product = self.get_object()
        materials = product.productmaterial_set.all()
        data = [{
            'material': material.material.name,
            'required_quantity': material.quantity,
            'available_quantity': material.material.quantity,
            'status': 'Available' if material.material.quantity >= material.quantity else 'Insufficient'
        } for material in materials]
        return Response(data)

    @action(detail=True, methods=['GET'])
    def workstation_sequence(self, request, pk=None):
        """
        Retrieve the workstation sequence for a specific product
        """
        try:
            product = self.get_object()
            sequences = ProductWorkstationSequence.objects.filter(product=product).order_by('sequence_order')
            
            # Log the number of sequences found
            logger.info(f"Found {sequences.count()} workstation sequences for product {product.id}")
            
            # If no sequences, log a debug message
            if not sequences.exists():
                logger.debug(f"No workstation sequences found for product {product.id}")
            
            # Use the existing serializer
            serializer = ProductWorkstationSequenceSerializer(sequences, many=True)
            return Response(serializer.data)
        except Product.DoesNotExist:
            logger.error(f"Product with id {pk} does not exist")
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error retrieving workstation sequence for product {pk}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['POST'])
    def update_workstation_sequence(self, request, pk=None):
        """
        Update or create workstation sequences for a product
        
        Expected payload:
        {
            "sequences": [
                {
                    "workstation_id": 1,
                    "sequence_order": 1,
                    "estimated_time": "01:30:00",
                    "instruction_set": {"key": "value"}
                },
                ...
            ]
        }
        """
        from datetime import timedelta

        product = self.get_object()
        sequences_data = request.data.get('sequences', [])
        
        # Clear existing sequences
        ProductWorkstationSequence.objects.filter(product=product).delete()
        
        # Create new sequences
        sequences_to_create = []
        for seq_data in sequences_data:
            workstation_id = seq_data.get('workstation_id')
            try:
                # Parse estimated time string to timedelta
                estimated_time_str = seq_data.get('estimated_time', '00:00:00')
                hours, minutes, seconds = map(int, estimated_time_str.split(':'))
                estimated_time = timedelta(hours=hours, minutes=minutes, seconds=seconds)

                workstation = WorkStation.objects.get(id=workstation_id)
                sequence = ProductWorkstationSequence(
                    product=product,
                    workstation=workstation,
                    sequence_order=seq_data.get('sequence_order', 0),
                    estimated_time=estimated_time,
                    instruction_set=seq_data.get('instruction_set', {})
                )
                sequences_to_create.append(sequence)
            except WorkStation.DoesNotExist:
                return Response(
                    {'error': f'Workstation with ID {workstation_id} does not exist'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            except (ValueError, TypeError) as e:
                return Response(
                    {'error': f'Invalid estimated time format: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Bulk create sequences
        ProductWorkstationSequence.objects.bulk_create(sequences_to_create)
        
        # Retrieve and return the created sequences
        created_sequences = ProductWorkstationSequence.objects.filter(product=product)
        serializer = ProductWorkstationSequenceSerializer(created_sequences, many=True)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a pending or in-progress work order
        """
        work_order = self.get_object()
        
        # Validate current status
        if work_order.status not in ['PENDING', 'IN_PROGRESS']:
            return Response({
                'error': 'Work order can only be cancelled when PENDING or IN_PROGRESS'
            }, status=400)
        
        # Optional cancellation reason
        reason = request.data.get('reason', '')
        
        # If work order was in progress, restore materials
        if work_order.status == 'IN_PROGRESS':
            for product_material in work_order.product.productmaterial_set.all():
                material = product_material.material
                required_quantity = product_material.quantity * work_order.quantity
                material.quantity += required_quantity
                material.save()
        
        # Update work order
        work_order.status = 'CANCELLED'
        work_order.notes = f"Cancelled: {reason}"
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Comprehensive work order dashboard statistics
        """
        today = timezone.now().date()
        
        stats = {
            'total_work_orders': WorkOrder.objects.count(),
            'status_breakdown': {
                status: WorkOrder.objects.filter(status=status).count()
                for status, _ in WorkOrder.WORK_ORDER_STATUS_CHOICES
            },
            'priority_breakdown': {
                priority: WorkOrder.objects.filter(priority=priority).count()
                for priority, _ in WorkOrder.PRIORITY_CHOICES
            },
            'today_work_orders': {
                'total': WorkOrder.objects.filter(start_date__date=today).count(),
                'completed': WorkOrder.objects.filter(
                    start_date__date=today, 
                    status='COMPLETED'
                ).count(),
                'in_progress': WorkOrder.objects.filter(
                    start_date__date=today, 
                    status='IN_PROGRESS'
                ).count()
            },
            'overdue_work_orders': WorkOrder.objects.filter(
                end_date__lt=today, 
                status__in=['PENDING', 'IN_PROGRESS']
            ).count(),
            'blocked_work_orders': WorkOrder.objects.filter(
                status='BLOCKED'
            ).count(),
            'upcoming_dependencies': WorkOrder.objects.filter(
                dependencies__status='PENDING'
            ).values('id', 'product__name', 'status').distinct()
        }
        
        return Response(stats)

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [permissions.AllowAny]  # Change to AllowAny for development

    def get_queryset(self):
        queryset = WorkOrder.objects.all().order_by('-created_at')
        
        # Optional filtering parameters
        status = self.request.query_params.get('status', None)
        product_id = self.request.query_params.get('product', None)
        start_date_from = self.request.query_params.get('start_date_from', None)
        start_date_to = self.request.query_params.get('start_date_to', None)

        # Log the query parameters for debugging
        print(f"WorkOrder Query Params: status={status}, product_id={product_id}, "
              f"start_date_from={start_date_from}, start_date_to={start_date_to}")

        if status:
            queryset = queryset.filter(status=status)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if start_date_from:
            queryset = queryset.filter(start_date__gte=start_date_from)
        if start_date_to:
            queryset = queryset.filter(start_date__lte=start_date_to)

        # Log the number of work orders after filtering
        print(f"Total WorkOrders after filtering: {queryset.count()}")

        return queryset

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        Start a pending work order with comprehensive checks
        """
        work_order = self.get_object()
        
        try:
            # Validate status transition
            work_order.validate_status_transition('IN_PROGRESS')
            
            # Check material availability
            material_status = work_order.check_material_availability()
            
            if not material_status['available']:
                # Log detailed material availability issues
                logger.error(f"Material availability check failed for Work Order {pk}")
                for material in material_status['materials']:
                    logger.error(
                        f"Insufficient Material: {material['material_name']} "
                        f"(ID: {material['material_id']})\n"
                        f"Required: {material['required_quantity']} "
                        f"Available: {material['available_quantity']}"
                    )
                
                return Response({
                    'error': 'Insufficient materials',
                    'material_details': material_status['materials']
                }, status=400)
            
            # Reserve materials
            work_order.reserve_materials()
            
            # Update work order status
            work_order.status = 'IN_PROGRESS'
            work_order.start_date = timezone.now()
            work_order.save()
            
            return Response({
                'status': 'Work order started successfully',
                'work_order_id': work_order.id,
                'material_status': material_status
            })
        
        except ValueError as e:
            # Log the specific error
            logger.error(f"Value Error starting work order {pk}: {str(e)}")
            return Response({
                'error': str(e)
            }, status=400)
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Error starting work order {pk}: {str(e)}")
            return Response({
                'error': 'Failed to start work order'
            }, status=500)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete a work order with comprehensive workflow
        """
        work_order = self.get_object()
        
        try:
            # Validate status transition
            work_order.validate_status_transition('COMPLETED')
            
            # Complete the work order
            work_order.complete_work_order()
            
            return Response({
                'status': 'Work order completed successfully',
                'work_order_id': work_order.id,
                'product_quantity': work_order.product.current_quantity
            })
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=400)
        except Exception as e:
            logger.error(f"Error completing work order {pk}: {str(e)}")
            return Response({
                'error': 'Failed to complete work order'
            }, status=500)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a work order and release reserved materials
        """
        work_order = self.get_object()
        
        try:
            # Validate status transition
            work_order.validate_status_transition('CANCELLED')
            
            # Release reserved materials
            work_order.release_reserved_materials()
            
            return Response({
                'status': 'Work order cancelled successfully',
                'work_order_id': work_order.id
            })
        
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=400)
        except Exception as e:
            logger.error(f"Error cancelling work order {pk}: {str(e)}")
            return Response({
                'error': 'Failed to cancel work order'
            }, status=500)

    @action(detail=False, methods=['get'])
    def workflow_summary(self, request):
        """
        Provide a comprehensive summary of work order workflow
        """
        # Aggregate work order status
        status_summary = WorkOrder.objects.values('status').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        )
        
        # Detailed status breakdown
        detailed_summary = {
            'total_work_orders': WorkOrder.objects.count(),
            'status_breakdown': list(status_summary),
            'recent_work_orders': WorkOrderSerializer(
                WorkOrder.objects.order_by('-created_at')[:10], 
                many=True
            ).data
        }
        
        return Response(detailed_summary)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Complete an in-progress work order
        """
        work_order = self.get_object()
        
        # Validate current status
        if work_order.status != 'IN_PROGRESS':
            return Response({
                'error': 'Work order can only be completed from IN_PROGRESS status'
            }, status=400)
        
        # Optional actual quantity parameter
        actual_quantity = request.data.get('actual_quantity', work_order.quantity)
        
        # Create production log
        # Use the first available workstation or None
        first_workstation = WorkStation.objects.first()
        
        ProductionLog.objects.create(
            work_order=work_order,
            workstation=first_workstation,
            quantity_produced=actual_quantity,
            notes=f"Completed work order {work_order.id}"
        )
        
        # Update work order
        work_order.status = 'COMPLETED'
        work_order.end_date = timezone.now()
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a pending or in-progress work order
        """
        work_order = self.get_object()
        
        # Validate current status
        if work_order.status not in ['PENDING', 'IN_PROGRESS']:
            return Response({
                'error': 'Work order can only be cancelled when PENDING or IN_PROGRESS'
            }, status=400)
        
        # Optional cancellation reason
        reason = request.data.get('reason', '')
        
        # If work order was in progress, restore materials
        if work_order.status == 'IN_PROGRESS':
            for product_material in work_order.product.productmaterial_set.all():
                material = product_material.material
                required_quantity = product_material.quantity * work_order.quantity
                material.quantity += required_quantity
                material.save()
        
        # Update work order
        work_order.status = 'CANCELLED'
        work_order.notes = f"Cancelled: {reason}"
        work_order.save()
        
        serializer = self.get_serializer(work_order)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """
        Comprehensive work order dashboard statistics
        """
        today = timezone.now().date()
        
        stats = {
            'total_work_orders': WorkOrder.objects.count(),
            'status_breakdown': {
                status: WorkOrder.objects.filter(status=status).count()
                for status, _ in WorkOrder.WORK_ORDER_STATUS_CHOICES
            },
            'priority_breakdown': {
                priority: WorkOrder.objects.filter(priority=priority).count()
                for priority, _ in WorkOrder.PRIORITY_CHOICES
            },
            'today_work_orders': {
                'total': WorkOrder.objects.filter(start_date__date=today).count(),
                'completed': WorkOrder.objects.filter(
                    start_date__date=today, 
                    status='COMPLETED'
                ).count(),
                'in_progress': WorkOrder.objects.filter(
                    start_date__date=today, 
                    status='IN_PROGRESS'
                ).count()
            },
            'overdue_work_orders': WorkOrder.objects.filter(
                end_date__lt=today, 
                status__in=['PENDING', 'IN_PROGRESS']
            ).count(),
            'blocked_work_orders': WorkOrder.objects.filter(
                status='BLOCKED'
            ).count(),
            'upcoming_dependencies': WorkOrder.objects.filter(
                dependencies__status='PENDING'
            ).values('id', 'product__name', 'status').distinct()
        }
        
        return Response(stats)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'

class ProductionLogViewSet(viewsets.ModelViewSet):
    queryset = ProductionLog.objects.all().order_by('-created_at')
    serializer_class = ProductionLogSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ['workstation__name', 'work_order__id']
    search_fields = ['work_order__id', 'workstation__name', 'notes']

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Get today's date in the current timezone
        today = timezone.now().date()
        
        # Optional date filtering from query params
        date_param = self.request.query_params.get('date', None)
        if date_param:
            try:
                today = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                # Fallback to current date if parsing fails
                today = timezone.now().date()
        
        # Filter for logs on the specified date
        queryset = queryset.filter(created_at__date=today)
        
        search_query = self.request.query_params.get('search', None)
        
        if search_query:
            queryset = queryset.filter(
                Q(work_order__id__icontains=search_query) | 
                Q(workstation__name__icontains=search_query) | 
                Q(work_order__product__name__icontains=search_query) |
                Q(notes__icontains=search_query)
            )
        
        return queryset

class WorkstationProcessViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing manufacturing processes
    Provides CRUD operations and additional insights
    """
    queryset = WorkstationProcess.objects.all()
    serializer_class = WorkstationProcessSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['GET'])
    def process_sequence(self, request):
        """
        Get process sequence for a specific product
        """
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        processes = WorkstationProcess.objects.filter(product_id=product_id).order_by('sequence_order')
        serializer = self.get_serializer(processes, many=True)
        return Response(serializer.data)

class WorkstationEfficiencyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tracking and analyzing workstation efficiency
    """
    queryset = WorkstationEfficiencyMetric.objects.all()
    serializer_class = WorkstationEfficiencyMetricSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['GET'])
    def performance_summary(self, request):
        """
        Provide a comprehensive performance summary
        """
        # Aggregate efficiency metrics across all workstations
        summary = self.get_queryset().aggregate(
            avg_idle_time=Avg('total_idle_time'),
            avg_material_wastage=Avg(
                ExpressionWrapper(
                    F('total_material_wasted') / F('total_material_used') * 100, 
                    output_field=fields.FloatField()
                )
            ),
            avg_defect_rate=Avg(
                ExpressionWrapper(
                    F('total_items_with_defects') / F('total_items_processed') * 100, 
                    output_field=fields.FloatField()
                )
            )
        )
        return Response(summary)

class ProductionDesignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing production designs and cutting diagrams
    """
    queryset = ProductionDesign.objects.all()
    serializer_class = ProductionDesignSerializer
    permission_classes = [permissions.AllowAny]

    @action(detail=True, methods=['POST'])
    def upload_cutting_diagram(self, request, pk=None):
        """
        Upload a nested cutting diagram for a specific design
        """
        design = self.get_object()
        diagram = request.FILES.get('diagram')
        
        if not diagram:
            return Response({'error': 'No diagram uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        design.nested_cutting_diagram = diagram
        design.save()
        
        return Response({
            'message': 'Cutting diagram uploaded successfully',
            'diagram_url': design.nested_cutting_diagram.url
        })

class ProductionEventViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tracking and analyzing production events
    """
    queryset = ProductionEvent.objects.all()
    serializer_class = ProductionEventSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        """
        Optionally filter events by various parameters
        """
        queryset = super().get_queryset()
        
        # Filter by event type
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        # Filter by work order
        work_order_id = self.request.query_params.get('work_order_id')
        if work_order_id:
            queryset = queryset.filter(work_order_id=work_order_id)
        
        # Filter by product
        product_id = self.request.query_params.get('product_id')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset

    @action(detail=False, methods=['GET'])
    def event_timeline(self, request):
        """
        Generate a comprehensive event timeline with pagination
        """
        # Get query parameters for pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        # Calculate start and end indices
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        
        # Get base queryset and order
        events = self.get_queryset().order_by('-created_at')
        
        # Paginate the events
        paginated_events = events[start_index:end_index]
        
        # Serialize the events
        serializer = self.get_serializer(paginated_events, many=True)
        
        return Response({
            'total_events': events.count(),
            'events': serializer.data
        })

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate, login, logout
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            # Create or get token for the user
            token, _ = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                }
            })
        
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        # Basic validation
        if not username or not email or not password:
            return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create user
        user = User.objects.create_user(
            username=username, 
            email=email, 
            password=password
        )
        
        # Create token for the user
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            }
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    def post(self, request):
        # Delete the user's token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        logout(request)
        return Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
