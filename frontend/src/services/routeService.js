const API_KEY =
  import.meta.env.VITE_ORS_API_KEY;

export async function getRoute(routePoints) {

  try {

    const coordinates =
      routePoints.map(point => [
        point.lng,
        point.lat,
      ]);

    const response =
      await fetch(

        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              API_KEY,
          },

          body: JSON.stringify({
            coordinates,
          }),
        }
      );

    const data =
      await response.json();

    return data;

  } catch (error) {

    console.log(
      "ORS Error",
      error
    );

    return null;
  }
}
