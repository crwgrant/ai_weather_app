import os
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Create FastAPI app instance (without lifespan)
app = FastAPI()

# Mount the static directory (still needed for script.js)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure Jinja2 templates
templates = Jinja2Templates(directory="templates")

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather"

if not OPENWEATHERMAP_API_KEY:
    print("Warning: OPENWEATHERMAP_API_KEY environment variable not set.")
    # In a real app, you might want to raise an exception or handle this differently
    # raise ValueError("OPENWEATHERMAP_API_KEY environment variable is required")


# Endpoint to serve the HTML page
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serves the main HTML page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/weather/{zip_code}")
async def get_weather_by_zip(zip_code: str):
    """
    Fetches current weather data for a given US zip code from OpenWeatherMap.
    History is handled client-side via Local Storage.
    """
    if not OPENWEATHERMAP_API_KEY:
        raise HTTPException(
            status_code=500, detail="Server configuration error: API key not set."
        )

    params = {
        "zip": f"{zip_code},us",
        "appid": OPENWEATHERMAP_API_KEY,
        "units": "imperial",
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OPENWEATHERMAP_URL, params=params)
            response.raise_for_status()
            weather_data = response.json()

            simplified_data = {
                "city": weather_data.get("name"),
                "weather": weather_data.get("weather", [{}])[0].get("main"),
                "description": weather_data.get("weather", [{}])[0].get("description"),
                "temperature": weather_data.get("main", {}).get("temp"),
                "feels_like": weather_data.get("main", {}).get("feels_like"),
                "humidity": weather_data.get("main", {}).get("humidity"),
                "wind_speed": weather_data.get("wind", {}).get("speed"),
                "latitude": weather_data.get("coord", {}).get("lat"),
                "longitude": weather_data.get("coord", {}).get("lon"),
            }

            # Only return the latest data fetched from the API
            return {"latest": simplified_data}

        except httpx.HTTPStatusError as exc:
            # Handle API errors (e.g., 404 Not Found for invalid zip code)
            if exc.response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Weather data not found for zip code {zip_code}.",
                )
            else:
                # Log the error details for debugging
                print(
                    f"HTTP error occurred: {exc.request.url} - {exc.response.status_code} - {exc.response.text}"
                )
                raise HTTPException(
                    status_code=exc.response.status_code,
                    detail=f"Error fetching weather data: {exc.response.text}",
                )
        except httpx.RequestError as exc:
            # Handle network-related errors
            print(f"An error occurred while requesting {exc.request.url!r}: {exc}")
            raise HTTPException(
                status_code=503,
                detail="Service unavailable: Could not connect to weather service.",
            )
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal server error.")


if __name__ == "__main__":
    import uvicorn

    # Check if running in a development environment (e.g., when run directly)
    # You might use environment variables to control host and port in production
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("DEBUG", "true").lower() == "true"

    print(f"Starting server on {host}:{port} with reload={reload}")
    uvicorn.run("main:app", host=host, port=port, reload=reload)
