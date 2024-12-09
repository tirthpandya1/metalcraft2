# MetalCraft Manufacturing Management System

A real-time manufacturing management system for metal works production tracking and analytics.

## Features

- Real-time production line monitoring
- Inventory management for raw materials and work-in-progress
- Workflow tracking across different workstations
- Production efficiency analytics
- Real-time alerts and notifications
- Material wastage tracking
- Production planning and forecasting
- Token-based authentication

## Tech Stack

- Backend: Django with Django Channels for WebSocket support
- Frontend: React with Material-UI
- Database: PostgreSQL
- Real-time Communication: WebSocket
- Authentication: Token-based with Django REST Framework
- State Management: React Context API

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Unix/macOS
```

2. Install backend dependencies:
```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

4. Configure PostgreSQL Database
- Create a database named `metalcraft_db`
- Create a user with appropriate permissions
- Update database settings in `settings.py`

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create initial superuser:
```bash
python manage.py create_initial_user
```

7. Start the development servers:
```bash
# Backend (in one terminal)
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Authentication Endpoints

- `POST /api/auth/register/`: Register a new user
  - Request: `{username, email, password}`
  - Response: `{token, user{id, username, email}}`

- `POST /api/auth/login/`: Authenticate user
  - Request: `{username, password}`
  - Response: `{token, user{id, username, email}}`

- `POST /api/auth/logout/`: Invalidate current token
  - Requires authentication token

## Default Credentials (Development Only)

- Username: `admin`
- Email: `admin@metalcraft.com`
- Password: `adminpassword`

## Security Notes

- Use strong, unique passwords
- Keep SECRET_KEY confidential
- Do not use development settings in production
- Configure proper CORS and security settings

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Specify your license here]
