# AI Fleet Planner
AI Fleet Planner is a smart logistics and route optimization platform built to simplify delivery planning and fleet management. The system allows users to upload delivery stops through Excel/CSV files or add them manually on the map, and automatically generates optimized delivery routes with distance and ETA calculations.

The project focuses on solving real-world logistics problems such as:

* route sequencing
* vehicle clustering
* round-trip planning
* multi-stop optimization
* delivery analytics

This project was built as a full-stack web application using React, FastAPI, OpenStreetMap, and OSRM routing services.

# Features
* Multi-stop route optimization
* Vehicle-wise clustering using K-Means
* Round trip and one-way route planning
* Excel and CSV upload support
* Start point, end point, and hub support
* Distance and ETA calculation
* Route export to Excel
* Multiple vehicle route generation
* Smart analytics dashboard

# Tech Stack 
## Frontend
* React + Vite
* Tailwind CSS
* React Leaflet
* PapaParse
* XLSX
* File Saver

## Backend
* FastAPI
* Python
* OSRM Routing Engine

## Algorithms & Libraries
* K-Means Clustering (ml-kmeans)
* Nearest Neighbor Route Optimization

# Project Structure 
```bash
Routing/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── render.yaml
│
└── README.md
```

# How It Works 
1. User uploads stops or adds locations manually.
2. Stops are clustered vehicle-wise using K-Means.
3. Routes are optimized using nearest-neighbor logic.
4. Backend fetches real road routes using OSRM.
5. Optimized routes are displayed on the map.
6. Distance and ETA are calculated automatically.

# Excel Upload Format 

| type  | lat     | lng     | priority | name       |
| ----- | ------- | ------- | -------- | ---------- |
| start | 13.0827 | 80.2707 | High     | Warehouse  |
| stop  | 13.1200 | 80.2200 | Medium   | Customer 1 |
| stop  | 13.1500 | 80.2600 | Low      | Customer 2 |

Supported Types:

* start
* stop
* end
* hub

# Installation & Setup 
## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

# Deployment 
## Frontend
Deployed using Vercel.

## Backend
Deployed using Render.

# Future Improvements 
* Traffic-aware routing
* Driver tracking
* AI-based ETA prediction
* Database integration
* Route history and analytics
* Mobile responsive UI

# Live Demo 
Frontend:
https://fleet-planner-jet.vercel.app/
Backend:
https://fleet-planner-96y8.onrender.com

# Author
Manvita Balla

# Note
This project was built for learning, experimentation, and solving real-world logistics optimization problems using AI-inspired techniques and modern full-stack development tools.
