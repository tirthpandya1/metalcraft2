#!/usr/bin/env python3

import os
import subprocess
import re
from typing import List, Dict, Tuple
import textwrap
import difflib
import sys
import tkinter as tk
from tkinter import simpledialog, messagebox

def install_tkinter():
    """
    Attempt to install Tkinter for macOS
    """
    print("Tkinter not found. Attempting to install...")
    try:
        # For macOS with Homebrew Python
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'tk'], check=True)
        print("Tkinter installed successfully.")
        return True
    except subprocess.CalledProcessError:
        print("Failed to install Tkinter automatically.")
        return False

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
    # Categorize changes
    frontend_changes = [
        (file, file_changes) for file, file_changes in changes.get('modified', []) 
        if file.startswith('frontend/')
    ]
    backend_changes = [
        (file, file_changes) for file, file_changes in changes.get('modified', []) 
        if file.startswith('manufacturing/')
    ]
    
    # Prepare message components
    message_parts = []
    
    # Determine primary focus
    if frontend_changes and backend_changes:
        message_parts.append("Full Stack Update:")
    elif frontend_changes:
        message_parts.append("🖥️ Frontend Enhancement:")
    elif backend_changes:
        message_parts.append("🔧 Backend Improvement:")
    else:
        message_parts.append("Project Update:")
    
    # Track number of files changed
    total_files_changed = (
        len(changes.get('added', [])) + 
        len(changes.get('modified', [])) + 
        len(changes.get('deleted', []))
    )
    message_parts.append(f" {total_files_changed} files changed")
    
    # Detailed change tracking
    if frontend_changes:
        message_parts.append("\n🖥️ Frontend:")
        for file, file_changes in frontend_changes[:3]:  # Limit to first 3 files
            # Clean and truncate changes
            clean_changes = [
                change[:50] + '...' if len(change) > 50 else change 
                for change in file_changes[:2]  # Limit to first 2 changes
            ]
            # Extract meaningful file name
            short_file_name = file.replace('frontend/src/', '').replace('/', ' > ')
            message_parts.append(f"- {short_file_name}: {', '.join(clean_changes)}")
    
    if backend_changes:
        message_parts.append("\n🔧 Backend:")
        for file, file_changes in backend_changes[:3]:  # Limit to first 3 files
            # Clean and truncate changes
            clean_changes = [
                change[:50] + '...' if len(change) > 50 else change 
                for change in file_changes[:2]  # Limit to first 2 changes
            ]
            # Extract meaningful file name
            short_file_name = file.replace('manufacturing/', '').replace('/', ' > ')
            message_parts.append(f"- {short_file_name}: {', '.join(clean_changes)}")
    
    return ''.join(message_parts)

def git_add_all():
    """Stage all changes."""
    subprocess.run(['git', 'add', '.'], cwd='/Users/T/Documents/GitHub/metalcraft2')

def git_commit(message: str):
    """Commit changes with a specified message."""
    try:
        # Print full message before committing
        print("Full Commit Message:")
        print("---")
        print(message)
        print("---")
        print(f"Message Length: {len(message)} characters")

        # Commit with the full message
        result = subprocess.run(
            ['git', 'commit', '-m', message], 
            capture_output=True, 
            text=True, 
            cwd='/Users/T/Documents/GitHub/metalcraft2'
        )
        
        # Check if commit was successful
        if result.returncode == 0:
            print("Commit successful!")
            print("Git Output:", result.stdout.strip())
        else:
            print("Commit failed.")
            print("Error:", result.stderr.strip())
    except Exception as e:
        print(f"Error during commit: {e}")

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

def create_commit_ui(commit_message, changes):
    """
    Create a UI for commit confirmation with detailed change preview
    
    Args:
        commit_message (str): Generated commit message
        changes (Dict): Detailed changes dictionary
    
    Returns:
        str: User's action ('commit', 'edit', 'cancel')
    """
    # Create main window
    root = tk.Tk()
    root.title("Git Commit Confirmation")
    root.geometry("600x500")
    root.configure(bg='#f0f0f0')

    # Result storage
    commit_action = [None]

    # Styling
    font_title = ('Arial', 12, 'bold')
    font_normal = ('Arial', 10)

    # Title Frame
    title_frame = tk.Frame(root, bg='#f0f0f0')
    title_frame.pack(pady=10, padx=10, fill='x')
    
    title_label = tk.Label(
        title_frame, 
        text="Review Git Commit Changes", 
        font=font_title, 
        bg='#f0f0f0'
    )
    title_label.pack()

    # Commit Message Frame
    message_frame = tk.Frame(root, bg='white', borderwidth=1, relief='solid')
    message_frame.pack(pady=10, padx=10, fill='both', expand=True)
    
    message_label = tk.Label(
        message_frame, 
        text="Commit Message:", 
        font=font_title, 
        bg='white', 
        anchor='w'
    )
    message_label.pack(fill='x', padx=5, pady=(5,0))
    
    message_text = tk.Text(
        message_frame, 
        height=5, 
        font=font_normal, 
        wrap='word', 
        borderwidth=0
    )
    message_text.insert(tk.END, commit_message)
    message_text.config(state=tk.DISABLED)
    message_text.pack(fill='both', expand=True, padx=5, pady=5)

    # Changes Preview Frame
    changes_frame = tk.Frame(root, bg='white', borderwidth=1, relief='solid')
    changes_frame.pack(pady=10, padx=10, fill='both', expand=True)
    
    changes_label = tk.Label(
        changes_frame, 
        text="Changes Preview:", 
        font=font_title, 
        bg='white', 
        anchor='w'
    )
    changes_label.pack(fill='x', padx=5, pady=(5,0))
    
    changes_text = tk.Text(
        changes_frame, 
        height=10, 
        font=font_normal, 
        wrap='word', 
        borderwidth=0
    )
    
    # Populate changes text
    changes_content = []
    for change_type, file_changes in changes.items():
        if file_changes:
            changes_content.append(f"{change_type.upper()} Changes:")
            for file, details in file_changes:
                changes_content.append(f"- {file}")
                for detail in details[:3]:  # Limit to first 3 details
                    changes_content.append(f"  * {detail}")
    
    changes_text.insert(tk.END, '\n'.join(changes_content))
    changes_text.config(state=tk.DISABLED)
    changes_text.pack(fill='both', expand=True, padx=5, pady=5)

    # Button Frame
    button_frame = tk.Frame(root, bg='#f0f0f0')
    button_frame.pack(pady=10, padx=10, fill='x')

    def on_commit():
        commit_action[0] = 'commit'
        root.quit()

    def on_edit():
        commit_action[0] = 'edit'
        root.quit()

    def on_cancel():
        commit_action[0] = 'cancel'
        root.quit()

    # Buttons
    commit_btn = tk.Button(
        button_frame, 
        text="Commit", 
        command=on_commit, 
        bg='#4CAF50', 
        fg='white', 
        font=font_normal
    )
    commit_btn.pack(side=tk.LEFT, expand=True, padx=5)

    edit_btn = tk.Button(
        button_frame, 
        text="Edit Message", 
        command=on_edit, 
        bg='#2196F3', 
        fg='white', 
        font=font_normal
    )
    edit_btn.pack(side=tk.LEFT, expand=True, padx=5)

    cancel_btn = tk.Button(
        button_frame, 
        text="Cancel", 
        command=on_cancel, 
        bg='#f44336', 
        fg='white', 
        font=font_normal
    )
    cancel_btn.pack(side=tk.LEFT, expand=True, padx=5)

    # Center the window
    root.update_idletasks()
    width = root.winfo_width()
    height = root.winfo_height()
    x = (root.winfo_screenwidth() // 2) - (width // 2)
    y = (root.winfo_screenheight() // 2) - (height // 2)
    root.geometry(f'{width}x{height}+{x}+{y}')

    # Show the window
    root.mainloop()
    root.destroy()

    return commit_action[0]

def main():
    """
    Main script to handle git commit and push workflow.
    Provides UI interaction and confirmation before committing.
    """
    # Retrieve and analyze git changes
    git_diff_content = get_git_diff()
    changes = analyze_changes(git_diff_content)
    
    # Generate commit message
    commit_message = generate_commit_message(changes)
    
    # Stage all changes
    git_add_all()
    
    # Show UI and get user action
    user_action = create_commit_ui(commit_message, changes)
    
    if user_action == 'commit':
        # Proceed with commit
        commit_result = git_commit(commit_message)
        
        # Prompt for push
        push_response = messagebox.askyesno(
            "Push Changes", 
            "Do you want to push these changes to the remote repository?"
        )
        
        if push_response:
            git_push()
            messagebox.showinfo("Success", "Changes committed and pushed successfully!")
        else:
            messagebox.showinfo("Local Commit", "Changes committed locally. Not pushed to remote.")
    
    elif user_action == 'edit':
        # Open dialog for custom message
        custom_message = simpledialog.askstring(
            "Edit Commit Message", 
            "Enter your custom commit message:", 
            initialvalue=commit_message
        )
        
        if custom_message:
            # Commit with custom message
            commit_result = git_commit(custom_message)
            
            push_response = messagebox.askyesno(
                "Push Changes", 
                "Do you want to push these changes to the remote repository?"
            )
            
            if push_response:
                git_push()
                messagebox.showinfo("Success", "Changes committed and pushed successfully!")
            else:
                messagebox.showinfo("Local Commit", "Changes committed locally. Not pushed to remote.")
    
    else:
        messagebox.showinfo("Cancelled", "Git commit was cancelled.")

if __name__ == '__main__':
    main()
