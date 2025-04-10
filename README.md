# AI Practice Project

This is a practice project for learning how to build projects with AI. It took me about an hour to build this app using Cursor and the `gemini-2.5-pro-exp-03-25` model in agent mode.

# AI Weather App

This is a simple FastAPI web application that provides current weather information for a given US zip code using the OpenWeatherMap API. It displays the latest weather data along with any previously saved historical data for that zip code from a local SQLite database. Users have the option to save the current weather results to the history and can delete individual history entries.

## Setup

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd ai-weather-app
    ```

2.  **Create and activate a virtual environment:**
    It's recommended to use a virtual environment to manage dependencies.
    ```bash
    python3 -m venv venv
    ```
    Activate the virtual environment. The command depends on your operating system and shell:
    *   **macOS/Linux (bash/zsh):**
        ```bash
        source venv/bin/activate
        ```
    *   **Windows (Command Prompt):**
        ```cmd
        venv\Scripts\activate.bat
        ```
    *   **Windows (PowerShell):**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
        (If you encounter execution policy issues on Windows, you might need to run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell as an administrator first.)
    *   **Windows (Git Bash):**
        ```bash
        source venv/Scripts/activate
        ```
    You should see `(venv)` prepended to your command prompt after successful activation.

3.  **Install dependencies (with the virtual environment active):**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure OpenWeatherMap API Key and Database URL:**
    -   Sign up for a free API key at [OpenWeatherMap](https://openweathermap.org/appid).
    -   Create a file named `.env` in the root directory of the project (if it doesn't exist).
    -   Add your API key and the database URL to the `.env` file:
        ```dotenv
        OPENWEATHERMAP_API_KEY=your_actual_api_key_here
        DATABASE_URL="file:./dev.db"
        ```
        Replace `your_actual_api_key_here` with the API key you obtained.
        **Important:** The `.gitignore` file is configured to ignore `.env` and `dev.db*` files.

5.  **Setup Database (with the virtual environment active):**
    Run the following Prisma commands to generate the client and create/update the database schema:
    ```bash
    prisma generate
    prisma db push
    ```
    This will create a `dev.db` SQLite file in your project root and set up the necessary tables.

## Running the Application

Make sure your virtual environment is active.

To start the FastAPI application, run the following command in your terminal:

```bash
python main.py
```

Alternatively, you can use `uvicorn` directly:

```bash
uvicorn main:app --reload
```

This will start the server, typically at `http://127.0.0.1:8000`. The `--reload` flag enables auto-reloading when code changes are detected, which is useful for development.

## Usage

Once the server is running, navigate to `http://127.0.0.1:8000/` in your web browser.

Enter a valid US zip code into the input field and click "Get Weather".

*   The latest weather data for the zip code will be fetched from OpenWeatherMap and displayed.
*   **Optional:** A "Save to History" button appears below the latest weather data. Clicking this button will save the currently displayed weather data to the local SQLite database (`dev.db`). The history table will update dynamically to include the new entry.
*   Previously saved historical data for the *same zip code* will be displayed in a second table below the latest results.
*   Each row in the historical data table has a "Delete" button that allows you to remove that specific entry from the database after confirmation.

You can also access the raw weather data API endpoint directly using a tool like `curl`:

```bash
curl http://127.0.0.1:8000/weather/{zip_code}
```

Replace `{zip_code}` with a valid US zip code (e.g., `90210`).

**Example API Response:**

When using the `/weather/{zip_code}` endpoint directly, the response includes both the latest data and the history:

```json
{
  "latest": {
    "city": "Mountain View",
    "weather": "Clear",
    "description": "clear sky",
    "temperature": 65.71,
    "feels_like": 64.81,
    "humidity": 60,
    "wind_speed": 5.75,
    "latitude": 37.3861,
    "longitude": -122.0839
  },
  "history": [
    {
      "id": 1,
      "createdAt": "2023-10-27T10:00:00.000Z",
      "zipCode": "94043",
      "city": "Mountain View",
      // ... other fields ...
    },
    // ... more history records ...
  ]
}
```

If an invalid zip code is provided or another error occurs, an appropriate JSON error message will be returned by the API endpoint. 