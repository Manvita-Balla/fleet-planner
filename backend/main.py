from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests

app = FastAPI()

# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Backend working"}

@app.post("/route")
async def get_route(data: dict):

    try:

        coordinates = data.get("coordinates")

        print("Received coordinates:", coordinates)

        coordinate_string = ";".join(
            [f"{lng},{lat}" for lng, lat in coordinates]
        )

        url = f"https://router.project-osrm.org/route/v1/driving/{coordinate_string}?overview=full&geometries=geojson"

        response = requests.get(
            url,
            timeout=10
        )

        osrm_data = response.json()

        print(osrm_data)

        if "routes" not in osrm_data:
            return {
                "error": "No routes found"
            }

        route = osrm_data["routes"][0]

        return {
            "features": [
                {
                    "geometry": {
                        "coordinates": route["geometry"]["coordinates"]
                    },
                    "properties": {
                        "summary": {
                            "distance": route["distance"],
                            "duration": route["duration"]
                        }
                    }
                }
            ]
        }

    except Exception as e:

        print("ERROR:", str(e))

        return {
            "error": str(e)
        }