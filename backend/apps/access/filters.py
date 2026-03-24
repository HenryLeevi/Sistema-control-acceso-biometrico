from django_filters import rest_framework as filters
from .models import AccessEvent

class AccessEventFilter(filters.FilterSet):
    start_date = filters.DateFilter(field_name="timestamp", lookup_expr="date__gte")
    end_date = filters.DateFilter(field_name="timestamp", lookup_expr="date__lte")
    
    class Meta:
        model = AccessEvent
        fields = ["user", "aula", "device", "method", "result", "alert_flag", "start_date", "end_date"]
