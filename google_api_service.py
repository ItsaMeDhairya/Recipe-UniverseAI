# google_api_service.py
import requests
import json
from config import (
    GEMINI_API_KEY, GOOGLE_API_KEY, CUSTOM_SEARCH_ENGINE_ID_IMAGE, CUSTOM_SEARCH_ENGINE_ID_WEB
)

def search_web_for_recipes(query):
    """
    Calls the Google Custom Search API to search the web for recipes.
    """
    if not GOOGLE_API_KEY or "PASTE" in GOOGLE_API_KEY:
        print("[ERROR] Google Cloud API Key is missing from config.py")
        return {"error": "API Key Missing"}

    api_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': GOOGLE_API_KEY,
        'cx': CUSTOM_SEARCH_ENGINE_ID_WEB,
        'q': query,
        'num': 5  # Get top 5 results
    }

    try:
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        return response.json().get('items', [])

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network or API error calling Custom Search: {e}")
        return {"error": "API Error"}

def generate_recipe_from_api(ingredients, cuisine, diet):
    """
    Calls the Gemini API to generate recipe data and returns it as a dictionary.
    Includes robust error handling.
    """
    if not GEMINI_API_KEY or "PASTE" in GEMINI_API_KEY:
        print("[ERROR] Gemini API Key is missing from config.py")
        return None

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"Generate a recipe based on these details. Ingredients: {ingredients}."
    if cuisine and cuisine != 'Any':
        prompt += f" Cuisine: {cuisine}."
    if diet and diet != 'None':
        prompt += f" Dietary requirement: {diet}."
    prompt += (" Respond with ONLY a single, clean JSON object. Do not use markdown like ```json. "
               "The JSON object must have these keys: 'recipeName' (string), 'description' (string), "
               "'ingredients' (array of strings), 'instructions' (array of strings), "
               "'calorieCount' (number), and 'timeToCook' (string).")

    headers = {'Content-Type': 'application/json'}
    payload = {'contents': [{'parts': [{'text': prompt}]}]}

    print(f"[INFO] Sending prompt to Gemini API: {prompt}")

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        print(f"[INFO] Received response from Gemini API: {response.text}")
        response.raise_for_status()  # Raises an error for bad status codes (4xx or 5xx)

        # Extract and clean the text part of the response
        result_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        cleaned_text = result_text.replace('```json', '').replace('```', '').strip()
        
        return json.loads(cleaned_text)

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network or API error calling Gemini: {e}")
        return None
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        print(f"[ERROR] Could not parse JSON response from Gemini: {e}")
        print(f"--> Received text: {result_text}")
        return None


def get_recipe_image_url(query):
    """
    Calls the Google Custom Search API to find an image URL.
    Returns a placeholder if no image is found.
    """
    if not GOOGLE_API_KEY or "PASTE" in GOOGLE_API_KEY:
        print("[ERROR] Google Cloud API Key is missing from config.py")
        return "https://placehold.co/600x400/a78bfa/ffffff?text=API+Key+Missing"
    
    api_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': GOOGLE_API_KEY,
        'cx': CUSTOM_SEARCH_ENGINE_ID_IMAGE,
        'q': query,
        'searchType': 'image',
        'num': 1
    }
    
    print(f"[INFO] Sending image search query to Google Custom Search API: {query}")

    try:
        response = requests.get(api_url, params=params, timeout=10)
        print(f"[INFO] Received response from Google Custom Search API: {response.text}")
        response.raise_for_status()
        results = response.json().get('items', [])
        return results[0]['link'] if results else "https://placehold.co/600x400/707070/ffffff?text=Image+Not+Found"
        
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network or API error calling Custom Search: {e}")
        return "https://placehold.co/600x400/ef4444/ffffff?text=Image+Error"

def get_pairings_from_api(recipe):
    """
    Calls the Gemini API to get beverage pairings for a recipe.
    """
    if not GEMINI_API_KEY or "PASTE" in GEMINI_API_KEY:
        print("[ERROR] Gemini API Key is missing from config.py")
        return None

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"Generate beverage pairings for the following recipe: {recipe['recipeName']}. Respond with ONLY a single, clean JSON object with one key: 'pairings' (an array of strings)."

    headers = {'Content-Type': 'application/json'}
    payload = {'contents': [{'parts': [{'text': prompt}]}]}

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()

        result_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        cleaned_text = result_text.replace('```json', '').replace('```', '').strip()
        
        return json.loads(cleaned_text)

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network or API error calling Gemini: {e}")
        return None
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        print(f"[ERROR] Could not parse JSON response from Gemini: {e}")
        print(f"--> Received text: {result_text}")
        return None

def get_modified_recipe_from_api(recipe, mod_type):
    """
    Calls the Gemini API to modify a recipe.
    """
    if not GEMINI_API_KEY or "PASTE" in GEMINI_API_KEY:
        print("[ERROR] Gemini API Key is missing from config.py")
        return None

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"Modify the following recipe to be {mod_type}: {recipe}. Respond with ONLY a single, clean JSON object with the same structure as the original recipe."

    headers = {'Content-Type': 'application/json'}
    payload = {'contents': [{'parts': [{'text': prompt}]}]}

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()

        result_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        cleaned_text = result_text.replace('```json', '').replace('```', '').strip()
        
        return json.loads(cleaned_text)

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network or API error calling Gemini: {e}")
        return None
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        print(f"[ERROR] Could not parse JSON response from Gemini: {e}")
        print(f"--> Received text: {result_text}")
        return None

def get_ingredient_swaps_from_api(recipe, ingredient):
    """
    Calls the Gemini API to get ingredient swaps for a recipe.
    """
    if not GEMINI_API_KEY or "PASTE" in GEMINI_API_KEY:
        print("[ERROR] Gemini API Key is missing from config.py")
        return None

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"For the recipe '{recipe['recipeName']}', what are some good swaps for the ingredient '{ingredient}'? Respond with ONLY a single, clean JSON object with one key: 'swaps' (an array of strings)."

    headers = {'Content-Type': 'application/json'}
    payload = {'contents': [{'parts': [{'text': prompt}]}]}

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()

        result_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        cleaned_text = result_text.replace('```json', '').replace('```', '').strip()
        
        return json.loads(cleaned_text)

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network or API error calling Gemini: {e}")
        return None
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        print(f"[ERROR] Could not parse JSON response from Gemini: {e}")
        print(f"--> Received text: {result_text}")
        return None
