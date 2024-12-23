from rest_framework import serializers
from manufacturing.models import Material

class MaterialSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = Material
        fields = ['id', 'name', 'description', 'quantity', 'unit', 'reorder_level', 'cost_per_unit', 'created_at', 'status']
        read_only_fields = ['id', 'created_at', 'status']

    def get_status(self, obj):
        """
        Compute stock status based on quantity and reorder level
        """
        try:
            quantity = float(obj.quantity)
            reorder_level = float(obj.reorder_level)

            if quantity <= 0:
                return 'Out of Stock'
            
            if quantity <= reorder_level:
                return 'Low Stock'
            
            return 'In Stock'
        except (TypeError, ValueError):
            return 'Unknown'
