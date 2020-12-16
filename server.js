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

const ws = new WebSocket.Server({ server });

//storage
let countConnections = 0;
let countRooms = 0;
const rooms = [];
const roomsID = [];
const users = [];
const usedID = [];

///////// util
function printServStats() {
  console.log(` connections - ${countConnections} \n rooms - ${rooms.lenght} \n roomsID - ${countRooms}`);
}

if (debug) setInterval(() => {
  printServStats();
}, 2000);
////////

//func
function iDGenerator() {
  const uid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c, r) => ('x' === c ? (r = Math.random() * 16 | 0) : (r & 0x3 | 0x8)).toString(16));
  let alreadyExists = true;
  while (alreadyExists) {
    const uID = uid();
    if (!usedID.includes(uID)) {
      alreadyExists = false;
      usedID.push(uID);
      return uID;
    }
  }
}

function broadcast(socket, room, event) {
  for (const client of ws.clients) {
    //if (!room.users.includes(client.id)) continue;
    if (client.readyState !== WebSocket.OPEN) continue;
    //if (client === socket) continue;
    const message = JSON.stringify({ 'message': 'broadcast', event });
    client.send(message);
  }
}

//socket events
function disconnect(socket) {
  const userIndex = users.findIndex(item => item.socketID === socket.id);
  const uidIndex = usedID.indexOf[users.uID];
  users.splice(userIndex, 1);
  usedID.splice(uidIndex, 1);
  countConnections--;
  rooms.forEach((room, i) => {
    if (room.nullUsers()) {
      rooms.splice(i, 1);
      countRooms--;
    }
  });
}

function conectUserToRoom(socket, data) {
  if (debug) console.log('socket: conectToRoom');
  console.log(rooms);
  let room = rooms.find(item => item.name === data.room);
  if (room) {
    room.addUser(socket, data.name);
    broadcast(socket, room, 'pause');

    if (room.share !== null) socket.emit('share', room.share);
    if (room.usersLength > 1 && room.timeUpdated !== null) {
      room.event.currentTime =
        room.event.type === 'play' ?
          room.event.currentTime + (Date.now() - room.timeUpdated) / 1000 :
          room.event.currentTime;
      // Time is about second earlier then needed
    }
  } else {
    room = new Room(data.room, iDGenerator());
    countRooms++;
    room.addUser(socket, data.name);
    rooms.push(room);
    roomsID[room.roomID] = room;
  }
  const message = JSON.stringify({
    'message': 'usersList',
    list: room.getUsersNames()
  });
  socket.send(message);
  console.log(rooms);
  console.log(room);
  if (debug) console.log(`connected to room: ${countConnections} ${JSON.stringify(data)}`);
}

//socket events switch
function serverSocketEventsSwitch(socket, message) {
  const parsedMSG = JSON.parse(message);
  switch (parsedMSG.message) {
    //background.js
    case 'conectToRoom':
      conectUserToRoom(socket, parsedMSG.data);
      break;
    case 'error':
      console.error(parsedMSG);
      break;
    default:
      console.log(message);
      break;
  }
}

//WebSocket
ws.on('connection', (socket, req) => {
  const ip = req.socket.remoteAddress;
  if (debug) console.log(`Connected ${ip}, ${req.url}`);

  const uID = iDGenerator();
  users.push(new User(uID, socket));
  if (debug) console.log(users[countConnections].uID);
  const message = JSON.stringify({ 'message': 'uid', uID });
  socket.send(message);

  socket.on('message', message => {
    console.log('Received: ' + message);
    serverSocketEventsSwitch(socket, message);
  });

  socket.on('close', () => {
    console.log(`disconnected ${ip}`);

    disconnect(socket);
  });

  countConnections++;
});

