from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    WorkStationViewSet, MaterialViewSet, ProductViewSet, 
    WorkOrderViewSet, ProductionLogViewSet, LoginView, 
    RegisterView, LogoutView,
    # New ViewSets
    WorkstationProcessViewSet, WorkstationEfficiencyViewSet, 
    ProductionDesignViewSet, ProductionEventViewSet
)
from .analytics import ProfitabilityAnalyticsView

# Create a router and register our ViewSets
router = DefaultRouter()

# Existing ViewSets
router.register(r'workstations', WorkStationViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'products', ProductViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'production-logs', ProductionLogViewSet)

# New ViewSets for Production Line Management
router.register(r'workstation-processes', WorkstationProcessViewSet)
router.register(r'workstation-efficiency', WorkstationEfficiencyViewSet)
router.register(r'production-designs', ProductionDesignViewSet)
router.register(r'production-events', ProductionEventViewSet)

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentication Views
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # Custom action routes
    path('workstations/<int:pk>/update-status/', 
         WorkStationViewSet.as_view({'post': 'update_status'}), 
         name='workstation-update-status'),
    
    path('products/<int:pk>/material-requirements/', 
         ProductViewSet.as_view({'get': 'material_requirements'}), 
         name='product-material-requirements'),
    
    path('work-orders/workflow-summary/', 
         WorkOrderViewSet.as_view({'get': 'workflow_summary'}), 
         name='work-order-workflow-summary'),
    
    # New PLM-specific routes
    path('workstation-processes/process-sequence/', 
         WorkstationProcessViewSet.as_view({'get': 'process_sequence'}), 
         name='workstation-process-sequence'),
    
    path('workstation-efficiency/performance-summary/', 
         WorkstationEfficiencyViewSet.as_view({'get': 'performance_summary'}), 
         name='workstation-efficiency-summary'),
    
    path('production-designs/<int:pk>/upload-diagram/', 
         ProductionDesignViewSet.as_view({'post': 'upload_cutting_diagram'}), 
         name='production-design-upload-diagram'),
    
    path('production-events/event-timeline/', 
         ProductionEventViewSet.as_view({'get': 'event_timeline'}), 
         name='production-event-timeline'),
]
