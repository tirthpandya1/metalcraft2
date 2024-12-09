#!/usr/bin/env python3

import os
import subprocess
import re
from typing import List, Dict, Tuple
import textwrap
import difflib

def get_git_diff() -> str:
    """Retrieve the git diff of staged changes."""
    try:
        result = subprocess.run(
            ['git', 'diff', '--cached'], 
            capture_output=True, 
            text=True, 
            cwd='/Users/T/Documents/GitHub/metalcraft2'
        )
        return result.stdout
    except Exception as e:
        print(f"Error retrieving git diff: {e}")
        return ""

def analyze_changes(diff: str) -> Dict[str, List[Tuple[str, List[str]]]]:
    """
    Analyze the git diff with more detailed change tracking.
    
    Returns a dictionary with:
    - files changed
    - type of changes (added/modified/deleted)
    - specific line changes
    """
    changes = {
        'added': [],
        'modified': [],
        'deleted': []
    }
    
    current_file = None
    current_changes = []
    
    for line in diff.split('\n'):
        # Detect file changes
        if line.startswith('diff --git'):
            # If we had a previous file, add its changes
            if current_file:
                changes[change_type].append((current_file, current_changes))
            
            # Reset for new file
            current_file = line.split(' ')[-1].replace('a/', '')
            current_changes = []
            change_type = 'modified'
        
        # Track specific line changes
        elif line.startswith('+++ b/'):
            current_file = line[6:].strip()
            change_type = 'added'
        elif line.startswith('--- a/'):
            current_file = line[6:].strip()
            change_type = 'deleted' if 'deleted file mode' in diff else 'modified'
        
        # Capture meaningful line changes
        elif line.startswith('+') and not line.startswith('+++'):
            current_changes.append(line[1:].strip())
        elif line.startswith('-') and not line.startswith('---'):
            current_changes.append(f"Removed: {line[1:].strip()}")
    
    # Add last file's changes
    if current_file:
        changes[change_type].append((current_file, current_changes))
    
    return changes

def generate_commit_message(changes: Dict[str, List[Tuple[str, List[str]]]]) -> str:
    """Generate a detailed, context-aware commit message."""
    message_parts = []
    
    # Categorize changes by project area
    frontend_changes = [
        (file, changes) for file, changes in changes.get('modified', []) 
        if file.startswith('frontend/')
    ]
    backend_changes = [
        (file, changes) for file, changes in changes.get('modified', []) 
        if file.startswith('manufacturing/')
    ]
    
    # High-level summary
    summary_parts = []
    if frontend_changes:
        summary_parts.append(f"{len(frontend_changes)} frontend files")
    if backend_changes:
        summary_parts.append(f"{len(backend_changes)} backend files")
    
    # Detailed message
    message_lines = [
        "Comprehensive Project Update",
        f"Changes: {', '.join(summary_parts)}"
    ]
    
    # Frontend changes details
    if frontend_changes:
        message_lines.append("\nFrontend Updates:")
        for file, file_changes in frontend_changes:
            # Truncate and clean file changes
            clean_changes = [
                change[:100] + '...' if len(change) > 100 else change 
                for change in file_changes[:3]  # Limit to first 3 changes
            ]
            message_lines.append(f"- {file.replace('frontend/', '')}: {', '.join(clean_changes)}")
    
    # Backend changes details
    if backend_changes:
        message_lines.append("\nBackend Updates:")
        for file, file_changes in backend_changes:
            # Truncate and clean file changes
            clean_changes = [
                change[:100] + '...' if len(change) > 100 else change 
                for change in file_changes[:3]  # Limit to first 3 changes
            ]
            message_lines.append(f"- {file.replace('manufacturing/', '')}: {', '.join(clean_changes)}")
    
    # Combine and wrap the message
    return '\n'.join(message_lines)

def git_add_all():
    """Stage all changes."""
    subprocess.run(['git', 'add', '.'], cwd='/Users/T/Documents/GitHub/metalcraft2')

def git_commit(message: str):
    """Commit changes with the generated message."""
    try:
        subprocess.run(
            ['git', 'commit', '-m', message], 
            cwd='/Users/T/Documents/GitHub/metalcraft2',
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Commit failed: {e}")
        return False
    return True

def git_push():
    """Push commits to the remote repository."""
    try:
        subprocess.run(
            ['git', 'push'], 
            cwd='/Users/T/Documents/GitHub/metalcraft2',
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Push failed: {e}")
        return False
    return True

def main():
    # Stage all changes
    git_add_all()
    
    # Get and analyze changes
    diff = get_git_diff()
    changes = analyze_changes(diff)
    
    # Generate commit message
    commit_message = generate_commit_message(changes)
    
    # Print the generated message for review
    print("Generated Commit Message:")
    print(commit_message)
    
    # Commit changes
    if git_commit(commit_message):
        # Push to remote
        if git_push():
            print("Changes successfully committed and pushed!")
        else:
            print("Commit successful, but push failed.")
    else:
        print("Commit failed.")

if __name__ == '__main__':
    main()
