# AI Practice Project

This is a practice project for learning how to build projects with AI. It took me about an hour to build this app using Cursor and the `gemini-2.5-pro-exp-03-25` model in agent mode.

# Weather App

This is a simple FastAPI web application that provides current weather information for a given US zip code using the OpenWeatherMap API. It displays the latest weather data and allows users to optionally save results to their browser's Local Storage. Saved historical data for the queried zip code is displayed, and users can delete individual history entries stored in their browser.

## Setup

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd ai-weather-app
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python3 -m venv venv
    ```
    Activate:
    *   macOS/Linux: `source venv/bin/activate`
    *   Windows CMD: `venv\Scripts\activate.bat`
    *   Windows PowerShell: `.\venv\Scripts\Activate.ps1`
    *   Windows Git Bash: `source venv/Scripts/activate`

3.  **Install dependencies (with the virtual environment active):**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure OpenWeatherMap API Key:**
    -   Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/appid).
    -   Create a file named `.env` in the root directory.
    -   Add your API key to the `.env` file:
        ```dotenv
        OPENWEATHERMAP_API_KEY=your_actual_api_key_here
        ```
        **Important:** The `.gitignore` file is configured to ignore `.env`.

## Running the Application

Make sure your virtual environment is active.

```bash
uvicorn main:app --reload
```

This will start the server, typically at `http://127.0.0.1:8000`.

## Usage

Once the server is running, navigate to `http://127.0.0.1:8000/` in your web browser.

Enter a valid US zip code and click "Get Weather".

*   The latest weather data for the zip code will be fetched from OpenWeatherMap and displayed.
*   **Optional:** A "Save to Browser History" button appears. Clicking this saves the current weather data to your browser's Local Storage. The history table updates dynamically.
*   Previously saved historical data for the *same zip code* (from Local Storage) is displayed below the latest results.
*   Each row in the historical data table has a "Delete" button to remove that specific entry from Local Storage.

**Note:** Weather history is stored only in your browser and is not shared or persisted elsewhere. Clearing your browser's storage will remove the history.

You can also access the raw weather data API endpoint directly:

```bash
curl http://127.0.0.1:8000/weather/{zip_code}
```

**Example API Response:**

The API now only returns the latest fetched data:

```json
{
  "latest": {
    "city": "Mountain View",
    "weather": "Clear",
    // ... other fields ...
  }
}
``` 