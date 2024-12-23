from rest_framework import serializers
from .models import Product  # Assuming you have a Product model

class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model
    """
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'category', 
            'price', 
            'stock_quantity', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
