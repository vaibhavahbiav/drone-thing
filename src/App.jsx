import React, { useEffect, useRef, useState } from "react";
import WebRTCMock from "./WebRTCMock";
import MapView from "./MapView";

export default function App() {
  const HOME = { lat: 26.9239, lon: 75.8267 };

  const [telemetry, setTelemetry] = useState({
    altitude: 200,
    speed: 0,
    battery: 90,
    gps: { lat: HOME.lat, lon: HOME.lon },
    jitter: 0,
  });

  const [connected, setConnected] = useState(false);
  const [zeroTierEnabled, setZeroTierEnabled] = useState(false);
  const [target, setTarget] = useState(null);
  const [returningHome, setReturningHome] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);

  const moveIntervalRef = useRef(null);

  function haversineMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // movement speed and battery drain
  useEffect(() => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }

    if (!connected) return;

    const speedMetersPerSec = 10;
    const tickMs = 100;
    const stepMeters = (speedMetersPerSec * tickMs) / 1000;

    moveIntervalRef.current = setInterval(() => {
      setTelemetry((prev) => {
        const curLat = prev.gps.lat;
        const curLon = prev.gps.lon;
        let newLat = curLat;
        let newLon = curLon;
        let newSpeed = 0;
        // let newTarget = target;

        if (target) {
          const dst = haversineMeters(curLat, curLon, target.lat, target.lon);

          if (dst <= stepMeters) {
            const reachedHome = target.lat === HOME.lat && target.lon === HOME.lon;

            // newTarget = null;
            setTarget(null);
            newLat = target.lat;
            newLon = target.lon;
            newSpeed = 0;

            // drone returing
            if (returningHome) setReturningHome(false);

            // disconnect only when DISCONNECT button used
            if (pendingDisconnect && reachedHome) {
              setConnected(false);
              setPendingDisconnect(false);
            }
          } else {
            // normalized direction vector for constant-speed movement
            const dx = target.lat - curLat;
            const dy = target.lon - curLon;

            const nx = dx / dst;
            const ny = dy / dst; 

            // move by a fixed step
            newLat = curLat + nx * stepMeters;
            newLon = curLon + ny * stepMeters;

            // ACTUAL SPEED CALCULATION
            const moved = haversineMeters(curLat, curLon, newLat, newLon);
            newSpeed = moved / (tickMs / 1000); 
          }
        }


        // battery drain behaviour, stationary and moving
        const batteryDrain = target ? 0.02 : 0.005;
        const newBattery = Math.max(0, prev.battery - batteryDrain);

        return {
          ...prev,
          gps: { lat: newLat, lon: newLon },
          speed: newSpeed,
          battery: newBattery,
          jitter: zeroTierEnabled ? 10 : Math.random() * 120,
        };
      });
    }, tickMs);

    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    };
  }, [connected, target, returningHome, HOME.lat, HOME.lon, pendingDisconnect, zeroTierEnabled]);

  // jitter network
  useEffect(() => {
    if (!connected) return;

    const jitterInterval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        jitter: zeroTierEnabled ? 10 : Math.random() * 120,
      }));
    }, 1000);

    return () => clearInterval(jitterInterval);
  }, [connected, zeroTierEnabled]);

  // disconnect
  useEffect(() => {
    if (!connected) {
      setTarget(null);
      setReturningHome(false);
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
    }
  }, [connected]);

  function handleConnectButton() {
    if (connected) {
      // return home but no disconnect
      setPendingDisconnect(true);
      setReturningHome(true);
      setTarget({ lat: HOME.lat, lon: HOME.lon });
    } else {
      // connect
      setConnected(true);
      setReturningHome(false);
      setPendingDisconnect(false);
      setTarget(null);
    }
  }

  // return home
  function returnDrone() {
    if (connected && telemetry.speed < 0.5) {
      setReturningHome(true);
      setTarget({ lat: HOME.lat, lon: HOME.lon });
    }
  }

  return (
    <div className="min-h-screen px-5 lg:px-7 pt-10 bg-stone-900 tracking-widest font-mono">
      <div className="text-3xl lg:text-5xl text-center tracking-widest flex items-center justify-center">
        <h1 className="bg-stone-500 px-5 py-1 lg:px-9 lg:py-3 text-stone-200 border-l-8 border-t border-r-8 border-b-8 border-stone-700">
          MAVLink GCS &#91;simulation&#93;
        </h1>
      </div>

      <div className="mt-24 flex items-center justify-center space-x-7 text-stone-900">
        <button
          className={`px-5 py-3 border-l-4 border-t border-r-4 border-b-4 w-[160px] active:scale-95 hover:font-semibold ${connected
            ? "bg-rose-600 border-rose-800 shadow-lg shadow-rose-500"
            : "bg-lime-600 border-lime-800 shadow-lg shadow-lime-500"
            }`}
          onClick={() => setTimeout(() => handleConnectButton(), 300)}
        >
          {returningHome ? "Returning..." : connected ? "Disconnect" : "Connect"}
        </button>

        <button
          className={`md:hidden px-3 py-3 border-l-4 border-t border-r-4 border-b-4 min-w-[110px] active:scale-95 hover:font-semibold ${zeroTierEnabled ? "bg-violet-600 border-violet-800" : "bg-stone-700 border-stone-800"
            }`}
          onClick={() => setZeroTierEnabled(!zeroTierEnabled)}
        >
          VPN: {zeroTierEnabled ? "ON" : "OFF"}
        </button>

        <button
          className={`hidden md:block px-5 py-3 border-l-4 border-t border-r-4 border-b-4 w-[240px] active:scale-95 hover:font-semibold ${zeroTierEnabled ? "bg-violet-600 border-violet-800" : "bg-stone-700 border-stone-800"
            }`}
          onClick={() => setZeroTierEnabled(!zeroTierEnabled)}
        >
          ZeroTier VPN: {zeroTierEnabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6 text-stone-200 font-light text-sm md:text-lg">
        <span className="px-3 py-1 md:px-5 md:py-3 bg-stone-800">
          Altitude {connected ? telemetry.altitude + 'm' : "_"}
        </span>
        <span className="px-3 py-1 md:px-5 md:py-3 bg-stone-800">
          Speed {connected ? (telemetry.speed > 0.1 ? telemetry.speed.toFixed(1) + 'm/s' : '0 m/s') : '_'}
        </span>
        <span className={`px-3 py-1 md:px-5 md:py-3 bg-stone-800 ${telemetry.battery < 10 ? "text-rose-500" : "text-white"
          }`}>
          Battery {telemetry.battery < 10 ? "!!" : ""}{connected ? telemetry.battery.toFixed(1) + '%' : '_'}
          <span className={`${connected ? "inline-block animate-pulse ml-1" : "hidden"}`}>&#8595;</span>
        </span>
        <span className="px-3 py-1 md:px-5 md:py-3 bg-stone-800">
          Coordinates &#91; {connected ? telemetry.gps.lat.toFixed(5) + ', ' + telemetry.gps.lon.toFixed(5) : '_,_'} &#93;
        </span>
      </div>

      {connected ? (
        <MapView
          lat={telemetry.gps.lat}
          lon={telemetry.gps.lon}
          setTelemetry={setTelemetry}
          returnDrone={returnDrone}
          returningHome={returningHome}
        />
      ) : (
        <div className="text-stone-300 italic bg-stone-700 p-4 mt-6 mb-3">
          --- Connect to view map ---
        </div>
      )}

      <div className={`mt-3 py-1 px-3 bg-stone-500 w-fit min-w-[200px] md:min-w-[400px] text-sm lg:text-base ${connected ? "block" : "hidden"}`}>
        <div className="flex flex-col space-y-3 md:block">
          Network jitter: <span>{telemetry.jitter?.toFixed(0)} ms
            <span className={`ml-1 md:ml-2 text-sm px-1 py-1 md:px-3 md:py-1 max-w-fit ${zeroTierEnabled ? "bg-violet-600" : "animate-pulse bg-stone-200"}`}>
              ({zeroTierEnabled ? "Stable VPN" : "unstable"})
            </span>
          </span>
        </div>
      </div>

      <WebRTCMock connected={connected} />

      <footer className="pb-1 mt-5 lg:mt-7 text-right text-xs lg:text-sm text-stone-200">
        made by vaibhav and mostly internet
      </footer>
    </div>
  );
}
