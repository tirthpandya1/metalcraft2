from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

class Command(BaseCommand):
    help = 'Create initial superuser and generate token'

    def handle(self, *args, **kwargs):
        # Check if superuser already exists
        if not User.objects.filter(is_superuser=True).exists():
            # Create superuser
            superuser = User.objects.create_superuser(
                username='admin',
                email='admin@metalcraft.com',
                password='adminpassword'
            )
            
            # Generate token
            token, _ = Token.objects.get_or_create(user=superuser)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created superuser: {superuser.username}'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Token: {token.key}'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('Superuser already exists')
            )
