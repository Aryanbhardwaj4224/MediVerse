"""
Smart Hospital Map — Flask UI + /route API (Dijkstra).
Run: pip install -r hospital_map_requirements.txt && python hospital_map_app.py
Then open VitalWeave Nexus; iframe points to http://127.0.0.1:8000/ by default.
"""
from flask import Flask, jsonify, request, render_template_string
import heapq

app = Flask(__name__)

# ---------------- GRAPH ---------------- #
graph = {
    "Reception": {"OPD": 1, "Radiology": 1},
    "OPD": {"Reception": 1, "Seating": 1, "Lab": 1},
    "Seating": {"OPD": 1, "Neurology": 1, "ICU": 1},
    "Neurology": {"Seating": 1, "General Ward": 1},
    "General Ward": {"Neurology": 1, "Emergency Ward": 1},
    "Emergency Ward": {"General Ward": 1},
    "Radiology": {"Reception": 1, "ENT": 1},
    "Lab": {"OPD": 1, "Orthopedic": 1},
    "ICU": {"Seating": 1, "OT": 1, "Medical Shop": 1},
    "ENT": {"Radiology": 1, "Pediatrics": 1},
    "Orthopedic": {"Lab": 1, "OT": 1},
    "OT": {"Orthopedic": 1, "Delivery": 1},
    "Delivery": {"OT": 1, "Neonatal": 1},
    "Neonatal": {"Delivery": 1},
    "Pediatrics": {"ENT": 1},
    "Medical Shop": {"ICU": 1},
}


def dijkstra(graph, start, end):
    if start not in graph or end not in graph:
        return []
    if start == end:
        return [start]

    pq = [(0, start)]
    distances = {node: float("inf") for node in graph}
    distances[start] = 0
    parent = {}

    while pq:
        dist, node = heapq.heappop(pq)
        if dist != distances[node]:
            continue
        if node == end:
            break
        for neighbor in graph[node]:
            new_dist = dist + graph[node][neighbor]
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                parent[neighbor] = node
                heapq.heappush(pq, (new_dist, neighbor))

    if distances[end] == float("inf"):
        return []

    path = []
    current = end
    while current != start:
        path.append(current)
        current = parent.get(current)
        if current is None:
            return []
    path.append(start)
    path.reverse()
    return path


@app.route("/route")
def get_route():
    start = request.args.get("start")
    end = request.args.get("end")
    if not start or not end:
        return jsonify([])
    path = dijkstra(graph, start, end)
    return jsonify(path)


@app.route("/")
def home():
    return render_template_string(
        """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Smart Hospital Map</title>
    <style>
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #2d2d2d;
        }
        .map-wrapper {
            position: relative;
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            height: 100%;
            min-height: 520px;
            max-height: 600px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .controls {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            background: white;
            padding: 10px 18px;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            gap: 12px;
            align-items: center;
            justify-content: center;
            max-width: 96%;
            width: max-content;
            z-index: 10;
        }
        .controls h3 { margin: 0; font-size: 15px; color: #202124; }
        .input-group { display: flex; align-items: center; gap: 6px; }
        .input-group label { font-size: 12px; color: #5f6368; font-weight: bold; }
        select {
            padding: 6px 10px;
            font-size: 13px;
            border-radius: 6px;
            border: 1px solid #dadce0;
            background: #f1f3f4;
            color: #202124;
            min-width: 120px;
            cursor: pointer;
        }
        button.nav-btn {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
            white-space: nowrap;
        }
        button.nav-btn:hover { background-color: #1557b0; }
        #map {
            display: block;
            width: 100%;
            height: auto;
            max-height: 600px;
            background-color: #ebeae4;
        }
    </style>
</head>
<body>

<div class="map-wrapper">
    <div class="controls">
        <h3>Nav</h3>
        <div class="input-group">
            <label>Start:</label>
            <select id="start"></select>
        </div>
        <div class="input-group">
            <label>End:</label>
            <select id="end"></select>
        </div>
        <button type="button" class="nav-btn" onclick="getRoute()">Get Directions</button>
    </div>
    <canvas id="map" width="800" height="600"></canvas>
</div>

<script>
const nodes = [
    "Reception","OPD","Seating","Neurology","General Ward","Emergency Ward",
    "Radiology","Lab","ICU","Medical Shop",
    "ENT","Orthopedic","OT","Delivery","Neonatal","Pediatrics"
];

const edges = [
    ["Reception", "OPD"], ["Reception", "Radiology"],
    ["OPD", "Seating"], ["OPD", "Lab"],
    ["Seating", "Neurology"], ["Seating", "ICU"],
    ["Neurology", "General Ward"], ["General Ward", "Emergency Ward"],
    ["Radiology", "ENT"], ["Lab", "Orthopedic"],
    ["ICU", "OT"], ["ICU", "Medical Shop"],
    ["ENT", "Pediatrics"], ["Orthopedic", "OT"],
    ["OT", "Delivery"], ["Delivery", "Neonatal"]
];

const positions = {
    "Reception": [150, 150], "OPD": [300, 150], "Seating": [450, 150],
    "Neurology": [600, 150], "General Ward": [750, 150], "Emergency Ward": [750, 280],
    "Radiology": [150, 280], "Lab": [300, 280], "ICU": [450, 280],
    "Medical Shop": [600, 280],
    "ENT": [150, 410], "Orthopedic": [300, 410], "OT": [450, 410],
    "Delivery": [600, 410], "Neonatal": [750, 410],
    "Pediatrics": [150, 540]
};

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

function populateDropdowns(){
    const start = document.getElementById("start");
    const end = document.getElementById("end");
    start.innerHTML = "";
    end.innerHTML = "";
    nodes.forEach(n => {
        start.innerHTML += `<option value="${n}">${n}</option>`;
        end.innerHTML += `<option value="${n}">${n}</option>`;
    });
    end.value = "Emergency Ward";
}

function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawMap(){
    ctx.clearRect(0, 0, 800, 600);

    ctx.strokeStyle = "#dadce0";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 24;
    ctx.beginPath();
    edges.forEach(edge => {
        let [x1, y1] = positions[edge[0]];
        let [x2, y2] = positions[edge[1]];
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    });
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 20;
    ctx.beginPath();
    edges.forEach(edge => {
        let [x1, y1] = positions[edge[0]];
        let [x2, y2] = positions[edge[1]];
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    });
    ctx.stroke();

    for(let node in positions){
        let [x,y] = positions[node];
        let boxWidth = 90;
        let boxHeight = 44;
        let rectX = x - (boxWidth / 2);
        let rectY = y - (boxHeight / 2);

        ctx.fillStyle = "#fce8b2";
        drawRoundedRect(rectX, rectY, boxWidth, boxHeight, 4);
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = "#e0c98b";
        ctx.stroke();

        ctx.fillStyle = "#3c4043";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let words = node.split(" ");
        if(words.length > 1 && node.length > 9) {
            ctx.fillText(words[0], x, y - 6);
            ctx.fillText(words[1], x, y + 8);
        } else {
            ctx.fillText(node, x, y);
        }
    }
}

function getPathMidpoint(path) {
    if (path.length < 2) return positions[path[0]];
    let totalLength = 0;
    let segments = [];
    for(let i = 0; i < path.length - 1; i++){
        let [x1, y1] = positions[path[i]];
        let [x2, y2] = positions[path[i+1]];
        let length = Math.hypot(x2 - x1, y2 - y1);
        segments.push({x1, y1, x2, y2, length});
        totalLength += length;
    }
    let targetDistance = totalLength / 2;
    let traveled = 0;
    for (let seg of segments) {
        if (traveled + seg.length >= targetDistance) {
            let segmentRatio = (targetDistance - traveled) / seg.length;
            let midX = seg.x1 + segmentRatio * (seg.x2 - seg.x1);
            let midY = seg.y1 + segmentRatio * (seg.y2 - seg.y1);
            return [midX, midY];
        }
        traveled += seg.length;
    }
    return positions[path[0]];
}

function drawGooglePin(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-16, -20, -16, -36, 0, -36);
    ctx.bezierCurveTo(16, -36, 16, -20, 0, 0);
    ctx.fillStyle = "#EA4335";
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.arc(0, -24, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -24, 2, 0, Math.PI * 2);
    ctx.fillStyle = "#A50E0E";
    ctx.fill();
    ctx.restore();
}

function buildPathLine(path) {
    ctx.beginPath();
    let ok = false;
    for (let i = 0; i < path.length; i++) {
        const pt = positions[path[i]];
        if (!pt) continue;
        const [x, y] = pt;
        if (!ok) {
            ctx.moveTo(x, y);
            ok = true;
        } else {
            ctx.lineTo(x, y);
        }
    }
    return ok;
}

function drawPath(path){
    if (!path || path.length === 0) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    /* Red route: soft halo + bold center line (matches “shortest path in red”) */
    ctx.strokeStyle = "rgba(220, 38, 38, 0.35)";
    ctx.lineWidth = 22;
    if (buildPathLine(path)) ctx.stroke();

    ctx.strokeStyle = "rgba(239, 68, 68, 0.95)";
    ctx.lineWidth = 12;
    if (buildPathLine(path)) ctx.stroke();

    ctx.strokeStyle = "#b91c1c";
    ctx.lineWidth = 7;
    if (buildPathLine(path)) ctx.stroke();

    let [startX, startY] = positions[path[0]];
    let [endX, endY] = positions[path[path.length - 1]];
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = "#22c55e";
    ctx.beginPath(); ctx.arc(startX, startY, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#dc2626";
    ctx.beginPath(); ctx.arc(endX, endY, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    if (path.length > 1) {
        let [midX, midY] = getPathMidpoint(path);
        drawGooglePin(midX, midY);
    }
}

/** When embedded via Vite proxy (/hospital-map/), API is /hospital-map/route — not /route */
function routeApiBase() {
    const p = window.location.pathname || "";
    if (p === "/hospital-map" || p.startsWith("/hospital-map/")) return "/hospital-map";
    return "";
}

async function getRoute(){
    drawMap();
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;
    try {
        const prefix = routeApiBase();
        const url = prefix + "/route?start=" + encodeURIComponent(start) + "&end=" + encodeURIComponent(end);
        let res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        let path = await res.json();
        if (Array.isArray(path) && path.length > 0) drawPath(path);
    } catch(err) {
        console.error("Error fetching route:", err);
    }
}

populateDropdowns();
drawMap();
</script>
</body>
</html>
"""
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False, use_reloader=False)
