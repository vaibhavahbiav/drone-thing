import { MapContainer, TileLayer, Marker, Polyline, Circle, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";

const droneInside = new L.Icon({ iconUrl: "https://img.icons8.com/?size=100&id=91030&format=png&color=00ff00", iconSize: [22, 22] });
const droneOutside = new L.Icon({ iconUrl: "https://img.icons8.com/?size=100&id=91030&format=png&color=ff0000", iconSize: [22, 22] });
const homeIcon = new L.Icon({ iconUrl: "https://img.icons8.com/?size=100&id=2797&format=png&color=005500", iconSize: [22, 22] });

export default function MapView({ lat, lon, setTelemetry, returnDrone, returningHome }) {
  const HOME = { lat: 26.9239, lon: 75.8267 };
  const GEOFENCE_RADIUS = 200;

  const [path, setPath] = useState([]);
  const [logs, setLogs] = useState([]);
  const [outside, setOutside] = useState(false);
  const [target, setTarget] = useState(null);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (!returningHome) setTarget({ lat: e.latlng.lat, lon: e.latlng.lng });
      },
    });
    return null;
  }

  useEffect(() => {
    if (!target) return;

    const dx = target.lat - lat;
    const dy = target.lon - lon;

    const step = returningHome ? 0.05 : 0.001;

    if (Math.abs(dx) < 0.00005 && Math.abs(dy) < 0.00005) {
      setTarget(null);
      return;
    }

    const newLat = lat + dx * step;
    const newLon = lon + dy * step;

    setTelemetry((t) => ({ ...t, gps: { lat: newLat, lon: newLon }, speed: 10 }));
  }, [lat, lon, target, returningHome, setTelemetry, HOME.lat, HOME.lon, outside]);

  useEffect(() => {
  const dist = getDistance(lat, lon, HOME.lat, HOME.lon);
  const isOutside = dist > GEOFENCE_RADIUS;

  if (isOutside && !outside) {
    setLogs((prev) => [...prev, { time: new Date(), type: "EXIT", lat, lon }]);
  }
  if (!isOutside && outside) {
    setLogs((prev) => [...prev, { time: new Date(), type: "ENTER", lat, lon }]);
  }

  setOutside(isOutside);
  // keep all points
  setPath((prev) => [...prev, [lat, lon]]);
}, [lat, lon, HOME.lat, HOME.lon, outside]);

  return (
    <div className="bg-stone-700 px-1 pb-1 pt-3 mt-6 font-mono flex flex-col relative">
      <h2 className="text-lg xl:text-xl text-stone-200">Drone Location</h2>

      <div className="absolute top-2 right-1 lg:top-1 lg:right-1 z-50">
        <button
          className="bg-yellow-400 px-3 py-1 text-sm lg:text-base text-stone-900 font-thin hover:font-normal"
          onClick={returnDrone}
        >
          Return Home
        </button>
      </div>

      <MapContainer center={[lat, lon]} zoom={16} style={{ height: "400px", width: "100%" }}>
        <ClickHandler />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[lat, lon]} icon={outside ? droneOutside : droneInside}>
          <Popup>
            Drone<br />
            Lat: {lat.toFixed(5)}<br />
            Lon: {lon.toFixed(5)}<br />
            {outside && <strong className="text-red-500">OUTSIDE</strong>}
          </Popup>
        </Marker>

        <Marker position={[HOME.lat, HOME.lon]} icon={homeIcon}>
          <Popup>Home</Popup>
        </Marker>

        <Polyline positions={path} color="lime" weight={2} />

        <Circle
          center={[HOME.lat, HOME.lon]}
          radius={GEOFENCE_RADIUS}
          pathOptions={{ color: outside ? "red" : "lime", fillColor: outside ? "red" : "green", fillOpacity: 0.15 }}
        />

      </MapContainer>

      <div className="bg-stone-800 mt-3 px-1 pb-1 pt-3 font-mono">
        <h3 className="font-semibold mb-2 text-stone-200 text-lg">Geofence Logs:</h3>
        <div className="max-h-40 overflow-y-auto text-sm">
          {logs.length === 0 && <p className="italic text-stone-300">---No entries yet---</p>}
          {logs.map((v, i) => (
            <p key={i} className={v.type === "EXIT" ? "text-rose-400 font-semibold" : "text-lime-400 font-semibold"}>
              -- {v.time.toLocaleTimeString()}: {v.type} at ({v.lat.toFixed(5)}, {v.lon.toFixed(5)})
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
