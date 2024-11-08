const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let connectedClients = []; // Track unique clients by role

io.on("connection", (socket) => {
  console.log(`New connection attempt: ${socket.id}`);

  // Listen for 'join' event to get client role
  socket.on("join", (data) => {
    const clientExists = connectedClients.some(
      (client) => client.role === data.role && client.id === socket.id
    );

    if (!clientExists) {
      connectedClients.push({ id: socket.id, role: data.role });
      console.log(`New ${data.role} connected: ${socket.id}`);
    }
  });

  socket.on("driverLocation", (data) => {
    console.log(
      `Received location from ${data.username}: ${data.latitude}, ${data.longitude}`
    );
    io.emit("driverLocation", data); // Emit to all connected clients
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Remove client from connectedClients
    connectedClients = connectedClients.filter(
      (client) => client.id !== socket.id
    );
  });
});

// Route to display connected drivers and students
app.get("/", (req, res) => {
  const driverClients = connectedClients.filter(
    (client) => client.role === "driver"
  );
  const studentClients = connectedClients.filter(
    (client) => client.role === "student"
  );

  const responseHTML = `
    <h1>Server Status</h1>
    <h2>Connected Drivers</h2>
    <ul>
      ${driverClients
        .map((client) => `<li>ID: ${client.id}, Role: ${client.role}</li>`)
        .join("")}
    </ul>
    
    <h2>Connected Students</h2>
    <ul>
      ${studentClients
        .map((client) => `<li>ID: ${client.id}, Role: ${client.role}</li>`)
        .join("")}
    </ul>
  `;
  res.send(responseHTML);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
