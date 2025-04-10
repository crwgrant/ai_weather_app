# AI Weather App

This is a simple FastAPI web application that provides current weather information for a given US zip code using the OpenWeatherMap API.

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

Once the server is running, you can access the weather endpoint using a web browser or a tool like `curl`:

```bash
curl http://127.0.0.1:8000/weather/{zip_code}
```

Replace `{zip_code}` with a valid US zip code (e.g., `90210`).

**Example:**

```bash
curl http://127.0.0.1:8000/weather/94043
```

This will return a JSON response with the current weather details for the specified zip code, including temperature (in Fahrenheit), weather conditions, humidity, wind speed, and coordinates.

**Example Response:**

```json
{
    "city": "Mountain View",
    "weather": "Clear",
    "description": "clear sky",
    "temperature": 65.71,
    "feels_like": 64.81,
    "humidity": 60,
    "wind_speed": 5.75,
    "latitude": 37.3861,
    "longitude": -122.0839
}
```

If an invalid zip code is provided or another error occurs, an appropriate JSON error message will be returned. 