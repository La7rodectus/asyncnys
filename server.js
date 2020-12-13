'use strict';

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
});

server.listen(PORT, () => {
  console.log(`Listen port ${PORT}`);
});

let countConnections = 0;
let rooms = [];

/////////

function printServStats() {
  console.log(` users - ${countConnections} \n rooms - ${rooms.lenght}`);
}

////////

const ws = new WebSocket.Server({ server });

ws.on('connection', (connection, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Connected ${ip}`);
  connection.on('message', message => {
    console.log('Received: ' + message);
    for (const client of ws.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      if (client === connection) continue;
      client.send(message);
    }
  });
  connection.on('close', () => {
    console.log(`Disconnected ${ip}`);
  });
  printServStats();
});

