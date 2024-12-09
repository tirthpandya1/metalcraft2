from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from datetime import timedelta

class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        try:
            token = self.model.objects.get(key=key)
        except self.model.DoesNotExist:
            raise AuthenticationFailed('Invalid token')

        # Check token expiration (24 hours)
        if token.created < timezone.now() - timedelta(hours=24):
            token.delete()
            raise AuthenticationFailed('Token has expired')

        if not token.user.is_active:
            raise AuthenticationFailed('User inactive or deleted')

        return (token.user, token)
