# AI Fleet Planner

A full-stack smart logistics and route optimization platform that helps users plan, optimize, and visualize delivery routes using interactive maps, vehicle clustering, and multi-stop route sequencing.

## Live Demo

Frontend: Add your deployed Vercel URL here

Backend API: Add your Render backend URL here


# Features

## Core Features

* Multi-stop route optimization
* Interactive map using Leaflet
* Real road routing using OSRM
* Distance and ETA calculation
* Multi-vehicle route clustering
* Excel/CSV upload support
* Round-trip route planning
* Start / Stop / End point management
* Route analytics dashboard
* Export optimized routes to Excel
* Dynamic numbered map markers
* Cross-dock / hub support


# Tech Stack

## Frontend

* React + Vite
* Tailwind CSS
* React Leaflet
* PapaParse
* XLSX
* File Saver
* ML KMeans

## Backend

* FastAPI
* Python
* Requests

## Routing Engine

* OSRM (Open Source Routing Machine)
* OpenStreetMap

## Deployment

* Frontend: Vercel
* Backend: Render
* Source Control: GitHub


# How It Works

1. User uploads delivery stops using Excel/CSV or manually adds points.
2. Stops are clustered into multiple vehicles using K-Means clustering.
3. Routes are optimized using nearest-neighbor route sequencing.
4. Backend fetches real road routes from OSRM.
5. Frontend visualizes optimized routes on an interactive map.
6. Analytics display total distance, ETA, stops, and vehicles.


# Project Structure

```bash
Routing/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── render.yaml
│
└── README.md
```

# Excel / CSV Upload Format

Supported columns:

| type  | lat     | lng     | priority | name       |
| ----- | ------- | ------- | -------- | ---------- |
| start | 13.0827 | 80.2707 | High     | Warehouse  |
| stop  | 13.1200 | 80.2200 | Medium   | Customer 1 |
| stop  | 13.1500 | 80.2600 | Low      | Customer 2 |
| end   | 13.2000 | 80.3000 | Low      | Depot      |

## Supported Types

* start
* stop
* end
* hub


# Installation Guide

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/fleet-planner.git
cd fleet-planner
```

## 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

## 3. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

# Deployment

## Frontend Deployment

Deploy frontend using:

* Vercel
* Netlify

## Backend Deployment

Deploy backend using:

* Render
* Railway
* Fly.io


# Route Types

## One-Way Route

```text
Start → Stops → End
```

## Round Trip Route

```text
Start → Stops → Start
```

# Analytics Dashboard

The application displays:

* Total Stops
* Total Distance
* ETA (Estimated Time)
* Suggested Vehicles
* Vehicle Count


# Algorithms Used

## K-Means Clustering

Used to split delivery stops across multiple vehicles.

## Nearest Neighbor Algorithm

Used for route sequencing and stop optimization.


# Future Improvements

* Authentication & Login
* Driver Assignment
* Live Vehicle Tracking
* Traffic-Aware Routing
* AI ETA Prediction
* Delivery Time Windows
* Route History
* Mobile Responsive UI
* Database Integration
* Admin Dashboard
* Route Replay Animation

# Use Cases

* Logistics Companies
* Delivery Services
* Warehouse Distribution
* Last-Mile Delivery Optimization
* Fleet Management
* Smart Transportation Systems

# Screenshots

* Dashboard
 <img width="1292" height="927" alt="image" src="https://github.com/user-attachments/assets/12ad58a4-e1a7-4d87-9966-6ae96486a139" />

* Route Visualization
  <img width="1095" height="923" alt="image" src="https://github.com/user-attachments/assets/b3d25727-3a23-4e99-ab78-cc29559e588b" />

# Author

Manvita Balla

# License

This project is developed for educational purposes.


# Acknowledgements

* OpenStreetMap
* OSRM
* React Leaflet
* FastAPI
* Vercel
* Render
