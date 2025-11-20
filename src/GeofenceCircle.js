import { Circle } from "react-leaflet";
import { useEffect, useState } from "react";

export default function GeofenceCircle({ lat, lon }) {
  const GEOFENCE = { lat: 26.9239, lon: 75.8267, radius: 200 };
  const [inside, setInside] = useState(true);

  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  useEffect(() => {
    const dist = getDistance(lat, lon, GEOFENCE.lat, GEOFENCE.lon);
    setInside(dist <= GEOFENCE.radius);
  }, [lat, lon]);

  return (
    <>
      <Circle
        center={[GEOFENCE.lat, GEOFENCE.lon]}
        radius={GEOFENCE.radius}
        pathOptions={{ color: inside ? "lime" : "red", fillColor: inside ? "green" : "red", fillOpacity: 0.3 }}
      />
      {!inside && (
        <div className="mt-4 p-3 bg-red-700 text-white rounded-lg">
          !Drone is OUTSIDE the geofence!
        </div>
      )}
    </>
  );
}
