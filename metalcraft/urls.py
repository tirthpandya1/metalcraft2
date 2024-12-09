"""
URL configuration for metalcraft project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
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
    WorkOrderViewSet, ProductionLogViewSet, LoginView, RegisterView, LogoutView
)
from manufacturing.analytics import (
    DashboardAnalyticsView, 
    EfficiencyTrendView, 
    CostAnalyticsView
)

router = DefaultRouter()
router.register(r'workstations', WorkStationViewSet)
router.register(r'materials', MaterialViewSet)
router.register(r'products', ProductViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'production-logs', ProductionLogViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('accounts.urls')),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    
    # Authentication routes
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    
    # JWT Authentication Routes
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Analytics Endpoints
    path('api/analytics/dashboard/', DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    path('api/analytics/efficiency/', EfficiencyTrendView.as_view(), name='efficiency_trend'),
    path('api/analytics/cost/', CostAnalyticsView.as_view(), name='cost_analytics'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
