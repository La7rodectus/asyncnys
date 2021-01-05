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
  console.log(' connections - ' + countConnections + '\n rooms - ' + rooms + '\n roomsID - ' + roomsID + '\n usedID - ' + usedID);
}

if (debug) setInterval(() => {
  printServStats();
}, 5000);
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

function deepEqualObj(obj1, obj2) {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return false;
  }
  if (obj1 === undefined || obj2 === undefined) {
    return false;
  }
  if (obj1 === null || obj2 === null) {
    return false;
  }
  const obj1Keys = Object.keys(obj1);
  const obj2Keys = Object.keys(obj2);
  if (obj1Keys.length !== obj2Keys.length) {
    return false;
  }
  for (let i = 0; i < obj1Keys.length; i++) {
    if (obj2Keys.includes(obj1Keys[i]) === false) {
      return false;
    }
  }
  for (let i = 0; i < obj1Keys.length; i++) {
    if (typeof obj1[obj1Keys[i]] === 'object') {
      return deepEqualObj(obj1[obj1Keys[i]], obj2[obj1Keys[i]]);
    }
    if (obj1[obj1Keys[i]] !== obj2[obj2Keys[i]]) {
      return false;
    }
  }
  return true;
}

function broadcast(socket, room, event, selfCast = false) {
  room.event = event;
  const roomClients = room.getSocketsArr();
  for (const client of roomClients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    if (client === socket && !selfCast) continue;
    console.log(event);
    const msg = JSON.stringify({ 'message': 'broadcast', event });
    client.send(msg);
  }
}

function getRoomByUser(user) {
  for (const room of rooms) {
    const roomUsers = room.getUsers();
    for (const RoomUser of roomUsers) {
      if (RoomUser.name === user.name) {
        return room;
      }
    }
  }
}

//socket events
function disconnect(socket, user) {
  const userIndex = users.findIndex(item => item.uID === user.uid);
  const uidIndex = usedID.findIndex(item => item === user.uid);
  users.splice(userIndex, 1);
  usedID.splice(uidIndex, 1);
  countConnections--;
  rooms.forEach((room, i) => {
    if (room.nullUsers()) {
      delete roomsID[room.getRoomID];
      rooms.splice(i, 1);
      countRooms--;
    }
  });
  socket.close();
  console.log('rooms stats');
  console.log(users);
  console.dir(rooms);
}

function disconnectFromRoom(socket, user) {
  const room = getRoomByUser(user);
  room.disconnectUser(user.name);
  const event = {
    'type': 'usersList',
    videoTime: room.event.videoTime,
    list: room.getUsersNames()
  };
  broadcast(socket, room, event);
  rooms.forEach((room, i) => {
    if (room.nullUsers()) {
      delete roomsID[room.getRoomID()];
      const roomIDIndex = usedID.findIndex(item => item === room.getRoomID());
      usedID.splice(roomIDIndex, 1);
      rooms.splice(i, 1);
      countRooms--;
    }
  });
  console.log('rooms stats');
  console.dir(rooms);
  console.dir(roomsID);
}

function conectUserToRoom(socket, data) {
  if (debug) console.log('socket: conectToRoom');
  let room = rooms.find(item => item.name === data.room);
  if (room) {
    room.addUser(socket, data.name);
    room.event = {
      'type': 'pause',
      videoTime: data.videoTime,
    };
    broadcast(socket, room, room.event, true);
    if (room.share !== null) socket.emit('share', room.share);
  } else {
    room = new Room(data.room, iDGenerator());
    countRooms++;
    room.addUser(socket, data.name);
    rooms.push(room);
    roomsID[room.roomID] = room;
  }
  room.event = {
    'type': 'usersList',
    videoTime: data.videoTime,
    list: room.getUsersNames(),
  };
  broadcast(socket, room, room.event, true);
  console.log(rooms);
  console.log(room);
  if (debug) console.log(`connected to room: ${countConnections} ${JSON.stringify(data)}`);
}

//socket events switch
function serverSocketEventsSwitch(socket, message) {
  const parsedMSG = JSON.parse(message);
  switch (parsedMSG.message) {
    case 'conectToRoom':
      conectUserToRoom(socket, parsedMSG.data);
      break;
    case 'disconnect':
      disconnectFromRoom(socket, parsedMSG.user);
      disconnect(socket, parsedMSG.user);
      break;
    case 'broadcast':
      broadcast(socket, getRoomByUser(parsedMSG.user), { 'type': parsedMSG.eventType, 'videoTime': parsedMSG.videoTime });
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
  const message = JSON.stringify({ 'message': 'uid', uID });
  socket.send(message);

  socket.on('message', message => {
    console.log('Received: ' + message);
    serverSocketEventsSwitch(socket, message);
  });

  socket.on('close', () => {
    console.log(`disconnected ${ip}`);

  });

  countConnections++;
});
