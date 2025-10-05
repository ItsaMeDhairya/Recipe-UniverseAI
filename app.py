from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import uuid

# Import all necessary functions from the other Python modules
from recipe_manager import (
    user_required,
    get_user_data,
    add_recipe_to_cookbook,
    remove_recipe_from_cookbook,
    update_pantry,
    update_meal_plan,
    update_user_preferences
)

from google_api_service import (
    generate_recipe_from_api,
    search_web_for_recipes,
    get_recipe_image_url,
    get_pairings_from_api,
    get_modified_recipe_from_api,
    get_ingredient_swaps_from_api
)

# --- APP SETUP ---
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app) # Enable Cross-Origin Resource Sharing for development

# --- FRONTEND ROUTE ---
@app.route('/')
def index():
    """Serves the main index.html file which is the entry point for the frontend."""
    return render_template('index.html')

# --- API ROUTES ---

# User Data Routes
@app.route('/api/user', methods=['GET'])
@user_required
def get_user_profile(user_id, user_data):
    """Gets all data (cookbook, pantry, etc.) for the current user."""
    return jsonify(user_data)

@app.route('/api/preferences', methods=['POST'])
@user_required
def update_preferences_route(user_id, user_data):
    """Updates user preferences like dark/light mode."""
    preferences = request.json
    if update_user_preferences(user_id, preferences):
        return jsonify({"success": True, "message": "Preferences updated."})
    return jsonify({"error": "Failed to update preferences"}), 500

# Cookbook Routes
@app.route('/api/cookbook', methods=['POST'])
@user_required
def add_recipe_route(user_id, user_data):
    """Adds a recipe to the user's cookbook."""
    recipe_data = request.json
    saved_recipe = add_recipe_to_cookbook(user_id, recipe_data)
    if saved_recipe:
        return jsonify(saved_recipe), 201
    return jsonify({"error": "Failed to save recipe"}), 500

@app.route('/api/cookbook/<recipe_id>', methods=['DELETE'])
@user_required
def delete_recipe_route(user_id, user_data, recipe_id):
    """Deletes a recipe from the user's cookbook."""
    if remove_recipe_from_cookbook(user_id, recipe_id):
        return jsonify({"success": True, "message": "Recipe deleted."})
    return jsonify({"error": "Recipe not found or failed to delete"}), 404

# Pantry Route
@app.route('/api/pantry', methods=['POST'])
@user_required
def update_pantry_route(user_id, user_data):
    """Updates the user's pantry list."""
    pantry_items = request.json.get('pantry')
    if pantry_items is None:
        return jsonify({"error": "Invalid data format"}), 400
    if update_pantry(user_id, pantry_items):
        return jsonify({"success": True, "message": "Pantry updated."})
    return jsonify({"error": "Failed to update pantry"}), 500

# Meal Plan Route
@app.route('/api/planner', methods=['POST'])
@user_required
def update_planner_route(user_id, user_data):
    """Updates the user's meal plan."""
    meal_plan = request.json
    if update_meal_plan(user_id, meal_plan):
        return jsonify({"success": True, "message": "Meal plan updated."})
    return jsonify({"error": "Failed to update meal plan"}), 500

# Gemini AI Routes
@app.route('/api/generate', methods=['POST'])
def generate_recipe():
    """Generates a recipe from ingredients using the AI."""
    data = request.json
    recipe = generate_recipe_from_api(
        data.get('ingredients'), data.get('cuisine'), data.get('diet')
    )
    if recipe:
        return jsonify(recipe)
    return jsonify({"error": "Failed to generate recipe from AI"}), 500

@app.route('/api/modify', methods=['POST'])
def modify_recipe():
    """Modifies an existing recipe using the AI."""
    data = request.json
    modified_recipe = get_modified_recipe_from_api(
        data.get('recipe'), data.get('mod_type')
    )
    if modified_recipe:
        return jsonify(modified_recipe)
    return jsonify({"error": "Failed to modify recipe with AI"}), 500
    
@app.route('/api/pairings', methods=['POST'])
def get_pairings():
    """Gets beverage pairings for a recipe from the AI."""
    recipe_data = request.json
    pairings = get_pairings_from_api(recipe_data)
    if pairings:
        return jsonify(pairings)
    return jsonify({"error": "Failed to get pairings from AI"}), 500

@app.route('/api/swaps', methods=['POST'])
def get_swaps():
    """Gets ingredient swaps for a recipe from the AI."""
    data = request.json
    swaps = get_ingredient_swaps_from_api(
        data.get('recipe'), data.get('ingredient')
    )
    if swaps is not None:
        return jsonify(swaps)
    return jsonify({"error": "Failed to get ingredient swaps from AI"}), 500
    
@app.route('/api/image', methods=['POST'])
def get_image():
    """Gets an image URL for a recipe name using the Search API."""
    query = request.json.get('query')
    image_url = get_recipe_image_url(query)
    if image_url:
        return jsonify({"imageUrl": image_url})
    return jsonify({"error": "Failed to find an image"}), 500

@app.route('/api/search', methods=['POST'])
def search_recipes():
    """Searches the web for recipes."""
    query = request.json.get('query')
    results = search_web_for_recipes(query)
    return jsonify(results)

# --- RUN THE APP ---
if __name__ == '__main__':
    # Setting debug=True is useful for development as it provides detailed error pages
    # and automatically reloads the server when you make changes.
    app.run(debug=True)

