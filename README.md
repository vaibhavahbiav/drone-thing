___DOCUMENTATION___

to run - npm run start

This is all a simulation for connecting to remote drone and show andgive instructions to it and get a live video feed.

There is also a Stable connection feature to mitigate the signal jitters and give consistent communication channel. It has no effect on the app currently, only an idea/simulation that irregular connection stream can be stabilizd if a feature is used.

The drone's location can be viewed on the map with a geofence boundary limits and a fixed home point for drone.

Drone's activity can be viewed in logs if it interacts witht he geofence boundary, i.e. exiting and then entering.

Drone's telemetry data is being showing as coordinated, speed, altitude and battery. Battery is continuosly draining and faster if drone is moving.

Respectively the speed is shown (constant 10m/s, in this case) and 0 when stationary.

The video feed is local video file.

P.S. - It is heavily mathematics based so I have very little idea how the calculations are being done, other than a faint general understanding why they are being done. I had to rely mostly on internet's help to figure out as I don't have much idea and technologies (or simulated technologies) used in it. So mostly it is rendition of my understandings of those mentioned technologies, of course without using those technologies.

