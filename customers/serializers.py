from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Customer  # Assuming you have a Customer model

class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model
    """
    class Meta:
        model = Customer
        fields = [
            'id', 
            'name', 
            'email', 
            'phone', 
            'address', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
