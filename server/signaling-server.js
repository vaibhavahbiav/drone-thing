const { WebSocketServer } = require("ws");
const wss = new WebSocketServer({ port: 9090 });
console.log("Signaling server listening ws://localhost:9090");

wss.on("connection", (ws) => {
  console.log("Client connected");
  ws.on("message", (msg) => {
    // Relay the incoming message to all other clients
    wss.clients.forEach((c) => {
      if (c !== ws && c.readyState === 1) {
        c.send(msg.toString());
      }
    });
  });
  ws.on("close", () => console.log("Client disconnected"));
});
