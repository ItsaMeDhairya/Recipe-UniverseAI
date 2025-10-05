# Project Overview

This project is a full-stack web application called "AI Recipe Universe". It serves as an AI-powered cooking assistant that allows users to generate, modify, and manage recipes. The application features a modern, responsive user interface with a persistent sidebar, animations, and custom icons.

## Key Technologies

*   **Backend:** Python with the Flask framework.
*   **Frontend:** HTML, CSS, and vanilla JavaScript.
*   **APIs:**
    *   **Google Gemini API:** Used for AI-powered recipe generation, modification, and other intelligent features.
    *   **Google Custom Search API:** Used to search for recipe images.
*   **Data Storage:** A local JSON file (`app_data.json`) is used to store all application data, including user profiles, cookbooks, pantry items, and meal plans.

## Architecture

The application follows a client-server architecture:

*   **Flask Backend (`app.py`):** Exposes a RESTful API to the frontend for all functionalities. It handles business logic, data manipulation, and communication with the Google APIs.
*   **Single-Page Frontend (`index.html`, `style.css`, `app.js`):** Provides the user interface and interacts with the backend API to fetch and display data.
*   **Data Manager (`recipe_manager.py`):** Encapsulates all data storage logic, reading from and writing to the `app_data.json` file.
*   **Google API Service (`google_api_service.py`):** Manages all interactions with the Google Gemini and Custom Search APIs.

# Building and Running

1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configure API Keys:**
    Create a file named `config.py` in the root directory of the project and add your Google API keys and search engine IDs as follows:

    ```python
    # config.py
    GEMINI_API_KEY = "PASTE_YOUR_AI_STUDIO_KEY_HERE"
    GOOGLE_API_KEY = "PASTE_YOUR_GOOGLE_CLOUD_KEY_HERE"
    CUSTOM_SEARCH_ENGINE_ID_WEB = "PASTE_YOUR_WEB_SEARCH_ID_HERE"
    CUSTOM_SEARCH_ENGINE_ID_IMAGE = "PASTE_YOUR_IMAGE_SEARCH_ID_HERE"
    ```

3.  **Run the Application:**
    ```bash
    flask run
    ```
    Alternatively, you can run:
    ```bash
    python app.py
    ```
    The application will be available at `http://127.0.0.1:5000`.

# Development Conventions

*   **API Routes:** All API endpoints are defined in `app.py` and prefixed with `/api`.
*   **User Identification:** The application uses a `X-User-ID` header to identify and authenticate users for all user-specific API requests.
*   **Data Persistence:** All application data is stored in a single JSON file (`app_data.json`). The `recipe_manager.py` module is responsible for all data access and manipulation.
*   **Configuration:** API keys and other sensitive information are stored in a separate `config.py` file, which is not committed to version control (and is listed in `.gitignore`).
