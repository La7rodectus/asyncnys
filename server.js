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
  console.log(' connections - ' + countConnections + '\n rooms - ' + rooms.length/* + '\n roomsID - ' + roomsID + '\n usedID - ' + usedID*/);
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

function isUsernameAvailable(UserName) {
  const allUsernames = [];
  for (const user of users) {
    if (user.name) allUsernames.push(user.name);
  }
  if (allUsernames.includes(UserName)) return false;
  return true;
}

function throwError(socket, error) {
  const err = JSON.stringify({
    'message': 'error',
    error,
  });
  socket.send(err);
}

// fix heroku router 55sec limit
function keepConnectionsAlive() {
  setInterval(() => {
    for (const client of ws.clients) {
      const msg = JSON.stringify({ 'message': 'ping' });
      client.send(msg);
    }
  }, 15000);
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
  console.log(user);
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
  const userIndex = users.findIndex(item => item.uid === user.uid);
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
  console.log('rooms stats after disconnection');
  console.log(users);
  console.dir(rooms);
}

function disconnectFromRoom(socket, user) {
  console.log(rooms);
  console.log(users);
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
}

function conectUserToRoom(socket, data) {
  console.log('socket: conectToRoom');
  console.log(data);
  if (!isUsernameAvailable(data.user.name)) {
    throwError(socket, 'This username (' + data.user.name + ') already exists');
    disconnect(socket, data.user);
    return;
  }
  let room = rooms.find(item => item.name === data.user.room);
  const uid = data.user.uid;
  const user = users.find(user => user.uid === uid);
  console.log(user);
  if (room) {
    user.setName(data.user.name);
    room.addUser(socket, user.name);
    room.event = {
      'type': 'pause',
      videoTime: data.videoTime,
    };
    broadcast(socket, room, room.event, true);
  } else {
    user.setName(data.user.name);
    user.setRoom(data.user.room);
    room = new Room(user.room, iDGenerator());
    room.shareURL = data.sharedSiteURL;
    countRooms++;
    room.addUser(socket, user.name);
    rooms.push(room);
    roomsID[room.roomID] = room;
  }
  const shareEvent = {
    'type': 'share',
    shareURL: room.shareURL,
  };
  broadcast(socket, room, shareEvent, true);
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
      console.log('No socket event handler for: ' + message);
      break;
  }
}

//WebSocket
ws.on('connection', (socket, req) => {
  const ip = req.socket.remoteAddress;
  if (debug) console.log(`Connected ${ip}, ${req.url}`);


  const uid = iDGenerator();
  users.push(new User(uid, socket));
  const message = JSON.stringify({ 'message': 'uid', uid });
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

keepConnectionsAlive(); // fix heroku router 55sec limit
