#!/bin/bash

# Commit message
COMMIT_MESSAGE="Implement Workstation Last Maintenance Tracking

- Added last_maintenance field to WorkStation model
- Updated WorkStation serializer to include last_maintenance_display
- Modified frontend to display last maintenance date in workstation cards
- Simplified maintenance log tracking with model-level updates
- Improved workstation status and maintenance visibility"

# Navigate to the project directory
cd /Users/T/Documents/GitHub/metalcraft2

# Add all changes
git add .

# Commit with the prepared message
git commit -m "$COMMIT_MESSAGE"

# Push changes
git push

echo "Changes committed and pushed successfully!"
