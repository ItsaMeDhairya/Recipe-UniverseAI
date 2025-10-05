AI Recipe Universe - Python Edition

Welcome to the AI Recipe Universe, a powerful command-line recipe assistant built entirely in Python and powered by Google APIs.

This application allows you to generate new recipes, modify them with AI, find ingredient swaps, get beverage pairings, search the web for inspiration, and save everything to a local digital cookbook.
Features

    AI Recipe Generation: Creates unique recipes from ingredients you have.

    Calorie Estimation: Automatically estimates the calorie count for generated recipes.

    AI Recipe Tools:

        Transformations: Modify any recipe to be healthier, spicier, vegetarian, or gourmet.

        Ingredient Swaps: Get AI-powered suggestions for ingredient substitutions.

        Beverage Pairings: Find the perfect wine, beer, or non-alcoholic drink for your meal.

    Local Cookbook: Save, view, search, and sort your favorite recipes. All data is stored locally in recipe_book.json.

    Web & Image Search: Search the web for recipes and images using the Google Custom Search API.

Setup Instructions

Follow these steps carefully to get the application running.
Step 1: Prerequisites

    Python 3.7 or newer.

    pip (Python's package installer).

Step 2: Install Required Libraries

Open your terminal or command prompt and run the following command to install the necessary Python packages:

pip install -r requirements.txt


Step 3: Get Your Google API Key & Search Engine IDs

This project runs entirely on Google APIs. You need to set up a single Google Cloud project to get the keys.

    Create a Google Cloud Project:

        Go to the Google Cloud Console.

        Create a new project (e.g., "AI-Recipe-Project").

    Enable APIs:

        In your new project, go to the "APIs & Services" > "Library".

        Find and enable the following two APIs:

            Vertex AI API (this is for the Gemini model)

            Custom Search API

    Create an API Key:

        Go to "APIs & Services" > "Credentials".

        Click "+ CREATE CREDENTIALS" and select "API key".

        Copy your newly created API key. Keep this key private.

    Create Two Programmable Search Engines:

        Go to the Programmable Search Engine control panel.

        Create the first engine for Web Search:

            Click "Add".

            Name it something like "RecipeWebSearch".

            Enable the option to "Search the entire web".

            After creation, go to its "Control Panel" > "Basics" and copy the Search engine ID.

        Create the second engine for Image Search:

            Click "Add" again.

            Name it something like "RecipeImageSearch".

            Enable "Image search" and "Search the entire web".

            After creation, go to its "Control Panel" > "Basics" and copy this Search engine ID as well.

Step 4: Configure the Application

Create a new file named config.py in the same directory as the other project files. Copy and paste the following content into it, filling in the keys you obtained in the previous step.

# config.py
# Paste your secret keys and IDs here.

# Your main Google Cloud API Key
GOOGLE_API_KEY = "PASTE_YOUR_GOOGLE_API_KEY_HERE"

# The ID for your web search engine
CUSTOM_SEARCH_ENGINE_ID_WEB = "PASTE_YOUR_WEB_SEARCH_ENGINE_ID_HERE"

# The ID for your image search engine
CUSTOM_SEARCH_ENGINE_ID_IMAGE = "PASTE_YOUR_IMAGE_SEARCH_ENGINE_ID_HERE"


Step 5: Run the Application

You're all set! Open your terminal in the project directory and run the main script:

python main.py


Follow the on-screen prompts to navigate the application. Enjoy your AI-powered culinary adventure!
Uploading to GitHub (Important Security Note)

If you plan to upload this project to a public GitHub repository, you MUST prevent your secret API keys from being published. The config.py file should NEVER be committed to Git.

This project includes a .gitignore file that is pre-configured to ignore config.py and other common Python files. Ensure this file is present before you create your first commit.


AI Recipe Universe - The Ultimate Edition

Welcome to the definitive version of the AI Recipe Universe, a full-stack web application designed to be your all-in-one AI cooking assistant. This application is a graphical marvel, packed with intelligent features to elevate your culinary experience.
✨ Masterpiece Features ✨

    Stunning, Modern UI: A complete visual redesign featuring a persistent sidebar, smooth animations, custom icons, and a dynamic, responsive layout that works beautifully on any device.

    AI-Powered Meal Planner: Plan your meals for the week with an interactive calendar. Drag and drop recipes from your cookbook or generate new ones on the fly to fill slots.

    Automated Shopping List: Automatically generates a categorized and collated shopping list from your weekly meal plan. Check off items as you shop.

    Smart Pantry Tracker: Keep a digital inventory of ingredients you own. The AI can then prioritize recipes that use what you already have, reducing food waste.

    "Analyze My Recipe" Tool: Paste any recipe text from a website or book. The AI will intelligently parse it, estimate its nutritional information, and allow you to save it to your cookbook or ask for modifications.

    Interactive Cook Mode: View recipes step-by-step with integrated timers and voice-guided instructions powered by your browser's text-to-speech engine.

    Personalization: The app saves your preferences (like default diet or theme) and creates a unique user profile in your browser's local storage to keep your data separate.

    Print & Share: Generate clean, print-friendly versions of any recipe.

📁 Project Structure

This is a full-stack Flask application. The files are organized as follows:

AI_Recipe_Universe/
│
├── .gitignore              # Ignores config.py and other local files
├── README.md               # This instruction file
├── config.py               # Your secret API keys
├── google_api_service.py   # Handles all Google API communications
├── recipe_manager.py       # Manages all data (recipes, pantry, meal plan)
├── requirements.txt        # Lists Python dependencies
├── app.py                  # The main Flask web server
│
├── static/
│   ├── style.css           # All CSS styling for the application
│   └── app.js              # The core frontend JavaScript logic (SPA)
│
└── templates/
    └── index.html          # The main HTML shell for the application

🚀 How to Run (Detailed Guide)
Step 1: Set Up Your Environment

    Install Python: Ensure you have Python 3.8 or newer installed.

    Install Dependencies: Open your terminal in the project folder and run:

    pip install -r requirements.txt

Step 2: Configure Your API Keys

    Get Your Keys: This project requires two keys: one from Google AI Studio (for Gemini) and one from a Google Cloud Project (for Search). Follow the detailed instructions from our previous conversation to acquire them if you haven't already.

    Create config.py: Create a file named config.py in the main project folder.

    Paste Your Keys: Add your keys to the config.py file like this:

    # config.py
    GEMINI_API_KEY = "PASTE_YOUR_AI_STUDIO_KEY_HERE"
    GOOGLE_API_KEY = "PASTE_YOUR_GOOGLE_CLOUD_KEY_HERE"
    CUSTOM_SEARCH_ENGINE_ID_WEB = "PASTE_YOUR_WEB_SEARCH_ID_HERE"
    CUSTOM_SEARCH_ENGINE_ID_IMAGE = "PASTE_YOUR_IMAGE_SEARCH_ID_HERE"

Step 3: Run the Web Server

    Start the Application: In your terminal, from the project's root directory, run the app.py file.

    flask run

    Alternatively, you can run python app.py.

    Open in Browser: Open your favorite web browser and navigate to the address shown in the terminal, which is usually:
    http://127.0.0.1:5000

You are now running the AI Recipe Universe! Explore all the new features and enjoy your masterpiece application.