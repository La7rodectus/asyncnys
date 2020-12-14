'use strict';
/* eslint-disable max-len */
const debug = true;

const http = require('http');
const WebSocket = require('ws');
const Room = require('./room_class');
const User = require('./user_class');

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
});

server.listen(PORT, () => {
  console.log(`Listen port ${PORT}`);
});

//storage
let countConnections = 0;
let countRooms = 0;
const rooms = [];
const roomsID = [];
const users = [];
const useduID = [];

///////// util

function uIDGenerator() {
  const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c, r) => ('x' === c ? (r = Math.random() * 16 | 0) : (r & 0x3 | 0x8)).toString(16));
  let alreadyExists = true;
  while (alreadyExists) {
    const uID = uid();
    if (!useduID.includes(uID)) {
      alreadyExists = false;
      useduID.push(uID);
      return uID;
    }
  }
}

function printServStats() {
  console.log(` users - ${countConnections} \n rooms - ${rooms.lenght}`);
}

if (debug) setInterval(() => {
  printServStats();
}, 3000);

////////

//WebSocket
const ws = new WebSocket.Server({ server });

ws.on('connection', (socket, req) => {
  const ip = req.socket.remoteAddress;
  if (debug) console.log(`Connected ${ip}`);

  const uID = uIDGenerator();
  users.push(new User(uID, socket.id));
  if (debug) console.log(users[0].uID);

  socket.on('conectToRoom', data => {
    if (debug) console.log('socket: conectToRoom');
    socket.join(data.room);
    if (debug) console.log(`connected: ${countConnections} ${JSON.stringify(data)}`);
  });

  socket.on('message', message => {
    console.log('Received: ' + message);
    for (const client of ws.clients) {
      if (client.readyState !== WebSocket.OPEN) continue;
      if (client === socket) continue;
      client.send(message);
    }
  });

  socket.on('close', () => {
    console.log(`Disconnected ${ip}`);
    countConnections--;
  });

  countConnections++;
});

