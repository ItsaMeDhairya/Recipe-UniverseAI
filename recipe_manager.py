import json
import os
import uuid
from functools import wraps
from flask import request, jsonify

# --- CONSTANTS ---
DATA_FILE = 'app_data.json'
DEFAULT_USER_DATA = {
    "cookbook": [],
    "pantry": ["Salt", "Black Pepper", "Olive Oil", "Garlic", "Onion"],
    "meal_plan": {
        "Monday": {"breakfast": None, "lunch": None, "dinner": None},
        "Tuesday": {"breakfast": None, "lunch": None, "dinner": None},
        "Wednesday": {"breakfast": None, "lunch": None, "dinner": None},
        "Thursday": {"breakfast": None, "lunch": None, "dinner": None},
        "Friday": {"breakfast": None, "lunch": None, "dinner": None},
        "Saturday": {"breakfast": None, "lunch": None, "dinner": None},
        "Sunday": {"breakfast": None, "lunch": None, "dinner": None}
    },
    "preferences": {
        "theme": "light",
        "default_diet": "None"
    }
}

# --- DATA HANDLING FUNCTIONS ---

def load_data():
    """
    Loads all application data from the JSON file.
    Creates the file with a default structure if it doesn't exist.
    """
    if not os.path.exists(DATA_FILE):
        print(f"Data file '{DATA_FILE}' not found. Creating a new one.")
        try:
            with open(DATA_FILE, 'w') as f:
                json.dump({}, f, indent=4)
            return {}
        except IOError as e:
            print(f"CRITICAL ERROR: Could not create data file '{DATA_FILE}': {e}")
            return None # Indicate a critical failure

    try:
        with open(DATA_FILE, 'r') as f:
            # Handle empty file case
            content = f.read()
            if not content:
                return {}
            return json.loads(content)
    except (json.JSONDecodeError, IOError) as e:
        print(f"ERROR: Could not read or parse data file '{DATA_FILE}': {e}")
        # In a real app, you might want to create a backup or handle this differently
        return None # Indicate a critical failure

def save_data(data):
    """Saves all application data to the JSON file."""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        return True
    except IOError as e:
        print(f"ERROR: Could not save data to '{DATA_FILE}': {e}")
        return False

# --- USER-SPECIFIC FUNCTIONS ---

def get_user_data(user_id):
    """
    Retrieves data for a specific user. If the user doesn't exist,
    they are created with a default profile.
    """
    all_data = load_data()
    if all_data is None: # Handle critical load failure
        return None

    if user_id not in all_data:
        print(f"New user '{user_id}' detected. Creating default profile.")
        all_data[user_id] = DEFAULT_USER_DATA
        if not save_data(all_data):
             return None # Handle critical save failure
    
    return all_data.get(user_id)

# --- DECORATOR for routes requiring a user ID ---
def user_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({"error": "User ID is missing from request headers"}), 400
        
        user_data = get_user_data(user_id)
        if user_data is None:
            return jsonify({"error": "A critical server error occurred while accessing user data."}), 500

        # Pass user_id and user_data to the decorated function
        return f(user_id=user_id, user_data=user_data, *args, **kwargs)
    return decorated_function


# --- DATA MANIPULATION FUNCTIONS (COOKBOOK, PANTRY, etc.) ---

def add_recipe_to_cookbook(user_id, recipe):
    """Adds a new recipe to a user's cookbook."""
    all_data = load_data()
    if all_data is None: return None

    # Generate a unique ID for the recipe
    recipe['id'] = str(uuid.uuid4())
    
    # Ensure user_data exists before modifying
    if user_id not in all_data:
        all_data[user_id] = DEFAULT_USER_DATA
        
    all_data[user_id]['cookbook'].append(recipe)

    if save_data(all_data):
        return recipe # Return the recipe with its new ID
    return None

def remove_recipe_from_cookbook(user_id, recipe_id):
    """Removes a recipe from a user's cookbook by its ID."""
    all_data = load_data()
    if all_data is None or user_id not in all_data: return False

    initial_count = len(all_data[user_id]['cookbook'])
    all_data[user_id]['cookbook'] = [r for r in all_data[user_id]['cookbook'] if r.get('id') != recipe_id]
    
    # Check if a recipe was actually removed
    if len(all_data[user_id]['cookbook']) < initial_count:
        return save_data(all_data)
    return False # Recipe ID was not found

def update_pantry(user_id, pantry_items):
    """Updates a user's pantry list."""
    all_data = load_data()
    if all_data is None: return False

    if user_id not in all_data:
        all_data[user_id] = DEFAULT_USER_DATA

    all_data[user_id]['pantry'] = pantry_items
    return save_data(all_data)

def update_meal_plan(user_id, meal_plan):
    """Updates a user's meal plan."""
    all_data = load_data()
    if all_data is None: return False

    if user_id not in all_data:
        all_data[user_id] = DEFAULT_USER_DATA
        
    all_data[user_id]['meal_plan'] = meal_plan
    return save_data(all_data)

def update_user_preferences(user_id, preferences):
    """Updates a user's preferences."""
    all_data = load_data()
    if all_data is None: return False

    if user_id not in all_data:
        all_data[user_id] = DEFAULT_USER_DATA

    all_data[user_id]['preferences'].update(preferences)
    return save_data(all_data)

