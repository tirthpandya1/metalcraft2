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
import requests
import time

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
        message_parts.append(" Frontend Enhancement:")
    elif backend_changes:
        message_parts.append(" Backend Improvement:")
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
        message_parts.append("\n Frontend:")
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
        message_parts.append("\n Backend:")
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

def generate_smart_commit_message(changes):
    """
    Generate a smart, descriptive commit message based on detected changes
    
    Args:
        changes (Dict): Dictionary of changes detected in the repository
    
    Returns:
        str: A concise, informative commit message
    """
    # Categorize changes
    frontend_changes = changes.get('frontend', [])
    backend_changes = changes.get('backend', [])
    
    # Initialize message parts
    message_parts = []
    
    # Determine overall change type
    if frontend_changes and backend_changes:
        message_parts.append("Full Stack Update:")
    elif frontend_changes:
        message_parts.append("Frontend Enhancement:")
    elif backend_changes:
        message_parts.append("Backend Improvement:")
    else:
        message_parts.append("Project Update:")
    
    # Add context about specific changes
    if frontend_changes:
        message_parts.append("\n Frontend Changes:")
        for file, file_changes in frontend_changes[:3]:  # Limit to first 3 files
            # Clean and truncate changes
            clean_changes = [
                change.strip() 
                for change in file_changes 
                if change.strip() and len(change) < 50
            ][:2]  # Limit to 2 changes per file
            
            # Get short file name
            short_file_name = os.path.basename(file)
            message_parts.append(f"- {short_file_name}: {', '.join(clean_changes)}")
    
    if backend_changes:
        message_parts.append("\n Backend Changes:")
        for file, file_changes in backend_changes[:3]:  # Limit to first 3 files
            # Clean and truncate changes
            clean_changes = [
                change.strip() 
                for change in file_changes 
                if change.strip() and len(change) < 50
            ][:2]  # Limit to 2 changes per file
            
            # Get short file name
            short_file_name = os.path.basename(file)
            message_parts.append(f"- {short_file_name}: {', '.join(clean_changes)}")
    
    # Combine and format message
    commit_message = ' '.join(message_parts)
    
    # Ensure message is not too long
    if len(commit_message) > 200:
        commit_message = commit_message[:197] + '...'
    
    return commit_message

def start_ollama_service():
    """Start the Ollama service."""
    try:
        # Check if Ollama is already running
        subprocess.run(['pgrep', 'ollama'], check=True)
        print("Ollama service is already running.")
        return True
    except subprocess.CalledProcessError:
        try:
            # Start Ollama service
            subprocess.Popen(['ollama', 'serve'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            # Wait for the service to start
            time.sleep(3)
            print("Ollama service started successfully.")
            return True
        except Exception as e:
            print(f"Failed to start Ollama service: {e}")
            return False

def stop_ollama_service():
    """Stop the Ollama service."""
    try:
        subprocess.run(['pkill', 'ollama'], check=True)
        print("Ollama service stopped.")
    except subprocess.CalledProcessError:
        print("No Ollama service to stop.")

def generate_commit_message_with_ollama(changes_summary: str, full_diff: str) -> str:
    """
    Generate a commit message using Ollama's Llama3.1 model with full changelog context.
    
    Args:
        changes_summary (str): A summary of the changes detected in the repository
        full_diff (str): Complete git diff with detailed changes
    
    Returns:
        str: A generated commit message
    """
    # Ensure Ollama service is running
    if not start_ollama_service():
        return "Chore: Minor updates across project"
    
    try:
        # Prepare the prompt for commit message generation
        prompt = f"""You are a professional git commit message generator for a Manufacturing Management System. 
        Your task is to generate a concise, meaningful commit message that captures the essence of the changes.

        Context:
        Changes Summary:
        {changes_summary}

        Full Changelog:
        {full_diff}

        Requirements:
        - Use conventional commit format (type: description)
        - Be specific about the key changes
        - Highlight the most significant modifications
        - Use imperative mood
        - Capitalize the first letter
        - Focus on the impact and purpose of the changes

        Generate ONLY the commit message, without any additional explanation."""

        # Make request to local Ollama service
        response = requests.post('http://localhost:11434/api/generate', json={
            'model': 'llama3.1',
            'prompt': prompt,
            'stream': False
        })
        
        if response.status_code == 200:
            # Extract the generated message
            generated_message = response.json().get('response', '').strip()
            
            # Cleanup and validate the message
            generated_message = generated_message.replace('"', '').strip()
            
            # Fallback if generation fails
            if not generated_message or len(generated_message) < 10:
                generated_message = "Chore: Minor project updates"
            
            return generated_message
        else:
            print(f"Ollama generation failed: {response.text}")
            return "Chore: Minor updates across project"
    
    except Exception as e:
        print(f"Error generating commit message: {e}")
        return "Chore: Minor updates across project"
    finally:
        # Always stop the Ollama service after use
        stop_ollama_service()

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

def git_commit_and_push(commit_message):
    """
    Commit changes and immediately push to the current branch.
    
    Args:
        commit_message (str): Commit message to use
    
    Returns:
        Tuple[bool, str]: (Success status, Output message)
    """
    try:
        # Stage all changes
        subprocess.run(['git', 'add', '.'], 
                       cwd='/Users/T/Documents/GitHub/metalcraft2', 
                       check=True)
        
        # Commit changes
        commit_result = subprocess.run(
            ['git', 'commit', '-m', commit_message], 
            cwd='/Users/T/Documents/GitHub/metalcraft2', 
            capture_output=True, 
            text=True,
            check=True
        )
        
        # Get current branch
        branch_result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'], 
            cwd='/Users/T/Documents/GitHub/metalcraft2', 
            capture_output=True, 
            text=True,
            check=True
        )
        current_branch = branch_result.stdout.strip()
        
        # Push to current branch
        push_result = subprocess.run(
            ['git', 'push', 'origin', current_branch], 
            cwd='/Users/T/Documents/GitHub/metalcraft2', 
            capture_output=True, 
            text=True,
            check=True
        )
        
        return True, f"Committed and pushed to {current_branch}"
    
    except subprocess.CalledProcessError as e:
        error_message = e.stderr.strip() if e.stderr else str(e)
        return False, f"Git operation failed: {error_message}"

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

def git_revert_all_changes():
    """
    Completely revert all uncommitted changes in the repository.
    
    Returns:
        bool: True if revert was successful, False otherwise
    """
    try:
        # Revert unstaged changes
        subprocess.run(['git', 'checkout', '--', '.'], 
                       cwd='/Users/T/Documents/GitHub/metalcraft2', 
                       check=True)
        
        # Remove untracked files and directories
        subprocess.run(['git', 'clean', '-fd'], 
                       cwd='/Users/T/Documents/GitHub/metalcraft2', 
                       check=True)
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error reverting changes: {e}")
        return False

def create_commit_ui(commit_message, changes):
    """
    Create a UI for commit confirmation with detailed change preview and refresh option

    Args:
        commit_message (str): Generated commit message
        changes (Dict): Detailed changes dictionary

    Returns:
        str: User's action ('commit', 'push', 'edit', 'cancel', 'revert')
    """
    def on_commit():
        root.destroy()
        return_value.set('commit')

    def on_push():
        root.destroy()
        return_value.set('push')

    def on_edit():
        edited_message = simpledialog.askstring(
            "Edit Commit Message", 
            "Edit your commit message:", 
            initialvalue=commit_message
        )
        if edited_message:
            commit_message_var.set(edited_message)

    def on_refresh():
        # Rerun the diff and message generation
        nonlocal commit_message, changes
        diff = get_git_diff()
        changes = analyze_changes(diff)
        new_commit_message = generate_commit_message(changes)
        commit_message_var.set(new_commit_message)
        update_changes_display()

    def update_changes_display():
        # Clear previous changes
        for widget in changes_frame.winfo_children():
            widget.destroy()

        # Display modified files
        for change_type in ['added', 'modified', 'deleted']:
            files = changes.get(change_type, [])
            if files:
                tk.Label(
                    changes_frame, 
                    text=f"{change_type.capitalize()} Files:", 
                    font=('Arial', 10, 'bold')
                ).pack(anchor='w')
                
                for file, file_changes in files[:5]:  # Limit to first 5 files
                    file_label = tk.Label(
                        changes_frame, 
                        text=file, 
                        font=('Arial', 9)
                    )
                    file_label.pack(anchor='w')
                    
                    # Show first 3 changes for each file
                    for change in file_changes[:3]:
                        change_label = tk.Label(
                            changes_frame, 
                            text=f"  - {change}", 
                            font=('Arial', 8), 
                            wraplength=500, 
                            justify='left'
                        )
                        change_label.pack(anchor='w')

    # Create main window
    root = tk.Tk()
    root.title("Git Commit")
    root.geometry("600x700")

    # Return value tracking
    return_value = tk.StringVar()

    # Commit message variable
    commit_message_var = tk.StringVar(value=commit_message)

    # Commit message display
    tk.Label(root, text="Commit Message:", font=('Arial', 10, 'bold')).pack(anchor='w')
    message_text = tk.Text(root, height=6, width=70, wrap=tk.WORD)
    message_text.insert(tk.END, commit_message)
    message_text.pack(padx=10, pady=5)

    # Changes frame
    tk.Label(root, text="Changes:", font=('Arial', 10, 'bold')).pack(anchor='w')
    changes_frame = tk.Frame(root)
    changes_frame.pack(padx=10, fill='x', expand=True)

    # Initial changes display
    update_changes_display()

    # Buttons frame
    button_frame = tk.Frame(root)
    button_frame.pack(pady=10)

    # Action buttons
    tk.Button(button_frame, text="Commit", command=on_commit).pack(side='left', padx=5)
    tk.Button(button_frame, text="Push", command=on_push).pack(side='left', padx=5)
    tk.Button(button_frame, text="Edit Message", command=on_edit).pack(side='left', padx=5)
    tk.Button(button_frame, text="Refresh", command=on_refresh).pack(side='left', padx=5)
    tk.Button(button_frame, text="Cancel", command=root.destroy).pack(side='left', padx=5)

    # Wait for user action
    root.wait_variable(return_value)

    return return_value.get()

def main():
    """
    Main script to handle git commit and push workflow.
    Provides UI interaction and confirmation before committing.
    """
    # Retrieve and analyze git changes
    git_diff_content = get_git_diff()
    changes = analyze_changes(git_diff_content)
    
    # Generate commit message using Ollama
    commit_message = generate_commit_message_with_ollama(git_diff_content, git_diff_content)
    
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
    
    elif user_action == 'push':
        # Commit and push
        commit_push_result = git_commit_and_push(commit_message)
        if commit_push_result[0]:
            messagebox.showinfo("Success", commit_push_result[1])
        else:
            messagebox.showerror("Error", commit_push_result[1])
    
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
                push_again_response = messagebox.askyesno(
                    "Push Later", 
                    "Do you want to push these changes later?"
                )
                
                if push_again_response:
                    messagebox.showinfo("Local Commit", "Changes committed locally. Push later.")
                else:
                    messagebox.showinfo("Local Commit", "Changes committed locally. Not pushed to remote.")
    
    elif user_action == 'revert':
        pass  # Revert action handled in UI
    
    else:
        messagebox.showinfo("Cancelled", "Git commit was cancelled.")

if __name__ == '__main__':
    main()
