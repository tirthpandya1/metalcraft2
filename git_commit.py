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
import threading
import queue
import tkinter.ttk as ttk

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
    """Retrieve the git diff of both staged and unstaged changes."""
    try:
        # Capture staged changes
        staged_result = subprocess.run(
            ['git', 'diff', '--cached'], 
            capture_output=True, 
            text=True, 
            cwd='/Users/T/Documents/GitHub/metalcraft2'
        )
        
        # Capture unstaged changes
        unstaged_result = subprocess.run(
            ['git', 'diff'], 
            capture_output=True, 
            text=True, 
            cwd='/Users/T/Documents/GitHub/metalcraft2'
        )
        
        # Combine staged and unstaged changes
        full_diff = staged_result.stdout + "\n" + unstaged_result.stdout
        
        # Print debug information
        print(f"[DEBUG] Staged Changes Length: {len(staged_result.stdout)}")
        print(f"[DEBUG] Unstaged Changes Length: {len(unstaged_result.stdout)}")
        print(f"[DEBUG] Total Diff Length: {len(full_diff)}")
        
        return full_diff
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
    Generate a concise commit message using Ollama's Llama3.1 model.
    
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
        prompt = f"""Generate ONLY a git commit message for these changes. 
Do NOT include any explanation, context, or additional text. 
Commit message must be a single line under 50 words:

Summary: {changes_summary}

Diff: {full_diff[:500]}

Message:"""

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
            
            # Remove any leading text before the actual message
            generated_message = re.sub(r'^.*?:\s*', '', generated_message, flags=re.IGNORECASE).strip()
            
            # Fallback if generation fails
            if not generated_message or len(generated_message) < 10:
                generated_message = "Chore: Minor project updates"
            
            # Truncate to 500 characters
            generated_message = generated_message[:500]
            
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

def generate_commit_message_with_ollama_async(changes_summary: str, full_diff: str, result_queue: queue.Queue):
    """
    Asynchronous version of commit message generation.
    
    Args:
        changes_summary (str): A summary of the changes detected in the repository
        full_diff (str): Complete git diff with detailed changes
        result_queue (queue.Queue): Queue to store the generated message
    """
    try:
        # Ensure Ollama service is running
        if not start_ollama_service():
            result_queue.put("Chore: Minor updates across project")
            return
        
        try:
            # Prepare the prompt for commit message generation
            prompt = f"""Generate ONLY a git commit message for these changes. 
Do NOT include any explanation, context, or additional text. 
Commit message must be a single line under 50 words:

Summary: {changes_summary}

Diff: {full_diff[:500]}

Message:"""

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
                
                # Remove any leading text before the actual message
                generated_message = re.sub(r'^.*?:\s*', '', generated_message, flags=re.IGNORECASE).strip()
                
                # Fallback if generation fails
                if not generated_message or len(generated_message) < 10:
                    generated_message = "Chore: Minor project updates"
                
                # Truncate to 500 characters
                generated_message = generated_message[:500]
                
                result_queue.put(generated_message)
            else:
                print(f"Ollama generation failed: {response.text}")
                result_queue.put("Chore: Minor updates across project")
        
        except Exception as e:
            print(f"Error generating commit message: {e}")
            result_queue.put("Chore: Minor project updates")
        finally:
            # Always stop the Ollama service after use
            stop_ollama_service()
    
    except Exception as e:
        print(f"Critical error in async message generation: {e}")
        result_queue.put("Chore: Minor project updates")

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

def import_tkinter():
    """
    Attempt to import Tkinter with multiple fallback strategies
    """
    try:
        import tkinter as tk
        from tkinter import simpledialog, messagebox, ttk
        return tk, simpledialog, messagebox, ttk
    except ImportError:
        # Try alternative import methods
        try:
            import Tkinter as tk
            from Tkinter import simpledialog, messagebox, Tkinter as ttk
            return tk, simpledialog, messagebox, ttk
        except ImportError:
            # Last resort: try system-specific import
            try:
                if sys.platform == 'darwin':  # macOS
                    import _tkinter
                    import tkinter as tk
                    from tkinter import simpledialog, messagebox, ttk
                    return tk, simpledialog, messagebox, ttk
                else:
                    raise ImportError("Tkinter import failed")
            except ImportError:
                print("Tkinter is not installed. Please install it using: pip install tk")
                sys.exit(1)

def safe_tk_init():
    """
    Safely initialize Tkinter root window with multiple fallback strategies
    """
    try:
        # Attempt standard initialization
        root = tk.Tk()
        root.withdraw()  # Hide the main window
        return root
    except tk.TclError as e:
        print(f"Tkinter initialization error: {e}")
        
        # Attempt alternative initialization strategies
        strategies = [
            lambda: tk.Tk(screenName=''),  # Empty screenName
            lambda: tk.Tk(baseName='tk'),  # Explicit base name
            lambda: tk.Tk(className='Tk'),  # Explicit class name
        ]
        
        for strategy in strategies:
            try:
                root = strategy()
                root.withdraw()
                return root
            except Exception as strategy_e:
                print(f"Strategy failed: {strategy_e}")
        
        # Final fallback: force display environment
        try:
            os.environ['DISPLAY'] = ':0'
            root = tk.Tk()
            root.withdraw()
            return root
        except Exception as final_e:
            print(f"All Tkinter initialization strategies failed: {final_e}")
            raise RuntimeError("Cannot initialize Tkinter GUI")

def show_loading_screen():
    """
    Create a loading screen UI with robust initialization
    """
    try:
        # Use safe initialization
        root = safe_tk_init()
        
        # Create loading window as Toplevel
        loading_root = tk.Toplevel(root)
        loading_root.title("Initializing Git Commit")
        loading_root.geometry("400x200")
        loading_root.configure(bg='#2C2C2C')

        # Ensure window is on top and modal
        loading_root.attributes('-topmost', True)
        loading_root.grab_set()
        loading_root.focus_force()

        # Main loading frame
        loading_frame = tk.Frame(loading_root, bg='#2C2C2C')
        loading_frame.pack(expand=True, fill='both', padx=20, pady=20)

        # Loading title
        title_label = tk.Label(
            loading_frame, 
            text="Preparing Git Commit", 
            font=('San Francisco', 14, 'bold'), 
            bg='#2C2C2C', 
            fg='#FFFFFF'
        )
        title_label.pack(pady=(0, 10))

        # Progress message
        progress_label = tk.Label(
            loading_frame, 
            text="Initializing...", 
            font=('San Francisco', 10), 
            bg='#2C2C2C', 
            fg='#CCCCCC'
        )
        progress_label.pack(pady=(0, 10))

        # Animated loading bar
        canvas = tk.Canvas(
            loading_frame, 
            width=300, 
            height=20, 
            bg='#2C2C2C', 
            highlightthickness=0
        )
        canvas.pack(pady=(0, 10))

        # Create loading animation
        bar_width = 300
        bar_height = 20
        bar_rect = canvas.create_rectangle(
            0, 0, 0, bar_height, 
            fill='#4A90E2', 
            outline=''
        )

        # Animate loading bar
        def animate_loading():
            nonlocal loading_root
            x = 0
            direction = 1
            while loading_root.winfo_exists():
                x += 10 * direction
                if x > bar_width:
                    direction = -1
                elif x < 0:
                    direction = 1
                
                canvas.coords(bar_rect, 0, 0, x, bar_height)
                time.sleep(0.05)
                loading_root.update()

        # Start loading animation in a separate thread
        loading_thread = threading.Thread(target=animate_loading, daemon=True)
        loading_thread.start()

        # Progress update method
        def update_progress(message):
            progress_label.config(text=message)
            loading_root.update()

        # Close loading screen method
        def close_loading():
            nonlocal loading_root, root
            loading_root.destroy()
            root.destroy()

        return loading_root, update_progress, close_loading

    except Exception as e:
        print(f"Critical error creating loading screen: {e}")
        raise

def create_commit_ui(commit_message, changes):
    """
    Create a UI for commit confirmation with detailed change preview and async message generation
    
    Args:
        commit_message (str): Initially generated commit message
        changes (Dict): Detailed changes dictionary
    
    Returns:
        str: User's action ('commit', 'push', 'edit', 'cancel', 'revert')
    """
    # Create main window
    root = tk.Tk()
    root.title("Git Commit")
    root.geometry("600x700")
    
    # macOS-inspired dark theme colors
    bg_dark = '#2C2C2C'
    bg_light = '#3A3A3C'
    text_color = '#FFFFFF'
    button_bg = '#4A90E2'
    button_fg = '#FFFFFF'
    
    # Configure root window
    root.configure(bg=bg_dark)
    root.option_add('*Background', bg_dark)
    root.option_add('*Foreground', text_color)
    
    # Result storage
    commit_action = [None]
    regenerating_message = [False]

    # Styling
    font_title = ('San Francisco', 14, 'bold')
    font_normal = ('San Francisco', 12)

    # Loading Animation Frame
    loading_frame = tk.Frame(root, bg=bg_dark)
    loading_frame.pack(pady=10, padx=10, fill='x')
    
    # Loading Label
    loading_label = tk.Label(
        loading_frame, 
        text="Generating Commit Message...", 
        font=font_normal, 
        bg=bg_dark, 
        fg=text_color
    )
    loading_label.pack(side=tk.LEFT, expand=True)
    
    # Loading Spinner
    loading_spinner = ttk.Progressbar(
        loading_frame, 
        mode='indeterminate', 
        length=200
    )
    loading_spinner.pack(side=tk.RIGHT)

    def start_loading():
        """Start the loading animation"""
        regenerating_message[0] = True
        loading_label.config(text="Generating Commit Message...")
        loading_spinner.start()
        loading_frame.pack(pady=10, padx=10, fill='x')

    def stop_loading(new_message=None):
        """Stop the loading animation"""
        regenerating_message[0] = False
        loading_spinner.stop()
        loading_frame.pack_forget()
        
        # Update message if provided
        if new_message:
            message_text.config(state=tk.NORMAL)
            message_text.delete('1.0', tk.END)
            message_text.insert(tk.END, new_message)
            message_text.config(state=tk.DISABLED)

    def regenerate_commit_message():
        """Regenerate commit message asynchronously"""
        # Disable regenerate button during generation
        regenerate_btn.config(state=tk.DISABLED)
        
        # Start loading animation
        start_loading()
        
        # Prepare queue for async communication
        result_queue = queue.Queue()
        
        # Get current git diff
        git_diff = get_git_diff()
        
        # Start async thread for message generation
        def message_generation_thread():
            try:
                generate_commit_message_with_ollama_async(
                    changes_summary=str(changes), 
                    full_diff=git_diff, 
                    result_queue=result_queue
                )
                
                # Get the generated message
                new_message = result_queue.get(block=False)
                
                # Update UI in main thread
                root.after(0, lambda: stop_loading(new_message))
                
                # Re-enable regenerate button
                root.after(0, lambda: regenerate_btn.config(state=tk.NORMAL))
            
            except queue.Empty:
                # Handle case where no message was generated
                root.after(0, lambda: stop_loading("Chore: Minor project updates"))
                root.after(0, lambda: regenerate_btn.config(state=tk.NORMAL))
        
        # Start the thread
        threading.Thread(target=message_generation_thread, daemon=True).start()

    # Title Frame
    title_frame = tk.Frame(root, bg=bg_dark)
    title_frame.pack(pady=10, padx=10, fill='x')
    
    title_label = tk.Label(
        title_frame, 
        text="Git Commit Workflow", 
        font=font_title, 
        bg=bg_dark, 
        fg=text_color
    )
    title_label.pack()

    # Commit Message Frame
    message_frame = tk.Frame(root, bg=bg_light, borderwidth=1, relief='solid')
    message_frame.pack(pady=10, padx=10, fill='both', expand=True)
    
    message_label_frame = tk.Frame(message_frame, bg=bg_light)
    message_label_frame.pack(fill='x', padx=5, pady=(5,0))
    
    message_label = tk.Label(
        message_label_frame, 
        text="Commit Message:", 
        font=font_title, 
        bg=bg_light, 
        fg=text_color, 
        anchor='w'
    )
    message_label.pack(side=tk.LEFT)
    
    # Regenerate button for commit message
    regenerate_btn = tk.Button(
        message_label_frame, 
        text="Regenerate", 
        command=regenerate_commit_message, 
        bg=button_bg, 
        fg=button_fg, 
        font=('San Francisco', 10), 
        relief=tk.FLAT
    )
    regenerate_btn.pack(side=tk.RIGHT)

    message_text = tk.Text(
        message_frame, 
        height=5, 
        font=font_normal, 
        wrap='word', 
        borderwidth=0,
        bg=bg_light,
        fg=text_color,
        insertbackground=text_color  # Cursor color
    )
    message_text.insert(tk.END, commit_message)
    message_text.config(state=tk.DISABLED)
    message_text.pack(fill='both', expand=True, padx=5, pady=5)

    # Changes Preview Frame
    changes_frame = tk.Frame(root, bg=bg_light, borderwidth=1, relief='solid')
    changes_frame.pack(pady=10, padx=10, fill='both', expand=True)
    
    changes_label = tk.Label(
        changes_frame, 
        text="Changes Preview:", 
        font=font_title, 
        bg=bg_light, 
        fg=text_color, 
        anchor='w'
    )
    changes_label.pack(fill='x', padx=5, pady=(5,0))
    
    changes_text = tk.Text(
        changes_frame, 
        height=10, 
        font=font_normal, 
        wrap='word', 
        borderwidth=0,
        bg=bg_light,
        fg=text_color,
        insertbackground=text_color  # Cursor color
    )
    
    # Populate initial changes text
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
    button_frame = tk.Frame(root, bg=bg_dark)
    button_frame.pack(pady=10, padx=10, fill='x')

    def on_commit():
        commit_action[0] = 'commit'
        root.quit()

    def on_push_commit():
        commit_action[0] = 'push'
        root.quit()

    def on_edit():
        # Open dialog for custom message
        custom_message = simpledialog.askstring(
            "Edit Commit Message", 
            "Enter your custom commit message:", 
            initialvalue=message_text.get('1.0', tk.END).strip()
        )
        
        if custom_message:
            # Update message text
            message_text.config(state=tk.NORMAL)
            message_text.delete('1.0', tk.END)
            message_text.insert(tk.END, custom_message)
            message_text.config(state=tk.DISABLED)

    def on_cancel():
        commit_action[0] = 'cancel'
        root.quit()

    def on_revert():
        # Show confirmation dialog
        revert_confirm = messagebox.askyesno(
            "Confirm Revert", 
            "Are you sure you want to revert ALL changes? This cannot be undone.",
            icon='warning'
        )
        
        if revert_confirm:
            # Attempt to revert changes
            revert_success = git_revert_all_changes()
            
            if revert_success:
                messagebox.showinfo(
                    "Revert Successful", 
                    "All changes have been reverted to the last committed state."
                )
                commit_action[0] = 'revert'
                root.quit()
            else:
                messagebox.showerror(
                    "Revert Failed", 
                    "Could not revert changes. Please check your git repository."
                )

    # Buttons with modern styling
    commit_btn = tk.Button(
        button_frame, 
        text="Commit", 
        command=on_commit, 
        bg='#4A90E2',  # Bright blue for primary action
        activebackground='#357ABD',  # Slightly darker blue when active
        fg='white',  # White text for contrast 
        activeforeground='white',  # Keep text white when active
        font=font_normal,
        relief=tk.RAISED,  # Raised relief for better visibility
        padx=15,  # Increased horizontal padding
        pady=8   # Increased vertical padding
    )
    commit_btn.pack(side=tk.LEFT, expand=True, padx=5)

    push_commit_btn = tk.Button(
        button_frame, 
        text="Commit & Push", 
        command=on_push_commit, 
        bg='#4A90E2',  # Bright blue for primary action
        activebackground='#357ABD',  # Slightly darker blue when active
        fg='white',  # White text for contrast
        activeforeground='white',  # Keep text white when active
        font=font_normal,
        relief=tk.RAISED,  # Raised relief for better visibility
        padx=15,  # Increased horizontal padding
        pady=8   # Increased vertical padding
    )
    push_commit_btn.pack(side=tk.LEFT, expand=True, padx=5)

    edit_btn = tk.Button(
        button_frame, 
        text="Edit Message", 
        command=on_edit, 
        bg='#4A90E2',  # Blue for secondary action
        activebackground='#357ABD',  # Slightly darker blue when active
        fg='white',  # White text for contrast
        activeforeground='white',  # Keep text white when active
        font=font_normal,
        relief=tk.RAISED,  # Raised relief for better visibility
        padx=15,  # Increased horizontal padding
        pady=8   # Increased vertical padding
    )
    edit_btn.pack(side=tk.LEFT, expand=True, padx=5)

    revert_btn = tk.Button(
        button_frame, 
        text="Revert All", 
        command=on_revert, 
        bg='#4A90E2',  # Blue for destructive action (to match other buttons)
        activebackground='#357ABD',  # Slightly darker blue when active
        fg='white',  # White text for contrast
        activeforeground='white',  # Keep text white when active
        font=font_normal,
        relief=tk.RAISED,  # Raised relief for better visibility
        padx=15,  # Increased horizontal padding
        pady=8   # Increased vertical padding
    )
    revert_btn.pack(side=tk.LEFT, expand=True, padx=5)

    cancel_btn = tk.Button(
        button_frame, 
        text="Cancel", 
        command=on_cancel, 
        bg='#4A90E2',  # Blue for neutral action
        activebackground='#357ABD',  # Slightly darker blue when active
        fg='white',  # White text for contrast
        activeforeground='white',  # Keep text white when active
        font=font_normal,
        relief=tk.RAISED,  # Raised relief for better visibility
        padx=15,  # Increased horizontal padding
        pady=8   # Increased vertical padding
    )
    cancel_btn.pack(side=tk.LEFT, expand=True, padx=5)

    # Initially hide loading frame
    loading_frame.pack_forget()

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
    # Create loading window
    root = tk.Tk()
    root.title("Git Commit Initializing...")
    root.geometry("400x200")
    
    # Dark theme colors
    bg_dark = '#2C2C2C'
    text_color = '#FFFFFF'
    
    # Configure root window
    root.configure(bg=bg_dark)
    root.option_add('*Background', bg_dark)
    root.option_add('*Foreground', text_color)
    
    # Loading Frame
    loading_frame = tk.Frame(root, bg=bg_dark)
    loading_frame.pack(expand=True, fill='both', padx=20, pady=20)
    
    # Loading Label
    loading_label = tk.Label(
        loading_frame, 
        text="Preparing Git Commit Workflow...", 
        font=('San Francisco', 12), 
        bg=bg_dark, 
        fg=text_color
    )
    loading_label.pack(pady=(10,5))
    
    # Loading Spinner
    loading_spinner = ttk.Progressbar(
        loading_frame, 
        mode='indeterminate', 
        length=300
    )
    loading_spinner.pack(pady=10)
    
    # Status Detail Label
    status_label = tk.Label(
        loading_frame, 
        text="Initializing components...", 
        font=('San Francisco', 10), 
        bg=bg_dark, 
        fg=text_color
    )
    status_label.pack(pady=(5,10))
    
    # Initialization Queue for async communication
    init_queue = queue.Queue()
    
    def async_initialization():
        """
        Perform all initialization tasks asynchronously
        """
        try:
            # Update status
            root.after(0, lambda: status_label.config(text="Checking Tkinter..."))
            
            # Ensure Tkinter is properly initialized
            try:
                tk_modules = import_tkinter()
            except Exception as e:
                init_queue.put(('error', f"Tkinter Import Failed: {e}"))
                return
            
            # Update status
            root.after(0, lambda: status_label.config(text="Starting Ollama service..."))
            
            # Start Ollama service
            ollama_started = start_ollama_service()
            if not ollama_started:
                init_queue.put(('error', "Failed to start Ollama service"))
                return
            
            # Update status
            root.after(0, lambda: status_label.config(text="Retrieving git changes..."))
            
            # Get git diff
            git_diff = get_git_diff()
            
            # Update status
            root.after(0, lambda: status_label.config(text="Analyzing changes..."))
            
            # Analyze changes
            changes = analyze_changes(git_diff)
            
            # Update status
            root.after(0, lambda: status_label.config(text="Generating commit message..."))
            
            # Generate initial commit message
            commit_message = generate_commit_message_with_ollama(str(changes), git_diff)
            
            # Put successful initialization results
            init_queue.put(('success', (commit_message, changes)))
        
        except Exception as e:
            # Catch any unexpected errors
            init_queue.put(('error', f"Initialization Error: {e}"))
    
    # Start initialization in a separate thread
    initialization_thread = threading.Thread(target=async_initialization, daemon=True)
    initialization_thread.start()
    
    # Animate loading spinner
    loading_spinner.start()
    
    def check_initialization():
        """
        Periodically check initialization status
        """
        try:
            # Check if initialization is complete
            result = init_queue.get(block=False)
            
            # Stop spinner
            loading_spinner.stop()
            
            # Close loading window
            root.destroy()
            
            # Handle different initialization results
            if result[0] == 'success':
                # Unpack successful initialization results
                commit_message, changes = result[1]
                
                # Open main commit UI
                action = create_commit_ui(commit_message, changes)
                
                # Perform action based on user selection
                if action == 'commit':
                    git_commit(commit_message)
                elif action == 'push':
                    git_commit_and_push(commit_message)
                elif action == 'edit':
                    # Reopen UI with option to edit
                    edited_message = simpledialog.askstring(
                        "Edit Commit Message", 
                        "Enter your custom commit message:", 
                        initialvalue=commit_message
                    )
                    if edited_message:
                        git_commit(edited_message)
            
            elif result[0] == 'error':
                # Show error message
                messagebox.showerror("Initialization Error", result[1])
        
        except queue.Empty:
            # If initialization is not complete, check again after a short delay
            root.after(100, check_initialization)
    
    # Start checking initialization status
    root.after(100, check_initialization)
    
    # Start the main event loop
    root.mainloop()

if __name__ == '__main__':
    main()
