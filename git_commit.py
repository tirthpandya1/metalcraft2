#!/usr/bin/env python3

import os
import subprocess
import re
from typing import List, Dict
import difflib
import textwrap

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

def analyze_changes(diff: str) -> Dict[str, List[str]]:
    """Analyze the git diff and categorize changes."""
    changes = {
        'added': [],
        'modified': [],
        'deleted': []
    }
    
    for line in diff.split('\n'):
        if line.startswith('+++'):
            file_path = line[4:].strip()
            if file_path.startswith('a/') or file_path.startswith('b/'):
                file_path = file_path[2:]
            
            if 'deleted file mode' in diff:
                changes['deleted'].append(file_path)
            elif line.startswith('+++ b/'):
                changes['added'].append(file_path)
            elif line.startswith('+++ a/'):
                changes['modified'].append(file_path)
    
    return changes

def generate_commit_message(changes: Dict[str, List[str]]) -> str:
    """Generate a concise, informative commit message."""
    message_parts = []
    
    # Categorize changes by project area
    frontend_changes = [f for f in (changes['added'] + changes['modified']) if f.startswith('frontend/')]
    backend_changes = [f for f in (changes['added'] + changes['modified']) if f.startswith('manufacturing/')]
    
    # Construct message
    if frontend_changes:
        frontend_summary = "Frontend updates: " + ", ".join(set(
            re.sub(r'^frontend/', '', f).split('/')[0] for f in frontend_changes
        ))
        message_parts.append(frontend_summary)
    
    if backend_changes:
        backend_summary = "Backend updates: " + ", ".join(set(
            re.sub(r'^manufacturing/', '', f).split('/')[0] for f in backend_changes
        ))
        message_parts.append(backend_summary)
    
    if changes['deleted']:
        message_parts.append(f"Removed {len(changes['deleted'])} files")
    
    # Fallback if no specific changes detected
    if not message_parts:
        message_parts.append("Minor project updates")
    
    # Combine and wrap the message
    full_message = "\n\nDetails:\n" + "\n".join(f"- {part}" for part in message_parts)
    
    return textwrap.fill(full_message, width=72)

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
