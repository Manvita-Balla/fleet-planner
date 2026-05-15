import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { kmeans } from "ml-kmeans";
import ReactDOMServer from "react-dom/server";

import "leaflet/dist/leaflet.css";

import debounce from "lodash/debounce";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

// ROUTE COLORS

const routeColors = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#eab308",
  "#9333ea",
  "#f97316",
];

// ICON

function createNumberedIcon(
  label,
  color
) {

  return L.divIcon({
    html: ReactDOMServer.renderToString(
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-lg"
        style={{
          background: color,
        }}
      >
        {label}
      </div>
    ),

    className: "",
    iconSize: [36, 36],
  });
}

// DISTANCE

function calculateDistance(a, b) {

  const dx = a.lat - b.lat;
  const dy = a.lng - b.lng;

  return Math.sqrt(dx * dx + dy * dy);
}

// PRIORITY

function getPriorityValue(
  priority
) {

  if (priority === "High")
    return 1;

  if (priority === "Medium")
    return 2;

  return 3;
}

// OPTIMIZE ROUTE

function optimizeRoute(
  stops,
  startPoint,
  routeMode
) {

  if (stops.length <= 1)
    return stops;

  let optimized = [];

  // =========================
  // SHORTEST
  // =========================

  if (routeMode === "shortest") {

    const remaining = [...stops];

    let current =
      startPoint || remaining.shift();

    if (!startPoint) {
      optimized.push(current);
    }

    while (remaining.length > 0) {

      let nearestIndex = 0;

      let nearestDistance =
        calculateDistance(
          current,
          remaining[0]
        );

      for (let i = 1; i < remaining.length; i++) {

        const distance =
          calculateDistance(
            current,
            remaining[i]
          );

        if (distance < nearestDistance) {

          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest =
        remaining.splice(nearestIndex, 1)[0];

      optimized.push(nearest);

      current = nearest;
    }

    return optimized;
  }

  // =========================
  // PRIORITY
  // =========================

  if (routeMode === "priority") {

    return [...stops].sort(
      (a, b) =>
        getPriorityValue(a.priority) -
        getPriorityValue(b.priority)
    );
  }

  // =========================
  // BALANCED
  // =========================

  if (routeMode === "balanced") {

    return [...stops].sort((a, b) => {

      const priorityScore =
        getPriorityValue(a.priority) -
        getPriorityValue(b.priority);

      const distanceScore =
        calculateDistance(startPoint || a, a) -
        calculateDistance(startPoint || b, b);

      return (
        priorityScore * 0.5 +
        distanceScore * 0.5
      );
    });
  }

  // =========================
  // FASTEST
  // =========================

  if (routeMode === "fastest") {

    return [...stops].sort(
      () => Math.random() - 0.5
    );
  }

  return stops;
}

// CLUSTER VEHICLES

function clusterStopsIntoVehicles(
  stops,
  vehicleCount
  
) {

  if (
    stops.length === 0
  ) return [];
  vehicleCount = Math.min(
    vehicleCount,
    stops.length
  );
  
  if (vehicleCount === 1) {

    return [stops];
  }

  if (
    stops.length <=
    vehicleCount
  ) {

    return stops.map(
      stop => [stop]
    );
  }

  const points =
    stops.map(stop => [
      stop.lat,
      stop.lng,
    ]);

  if (points.length < vehicleCount) {
    return stops.map(stop => [stop]);
  }
  const result =
    kmeans(
      points,
      vehicleCount
    );

  const vehicles =
    Array.from(
      { length: vehicleCount },
      () => []
    );

  stops.forEach(
    (stop, index) => {

      const clusterIndex =
        result.clusters[
          index
        ];

      vehicles[
        clusterIndex
      ].push(stop);
    }
  );

  return vehicles;
}



// MAP CLICK

function MapClickHandler({
  mode,
  priority,
  setStartPoint,
  setEndPoint,
  setStops,
  setCrossDockPoint,
  roundTrip,
}) {

  useMapEvents({
    click(e) {

      const point = {

        lat:
          e.latlng.lat,

        lng:
          e.latlng.lng,

        priority,

        name:
          `Point ${Date.now()}`,
      };

      if (
        mode === "start"
      ) {

        setStartPoint(point);

      }

      else if (
        mode === "end" &&
        !roundTrip
      ) {

        setEndPoint(point);

      }
      else if (
        mode === "crossdock"
      ) {

        setCrossDockPoint(point);
      }

      else {

        setStops(prev => [
          ...prev,
          point,
        ]);
      }
    },
  });

  return null;
}

// MARKERS

function RouteMarkers({
  routes,
  setStops,
}){


  return (
    <>
      {routes.map(
        (
          route,
          vehicleIndex
        ) =>

          route.map(
            (
              stop,
              stopIndex
            ) => (

              <Marker
                key={`${vehicleIndex}-${stopIndex}`}

                position={[
                  stop.lat,
                  stop.lng,
                ]}

                icon={createNumberedIcon(

                  `${stopIndex + 1}`,

                  routeColors[
                    vehicleIndex %
                      routeColors.length
                  ]
                )}
              >

                <Popup>

                  <div className="space-y-2 min-w-35">

                    <p>
                      <strong>
                        Vehicle:
                      </strong>
                      {" "}
                      {vehicleIndex + 1}
                    </p>

                    <p>
                      <strong>
                        Stop:
                      </strong>
                      {" "}
                      {stopIndex + 1}
                    </p>

                    <p>
                      <strong>
                        Priority:
                      </strong>
                      {" "}
                      {stop.priority}
                    </p>
                    <p>
                      <strong>
                        Name:
                      </strong>
                      {" "}
                      {stop.name || "Unknown"}
                    </p>

                    <button
                      onClick={() => {

                        setStops(
                          prev =>
                            prev.filter(
                              s =>

                                !(

                                  s.lat === stop.lat &&
                                  s.lng === stop.lng &&
                                  s.priority === stop.priority

                                )
                            )
                        );
                      }}

                      className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-semibold"
                    >
                      Delete Stop
                    </button>

                  </div>

                </Popup>

              </Marker>
            )
          )
      )}
    </>
  );
}

function ORSRoute({
  routePoints,
  color,
  onRouteCalculated,
  setLoading,
}) {

  const [positions, setPositions] = useState([[]]);

  const previousPointsRef = useRef("");

  useEffect(() => {

    if (routePoints.length < 2){
      setPositions([]);
      return;
    }

    const currentPoints =
      JSON.stringify(routePoints);

        if (
          previousPointsRef.current === currentPoints
        ) {
          return;
        }

        previousPointsRef.current =
          currentPoints;

    /*if (
      previousPointsRef.current === currentPoints
    ) {
      return;
    }

    previousPointsRef.current =
      currentPoints;*/

    async function fetchRoute() {
      setLoading(true);

      try {

        const coordinates =
          routePoints.map(point => [
            point.lng,
            point.lat,
          ]);
        
        const response =
          await fetch(
            `${import.meta.env.VITE_API_URL}/route`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                coordinates,
              }),
            }
          );

        const data =
          await response.json();

        if (
          !data.features ||
          !data.features[0]
        ) {
          return;
        }

        const allRoutes =
          data.features.map(feature => {

            return feature.geometry.coordinates.map(
              coord => [
                coord[1],
                coord[0]
              ]
            );

          });

        setPositions(allRoutes);

        const summary =
          data.features[0]
            .properties.summary;

        onRouteCalculated({
          distanceKm:
            Number(
              (
                summary.distance / 1000
              ).toFixed(2)
            ),

          timeHrs:
            Number(
              (
                summary.duration / 3600
              ).toFixed(2)
            ),
        });

      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);
      }
    }

    fetchRoute();

  }, [
    routePoints,
    onRouteCalculated,
    setLoading
  ]);

  return (
    <>
      {positions.map((route, index) => (

        <Polyline
          key={index}
          positions={route}
          pathOptions={{
            color: index === 0 ? color : "#94a3b8",
            weight: index === 0 ? 5 : 3,
            opacity: index === 0 ? 1 : 0.5,
          }}
        />

      ))}
    </>
  );
}
// MAIN APP

function FixMapSize() {

  const map = useMap();

  useEffect(() => {

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [map]);

  return null;
}

function App() {

  const [
    startPoint,
    setStartPoint,
  ] = useState(null);

  const [
    endPoint,
    setEndPoint,
  ] = useState(null);
  const [
    crossDockPoint,
    setCrossDockPoint,
  ] = useState(null);

  const [
    stops,
    setStops,
  ] = useState([]);

  const [
    mode,
    setMode,
  ] = useState("stop");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    priority,
    setPriority,
  ] = useState("Low");

  const [
    vehicleCount,
    setVehicleCount,
  ] = useState(2);
  const [
  routeStats,
  setRouteStats,
  ] = useState([]);
  const [
  roundTrip,
  setRoundTrip,
  ] = useState(false);

  const [
  loading, 
  setLoading,
  ] = useState(false);

  const [
  routeOptions,
  setRouteOptions,
  ] = useState([]);

  const [
  selectedRouteOption,
  setSelectedRouteOption,
  ] = useState("shortest");

  const [
  manualRoutes,
  setManualRoutes,
  ] = useState([]);

function handleDragEnd(result) {

  if (!result.destination)
    return;

  const sourceVehicle =
    parseInt(result.source.droppableId);

  const destinationVehicle =
    parseInt(result.destination.droppableId);

  const updatedRoutes =
    [...manualRoutes];

  const sourceStops =
    [...updatedRoutes[sourceVehicle]];

  const [movedStop] =
    sourceStops.splice(
      result.source.index,
      1
    );

  // SAME VEHICLE

  if (
    sourceVehicle ===
    destinationVehicle
  ) {

    sourceStops.splice(
      result.destination.index,
      0,
      movedStop
    );

    updatedRoutes[sourceVehicle] =
      sourceStops;
  }

  // DIFFERENT VEHICLE

  else {

    const destinationStops =
      [...updatedRoutes[destinationVehicle]];

    destinationStops.splice(
      result.destination.index,
      0,
      movedStop
    );

    updatedRoutes[sourceVehicle] =
      sourceStops;

    updatedRoutes[destinationVehicle] =
      destinationStops;
  }

  setManualRoutes(updatedRoutes);
}

  // VEHICLE SPLIT

  const vehicleStops =
    useMemo(() => {

      if (
        stops.length === 0
      ) return [];

      try {

        return clusterStopsIntoVehicles(
          stops,
          vehicleCount
        );

      }

      catch {

        return [];
      }

    }, [
      stops,
      vehicleCount,
    ]);

  // OPTIMIZED ROUTES

      const generatedRouteOptions =
        useMemo(() => {

          return [

            {
              id: "shortest",
              name: "Shortest",
              routes: vehicleStops.map(
                route =>
                  optimizeRoute(
                    [...route],
                    startPoint,
                    "shortest"
                  )
              ),
            },

            {
              id: "priority",
              name: "Priority",
              routes: vehicleStops.map(
                route =>
                  optimizeRoute(
                    [...route],
                    startPoint,
                    "priority"
                  )
              ),
            },

            {
              id: "balanced",
              name: "Balanced",
              routes: vehicleStops.map(
                route =>
                  optimizeRoute(
                    [...route],
                    startPoint,
                    "balanced"
                  )
              ),
            },

          ];

        }, [
          vehicleStops,
          startPoint,
        ]);

    useEffect(() => {

      const activeRoutes =
        generatedRouteOptions.find(
          option =>
            option.id ===
            selectedRouteOption
        )?.routes || [];

      setRouteStats(
        activeRoutes.map(() => ({
          distanceKm: 0,
          timeHrs: 0,
        }))
      );

    }, [generatedRouteOptions, selectedRouteOption]);

    useEffect(() => {

      const activeRoutes =
        generatedRouteOptions.find(
          option =>
            option.id ===
            selectedRouteOption
        )?.routes || [];

      setManualRoutes(activeRoutes);

    }, [
      generatedRouteOptions,
      selectedRouteOption
    ]);

  // ANALYTICS

  // VEHICLE SUGGESTION

  const stopsBasedVehicles =
    Math.ceil(
      stops.length / 15
    );

  const totalDistanceValue =
    routeStats.reduce(
      (
        total,
        route
      ) =>

        total +
        route.distanceKm,

      0
    );

  const distanceBasedVehicles =
    Math.ceil(
      totalDistanceValue / 80
    );


  const suggestedVehicles =
    Math.max(
      1,
      stopsBasedVehicles,
      distanceBasedVehicles
    );

  // ADD LOCATION

  async function addLocation() {

    if (!location) return;

    let point = null;

    // LAT LNG

    if (
      location.includes(",")
    ) {

      const parts =
        location.split(",");

      if (
        parts.length === 2
      ) {

        const lat =
          parseFloat(
            parts[0].trim()
          );

        const lng =
          parseFloat(
            parts[1].trim()
          );

        if (
          !isNaN(lat) &&
          !isNaN(lng)
        ) {

          point = {
            lat,
            lng,
            priority,
            name: location,
          };
        }
      }
    }

    // SEARCH

    if (!point) {

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
        );

      const data =
        await response.json();

      if (
        data.length === 0
      ) {

        alert(
          "Location not found"
        );

        return;
      }

      point = {
        lat: parseFloat(
          data[0].lat
        ),

        lng: parseFloat(
          data[0].lon
        ),

        priority,
        name: location,

        type: "stop",
      };
    }

    if (
      mode === "start"
    ) {

      setStartPoint(point);

    }

    else if (
      mode === "end" &&
      !roundTrip
    ) {

      setEndPoint(point);

    }
    else if (
      mode === "crossdock"
    ) {

  setCrossDockPoint(point);
}

    else {

      setStops(prev => [
        ...prev,
        point,
      ]);
    }

    setLocation("");
  }

  // FILE UPLOAD

  function handleFileUpload(
    event
  ) {

    const file =
      event.target.files[0];

    if (!file) return;

    const fileName =
      file.name.toLowerCase();

    // CSV

    if (
      fileName.endsWith(
        ".csv"
      )
    ) {

      Papa.parse(file, {

        header: true,

        complete: function(
          results
        ) {

          const parsedStops =
            results.data

              .filter(
                row =>
                  row.lat &&
                  row.lng
              )

              .map(
                row => ({

                  lat:
                    parseFloat(
                      row.lat
                    ),

                  lng:
                    parseFloat(
                      row.lng
                    ),

                  priority:
                    row.priority ||
                    "Low",

                  name:
                    row.name ||
                    `Stop ${
                      Math.random()
                        .toString(36)
                        .slice(2, 7)
                    }`,

                  type:
                    row.type || "stop",

                })
              )


              .filter(
                stop =>
                  !isNaN(
                    stop.lat
                  ) &&

                  !isNaN(
                    stop.lng
                  )
              );

          parsedStops.forEach(stop => {

            const stopType =
              stop.type?.toLowerCase();

            if (stopType === "start") {

              setStartPoint(stop);
            }

            else if (stopType === "end") {

              setEndPoint(stop);
            }

            else if (stopType === "hub") {

              setCrossDockPoint(stop);
            }

            else {

              setStops(prev => [
                ...prev,
                stop,
              ]);
            }
          });
        },
      });
    }

    // EXCEL

    else if (
      fileName.endsWith(
        ".xlsx"
      ) ||

      fileName.endsWith(
        ".xls"
      )
    ) {

      const reader =
        new FileReader();

      reader.onload = (
        e
      ) => {

        const data =
          new Uint8Array(
            e.target.result
          );

        const workbook =
          XLSX.read(data, {
            type:
              "array",
          });

        const sheetName =
          workbook
            .SheetNames[0];

        const worksheet =
          workbook.Sheets[
            sheetName
          ];

        const jsonData =
          XLSX.utils.sheet_to_json(
            worksheet
          );

        const parsedStops =
          jsonData

            .filter(
              row =>
                row.lat !==
                  undefined &&

                row.lng !==
                  undefined
            )

            .map(
              row => ({

                lat:
                  parseFloat(
                    row.lat
                  ),

                lng:
                  parseFloat(
                    row.lng
                  ),

                priority:
                  row.priority ||
                  "Low",

                name:
                  row.name ||
                  `Stop ${
                    Math.random()
                      .toString(36)
                      .slice(2, 7)
                  }`,

                type:
                  row.type || "stop",

              })
            )

            .filter(
              stop =>
                !isNaN(
                  stop.lat
                ) &&

                  !isNaN(
                  stop.lng
                )
            );

        parsedStops.forEach(stop => {

          const stopType =
            stop.type?.toLowerCase();

          if (stopType === "start") {

            setStartPoint(stop);
          }

          else if (stopType === "end") {

            setEndPoint(stop);
          }

          else if (stopType === "hub") {

            setCrossDockPoint(stop);
          }

          else {

            setStops(prev => [
              ...prev,
              stop,
            ]);
          }
        });
                    
      };

      reader.readAsArrayBuffer(
        file
      );
    }

    else {

      alert(
        "Unsupported file format"
      );
    }
  }

  // EXPORT

  function exportRoutes() {

    const exportData = [];

    (
      generatedRouteOptions.find(
        option =>
          option.id ===
          selectedRouteOption
      )?.routes || []
    ).forEach(

      (
        route,
        vehicleIndex
      ) => {

        route.forEach(
          (
            stop,
            stopIndex
          ) => {

            exportData.push({

              Vehicle:
                vehicleIndex + 1,

              StopOrder:
                stopIndex + 1,

              Latitude:
                stop.lat,

              Longitude:
                stop.lng,

              Priority:
                stop.priority,

            });
          }
        );
      }
    );

    const worksheet =
      XLSX.utils.json_to_sheet(
        exportData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Optimized Routes"
    );

    const excelBuffer =
      XLSX.write(
        workbook,
        {
          bookType: "xlsx",
          type: "array",
        }
      );

    const fileData =
      new Blob(
        [excelBuffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        }
      );

    saveAs(
      fileData,
      "optimized_routes.xlsx"
    );
  }
  
  const handleRouteCalculated = useCallback(

    debounce((index, stats) => {

      setRouteStats(prev => {

        const updated = [...prev];

        updated[index] = stats;

        return updated;
      });

    }, 300),

    []
  );

  return (

    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden text-white">

      {/* SIDEBAR */}

      <div className="w-75 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 p-5 overflow-y-auto space-y-5">

        {/* HEADER */}

        <div>

          <h1 className="text-3xl font-bold">
            AI Fleet Planner
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            Smart logistics dashboard
          </p>

        </div>

        {/* VEHICLES */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Vehicles
          </p>

          <input
            type="number"
            min="1"
            max="10"
            value={vehicleCount}
            onChange={(e) =>
            {
              const value = parseInt(e.target.value);
              setVehicleCount(
                isNaN(value) ? 1 : value  
              )
            }
          }
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 outline-none"
          />

        </div>

        {/* MODE */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Route Mode
          </p>

          <div className="grid grid-cols-4 gap-2">

            <button
              onClick={() =>
                setMode("start")
              }
              className={`py-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] font-semibold ${
                mode === "start"
                  ? "bg-green-600"
                  : "bg-slate-800"
              }`}
            >
              Start
            </button>

            <button
              onClick={() =>
                setMode("stop")
              }
              className={`py-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] font-semibold ${
                mode === "stop"
                  ? "bg-blue-600"
                  : "bg-slate-800"
              }`}
            >
              Stops
            </button>

            <button

              onClick={() =>
                setMode("end")
              }
              className={`py-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] font-semibold ${
                mode === "end"
                  ? "bg-red-600"
                  : "bg-slate-800"
              }`}
            >
              End
            </button>
            
            <button
              onClick={() =>
                setMode("crossdock")
              }
              className={`py-3 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] font-semibold ${
                mode === "crossdock"
                  ? "bg-yellow-500"
                  : "bg-slate-800"
              }`}
>
  Hub
</button>

          </div>

        </div>

        {/* ROUND TRIP */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Route Type
          </p>

          <button
            onClick={() =>
              setRoundTrip(
                !roundTrip
              )
            }

            className={`w-full py-3 rounded-2xl font-semibold transition-all duration-200 ${
              roundTrip
                ? "bg-cyan-600"
                : "bg-slate-800"
            }`}
          >

            {roundTrip
              ? "Round Trip Enabled"
              : "One Way Route"}

          </button>

        </div>

        
        {/* PRIORITY */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Priority
          </p>

          <select
            value={priority}
            onChange={(e) =>
              setPriority(
                e.target.value
              )
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3"
          >

            <option>
              High
            </option>

            <option>
              Medium
            </option>

            <option>
              Low
            </option>

          </select>

        </div>


        {/* SEARCH */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Add Location
          </p>

          <input
            type="text"
            placeholder="Location or lat,lng"
            value={location}
            onChange={(e) =>
              setLocation(
                e.target.value
              )
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3"
          />

          <button
            onClick={addLocation}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] py-3 font-semibold"
          >
            Add Location
          </button>

        </div>

        {/* FILE */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Upload File
          </p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={
              handleFileUpload
            }
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3"
          />

        </div>

        {/* ROUTE OPTIONS */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">
            Route Options
          </p>

          <div className="space-y-2">

            {generatedRouteOptions.map(option => (

              <button
                key={option.id}

                onClick={() =>
                  setSelectedRouteOption(option.id)
                }

                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  selectedRouteOption === option.id
                    ? "bg-blue-600"
                    : "bg-slate-800"
                }`}
              >

                <div className="flex items-center justify-between">

                  <div>

                    <div className="font-bold">
                      {option.name}
                    </div>

                    <div className="text-sm text-slate-300">
                      {option.routes.flat().length} stops
                    </div>

                  </div>

                </div>

              </button>

            ))}

          </div>

        </div>

        {/* SUMMARY */}

        <div>

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
            Analytics
          </p>

          <div className="grid grid-cols-2 gap-3">

            <div className="bg-blue-600 rounded-2xl p-4 shadow-lg">

              <p className="text-xs">
                Stops
              </p>

              <h2 className="text-2xl font-bold mt-1">
                {stops.length}
              </h2>

            </div>

            <div className="bg-green-600 rounded-2xl p-4 shadow-lg">

              <p className="text-xs">
                Distance
              </p>

              <h2 className="text-2xl font-bold mt-1">
                {
                  routeStats.reduce(
                    (acc, route) =>
                      acc + (route?.distanceKm || 0),
                    0
                  ).toFixed(2)
                }
                km
              </h2>

            </div>

            <div className="bg-purple-600 rounded-2xl p-4 shadow-lg">

              <p className="text-xs">
                ETA
              </p>

              <h2 className="text-2xl font-bold mt-1">
                {
                  routeStats.reduce(
                    (acc, route) =>
                      acc + (route?.timeHrs || 0),
                    0
                  ).toFixed(2)
                }
                hrs
              </h2>

            </div>

            <div className="bg-orange-500 rounded-2xl p-4 shadow-lg">

              <p className="text-xs">
                Vehicles
              </p>

              <h2 className="text-2xl font-bold mt-1">
                {vehicleCount}
              </h2>

            </div>

          </div>

        </div>

        {/* DRIVER ROUTES */}

        <div className="bg-slate-800 rounded-2xl p-4">

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
            Driver Stops
          </p>

          <div className="space-y-4">

            {(generatedRouteOptions.find(
              option =>
                option.id ===
                selectedRouteOption
            )?.routes || []).map((route, vehicleIndex) => (

              <div
                key={vehicleIndex}
                className="bg-slate-900 rounded-xl p-3"
              >

                <p className="font-bold text-blue-400 mb-2">
                  Vehicle {vehicleIndex + 1}
                </p>

                <div className="space-y-1 text-sm">

                  {route.map((stop, stopIndex) => (

                    <div key={stopIndex}>
                      {stopIndex + 1}. {stop.name}
                    </div>

                  ))}

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* SUGGESTED */}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg">

          <p className="text-slate-400 text-sm">
            Suggested Vehicles
          </p>

          <h2 className="text-4xl font-bold text-yellow-400 mt-2">
            {suggestedVehicles}
          </h2>

        </div>


        {/* DRIVER ROUTES */}

        <div className="bg-slate-800 rounded-2xl p-4">

          <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">
            Driver Routes
          </p>

          <DragDropContext
            onDragEnd={handleDragEnd}
          >

            <div className="space-y-4">

              {manualRoutes.map(
                (
                  route,
                  vehicleIndex
                ) => (

                  <Droppable
                    droppableId={`${vehicleIndex}`}
                    key={vehicleIndex}
                  >

                    {(provided) => (

                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}

                        className="bg-slate-900 rounded-xl p-3"
                      >

                        <p className="font-bold text-blue-400 mb-3">
                          Vehicle {vehicleIndex + 1}
                        </p>

                        <div className="space-y-2">

                          {route.map(
                            (
                              stop,
                              stopIndex
                            ) => (

                              <Draggable
                                key={`${vehicleIndex}-${stopIndex}`}
                                draggableId={`${vehicleIndex}-${stopIndex}`}
                                index={stopIndex}
                              >

                                {(provided) => (

                                  <div
                                    ref={provided.innerRef}

                                    {...provided.draggableProps}

                                    {...provided.dragHandleProps}

                                    className="bg-slate-800 rounded-lg p-3 cursor-move"
                                  >

                                    <div className="flex justify-between items-center">

                                      <div>

                                        <p className="font-semibold">
                                          {stop.name}
                                        </p>

                                        <p className="text-xs text-slate-400">
                                          {stop.priority}
                                        </p>

                                      </div>

                                      <div className="text-slate-500">
                                        ☰
                                      </div>

                                    </div>

                                  </div>

                                )}

                              </Draggable>

                            )
                          )}

                          {provided.placeholder}

                        </div>

                      </div>

                    )}

                  </Droppable>

                )
              )}

            </div>

          </DragDropContext>

        </div>

        {/* ACTIONS */}

        <div className="space-y-3">
          
          <button
            onClick={() => {

              setLoading(true);

              setTimeout(() => {

                setLoading(false);

              }, 1000);

            }}
                        className="w-full bg-green-600 hover:bg-green-700 rounded-2xl py-4 font-bold"
          >
            Generate Route
          </button>
          
          <button
            onClick={exportRoutes}
            className="w-full bg-purple-600 hover:bg-purple-700 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] py-4 font-bold"
          >
            Export Routes
          </button>

          <button
            onClick={() => {

              setStartPoint(
                null
              );

              setEndPoint(
                null
              );

              setStops([]);
              setCrossDockPoint(
                null
              );
            }}
            className="w-full bg-red-600 hover:bg-red-700 rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.02] py-4 font-bold"
          >
            Clear Routes
          </button>

        </div>

      </div>
      

      {/* MAP */}

      <div className="flex-1 p-3 bg-slate-950 relative">
        {loading && (
          <div className="absolute top-5 right-5 z-[9999] bg-black/80 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700">
            Optimizing Route...
          </div>
        )}

        <div className="h-full w-full rounded-3xl overflow-hidden shadow-2xl">

          <MapContainer
            center={[
              17.3850,
              78.4867,
            ]}
            zoom={11}
            style={{
              height: "100%",
              width: "100%",
            }}
          >

            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"

            />
            <FixMapSize />


            <MapClickHandler
                mode={mode}
                priority={priority}
                roundTrip={roundTrip}
                setStartPoint={setStartPoint}
                setEndPoint={setEndPoint}
                setCrossDockPoint={
                  setCrossDockPoint
                }
                setStops={setStops} 
            />

            {crossDockPoint && (

              <Marker
                position={[
                  crossDockPoint.lat,
                  crossDockPoint.lng
                ]}
                icon={createNumberedIcon(
                  "H",
                  "#facc15"
                )}
              >

                <Popup>

                  <div className="space-y-2">

                    <p>
                      {crossDockPoint.name ||
                        "Cross Dock Hub"}
                    </p>

                    <button
                      onClick={() =>
                        setCrossDockPoint(
                          null
                        )
                      }

                      className="bg-red-600 text-white px-3 py-2 rounded-lg w-full"
                    >
                      Delete
                    </button>

                  </div>

                </Popup>

              </Marker>
            )}

            {startPoint && (

              <Marker
                position={[
                  startPoint.lat,
                  startPoint.lng
                ]}
                icon={createNumberedIcon(
                  "S",
                  "#22c55e"
                )}
              >

                <Popup>

                  <div className="space-y-2">

                    <p>
                      {startPoint.name ||
                        "Start Point"}
                    </p>

                    <button
                      onClick={() =>
                        setStartPoint(
                          null
                        )
                      }

                      className="bg-red-600 text-white px-3 py-2 rounded-lg w-full"
                    >
                      Delete
                    </button>

                  </div>

                </Popup>

              </Marker>
            )}

            {endPoint && (

              <Marker
                position={[
                  endPoint.lat,
                  endPoint.lng
                ]}
                icon={createNumberedIcon(
                  "E",
                  "#ef4444"
                )}
              >

                <Popup>

                  <div className="space-y-2">

                    <p>
                      {endPoint.name ||
                        "End Point"}
                    </p>

                    <button
                      onClick={() =>
                        setEndPoint(
                          null
                        )
                      }

                      className="bg-red-600 text-white px-3 py-2 rounded-lg w-full"
                    >
                      Delete
                    </button>

                  </div>

                </Popup>

              </Marker>
            )}


            <RouteMarkers
                routes={manualRoutes}
                setStops={setStops}
            />
            

            {manualRoutes.map((route, index) => {

              const routePoints = [];

              if (startPoint) {
                routePoints.push(startPoint);
              }

              if (crossDockPoint) {
                routePoints.push(crossDockPoint);
              }

              routePoints.push(...route);

              if (roundTrip) {

                if (startPoint) {

                  routePoints.push({
                    ...startPoint
                  });
                }

              } else {

                if (endPoint) {
                  routePoints.push(endPoint);
                }
              }

              const validRoutePoints =
                routePoints.filter(
                  point =>
                    point &&
                    typeof point.lat === "number" &&
                    typeof point.lng === "number"
                );

              return (

                <ORSRoute
                  key={index}

                  routePoints={validRoutePoints}

                  color={
                    routeColors[
                      index %
                      routeColors.length
                    ]
                  }

                  setLoading={setLoading}

                  onRouteCalculated={(stats) => {

                    handleRouteCalculated(
                      index,
                      {
                        distanceKm:
                          Number(stats.distanceKm),

                        timeHrs:
                          Number(stats.timeHrs),
                      }
                    );
                  }}

                />

              );

            })}


              </MapContainer>

        </div>

      </div>

    </div>
  );
}

export default App;