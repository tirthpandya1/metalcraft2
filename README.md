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

## Tech Stack

- Backend: Django with Django Channels for WebSocket support
- Frontend: React with Material-UI
- Database: PostgreSQL
- Real-time Communication: WebSocket
- State Management: Redux

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

4. Run migrations:
```bash
python manage.py migrate
```

5. Start the development servers:
```bash
# Backend
python manage.py runserver

# Frontend (in a separate terminal)
cd frontend
npm start
```
