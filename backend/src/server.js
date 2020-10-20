const express = require("express");
const socketIO = require("socket.io");
const { createServer } = require("http");

const DEFAULT_PORT = 3015;

class Server {
  constructor() {
    this.initialize();
    this.handleRoutes();
    this.handleSocketConnection();
  }

  initialize() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = socketIO(this.httpServer);
  }

  handleRoutes() {
    this.app.get("/", (req, res) => {
      res.send(`<h1>Hello World</h1>`);
    });
  }

  handleSocketConnection() {
    this.io.on("connection", (socket) => {
      console.log("Socket connected");
    });
  }

  listen(cb) {
    this.httpServer.listen(DEFAULT_PORT, () => {
      cb(DEFAULT_PORT);
    });
  }
}

module.exports = Server;
