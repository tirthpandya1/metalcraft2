"""
URL configuration for metalcraft project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from manufacturing.views import (
    WorkStationViewSet, MaterialViewSet, ProductViewSet,
    WorkOrderViewSet, ProductionLogViewSet, 
    LoginView, RegisterView, LogoutView,
    WorkstationProcessViewSet, WorkstationEfficiencyViewSet, 
    ProductionDesignViewSet, ProductionEventViewSet,
    SupplierViewSet
)
from manufacturing.analytics import (
    DashboardAnalyticsView, 
    EfficiencyTrendView, 
    CostAnalyticsView,
    ProfitabilityAnalyticsView
)

router = DefaultRouter()

router.register(r'workstations', WorkStationViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'products', ProductViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'production-logs', ProductionLogViewSet)

router.register(r'workstation-processes', WorkstationProcessViewSet)
router.register(r'workstation-efficiency', WorkstationEfficiencyViewSet)
router.register(r'production-designs', ProductionDesignViewSet)
router.register(r'production-events', ProductionEventViewSet)
router.register(r'suppliers', SupplierViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # JWT Token Authentication
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Manufacturing API
    path('api/', include('manufacturing.urls')),
    
    # Analytics Endpoints
    path('api/analytics/dashboard/', DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    path('api/analytics/efficiency/', EfficiencyTrendView.as_view(), name='efficiency_trend'),
    path('api/analytics/cost/', CostAnalyticsView.as_view(), name='cost_analytics'),
    path('api/analytics/profitability/', ProfitabilityAnalyticsView.as_view(), name='profitability_analytics'),
    
    path('api/', include(router.urls)),
    
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    
    path('api-auth/', include('rest_framework.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
