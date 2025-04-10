import os
import httpx
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from prisma import Prisma, register

# Load environment variables from .env file
load_dotenv()

# Initialize Prisma Client
db = Prisma()
register(db)


# Define lifespan context manager for Prisma connection
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to database...")
    await db.connect()
    yield  # Application runs here
    print("Disconnecting from database...")
    await db.disconnect()


# Pass lifespan manager to FastAPI app
app = FastAPI(lifespan=lifespan)

# Configure Jinja2 templates
templates = Jinja2Templates(directory="templates")

OPENWEATHERMAP_API_KEY = os.getenv("OPENWEATHERMAP_API_KEY")
OPENWEATHERMAP_URL = "https://api.openweathermap.org/data/2.5/weather"

if not OPENWEATHERMAP_API_KEY:
    print("Warning: OPENWEATHERMAP_API_KEY environment variable not set.")
    # In a real app, you might want to raise an exception or handle this differently
    # raise ValueError("OPENWEATHERMAP_API_KEY environment variable is required")


# New endpoint to serve the HTML page
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serves the main HTML page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/weather/{zip_code}")
async def get_weather_by_zip(zip_code: str):
    """
    Fetches current weather data for a given US zip code and saves it to the database.
    """
    if not OPENWEATHERMAP_API_KEY:
        raise HTTPException(
            status_code=500, detail="Server configuration error: API key not set."
        )

    params = {
        "zip": f"{zip_code},us",  # Append ,us for US zip codes
        "appid": OPENWEATHERMAP_API_KEY,
        "units": "imperial",  # Use Fahrenheit for temperature
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(OPENWEATHERMAP_URL, params=params)
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            weather_data = response.json()

            # You can customize the data you want to return here
            # For example, return just the main weather info and temperature
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

            # --- Save to Database ---
            saved_record = None  # Initialize variable to hold the saved record
            try:
                print(f"Attempting to save weather data for zip code {zip_code}...")
                # Prepare data for Prisma model (handle potential nulls if necessary)
                prisma_data = {
                    "zipCode": zip_code,
                    "city": simplified_data.get("city"),
                    "weather": simplified_data.get("weather"),
                    "description": simplified_data.get("description"),
                    "temperature": simplified_data.get("temperature"),
                    "feelsLike": simplified_data.get(
                        "feels_like"
                    ),  # Corresponds to feels_like in schema via @map
                    "humidity": simplified_data.get("humidity"),
                    "windSpeed": simplified_data.get(
                        "wind_speed"
                    ),  # Corresponds to wind_speed in schema via @map
                    "latitude": simplified_data.get("latitude"),
                    "longitude": simplified_data.get("longitude"),
                }
                # Remove keys with None values if your schema fields are not optional
                # (though in our schema they are mostly optional)
                # prisma_data_cleaned = {k: v for k, v in prisma_data.items() if v is not None}

                # Use the cleaned data if you implemented that
                # saved_record = await db.weatherdata.create(data=prisma_data_cleaned)
                saved_record = await db.weatherdata.create(data=prisma_data)
                print(f"Successfully saved weather data for zip code {zip_code}.")
            except Exception as db_error:
                # Log the error but don't fail the request if DB write fails
                print(
                    f"Database Error: Failed to save weather data for zip {zip_code}: {db_error}"
                )
            # --- End Save to Database ---

            # --- Fetch Historical Data ---
            historical_data = []
            try:
                print(f"Fetching historical data for zip code {zip_code}...")
                historical_data = await db.weatherdata.find_many(
                    where={"zipCode": zip_code},
                    order={"createdAt": "desc"},
                    # Optionally limit the number of historical records:
                    # take=10
                )
                print(
                    f"Found {len(historical_data)} historical records for zip code {zip_code}."
                )
            except Exception as db_error:
                # Log the error but don't fail the request if history fetch fails
                print(
                    f"Database Error: Failed to fetch historical data for zip {zip_code}: {db_error}"
                )
            # --- End Fetch Historical Data ---

            # Return both latest and historical data
            return {
                "latest": simplified_data,
                "history": [
                    record.dict() for record in historical_data
                ],  # Convert Prisma models to dicts
            }

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
            # Catch any other unexpected errors
            print(f"An unexpected error occurred: {e}")
            raise HTTPException(status_code=500, detail="Internal server error.")


# New DELETE endpoint for historical data
@app.delete("/weather/history/{record_id}", status_code=200)
async def delete_weather_history(record_id: int):
    """
    Deletes a specific weather data record from the database by its ID.
    """
    try:
        print(f"Attempting to delete record with ID: {record_id}")
        # Attempt to find the record first to ensure it exists (optional but good practice)
        record_to_delete = await db.weatherdata.find_unique(where={"id": record_id})

        if not record_to_delete:
            print(f"Record with ID {record_id} not found.")
            raise HTTPException(
                status_code=404, detail=f"Record with ID {record_id} not found."
            )

        # Delete the record
        await db.weatherdata.delete(where={"id": record_id})
        print(f"Successfully deleted record with ID: {record_id}")
        return {"message": f"Record {record_id} deleted successfully"}

    except HTTPException as http_exc:  # Re-raise HTTPExceptions
        raise http_exc
    except Exception as e:
        # Log the error and return a generic server error
        print(f"Database Error: Failed to delete record {record_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Internal server error during deletion."
        )


if __name__ == "__main__":
    import uvicorn

    # Check if running in a development environment (e.g., when run directly)
    # You might use environment variables to control host and port in production
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("DEBUG", "true").lower() == "true"

    print(f"Starting server on {host}:{port} with reload={reload}")
    uvicorn.run("main:app", host=host, port=port, reload=reload)
