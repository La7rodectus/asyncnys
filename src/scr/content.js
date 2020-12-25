'use strict';

/* eslint-disable max-len */
/* eslint-disable no-undef */
const debug = true;

//storage
const user = {
  name: null,
  room: null,
  uid: null,
};

//vars
let status = 'disconnected';
let userslist = [];

// library
function logHref() {
  const windowHref = document.location.href;
  console.log(windowHref);
}

function sendRuntimeMessage(msg, data = null) {
  try {
    const message = { 'message': msg, data };
    chrome.runtime.sendMessage(message);
  } catch (err) {
    if (debug) console.error('can\'t sendRuntimeMessage');
  }
}

function findInFramesSelector(selector, doc) {
  try {
    let hit = doc.querySelector(selector);
    if (hit) return hit;
    const frames = Array.prototype.slice.call(doc.frames);
    for (let i = 0; (i < frames.length) && !hit; i++) {
      try {
        if (!frames[i] || !frames[i].document) continue;
        hit = findInFramesSelector(selector, frames[i].document);
      } catch (err) {
        console.warn('Can\'t fined video element error-> ' + err.name + ': ' + err.message);
      }
    }
    return hit;
  } catch (err) {
    console.warn('Can\'t exec inFrame search error-> ' + err.name + ': ' + err.message);
    return false;
  }

}

function testF() {
  const videoToSync = findInFramesSelector('video', document);
  if (videoToSync) {
    videoToSync.pause();
  }
  console.log(videoToSync);
  logHref();
}

function sendUserToPopup() {
  sendRuntimeMessage('sendUser', user);
}

function sendStatusToPopup(newStatus) {
  if (newStatus !== undefined) status = newStatus;
  sendRuntimeMessage('status', status);
}

function sendShareToPopup(data) {
  if (status === 'connect') {
    if (data !== undefined) share = data;
    sendRuntimeMessage('share', share);
    //chrome.runtime.sendMessage({ from: 'share', data: share });
  }
}

function sendUsersListToPopup() {
  sendRuntimeMessage('sendUsersList', userslist);
}

//WebSocket
const socket = new WebSocket('ws://127.0.0.1:8000/');

socket.onopen = () => {
  console.log('connected');
};

socket.onclose = () => {
  console.log('closed');
};


//WebSocket events
function conectUserToRoom(data) {
  user.name = data.name;
  user.room = data.room;
  socket.send(JSON.stringify({
    from: 'popup',
    message: 'conectToRoom',
    data
  }));
  status = 'connected';
}

function firebroadcast(event) {
  const videoToSync = findInFramesSelector('video', document);
  switch (event) {
    case 'pause':
      videoToSync.pause();
      break;
    case 'play':
      videoToSync.play();
      break;
    default:
      break;
  }
}

function exitRoom() {
  status = 'disconnected';
  userslist = [];
  socket.send(JSON.stringify({
    from: 'popup',
    message: 'disconnect',
    user
  }));
  user.room = null;
}

//WS event Switches
function socketMSGSwitch(message) {
  const parsedMSG = JSON.parse(message);
  console.log('socketMSGSwitch:');
  console.log(parsedMSG);
  switch (parsedMSG.message) {
    case 'usersList':
      userslist = parsedMSG.list;
      break;
    case 'broadcast':
      firebroadcast(parsedMSG.event);
      console.log(message);
      break;
    case 'play':
      user.uid = parsedMSG.uID;
      console.log('user' + JSON.stringify(user));
      break;
    case 'pause':
      user.uid = parsedMSG.uID;
      console.log('user' + JSON.stringify(user));
      break;
    case 'uid':
      user.uid = parsedMSG.uID;
      console.log('user' + JSON.stringify(user));
      break;
    default:
      console.warn(message);
      break;
  }
}

//Runtime Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  console.log('runtimeMSGSwitch:');
  console.log(request);
  switch (message) {
    //background.js
    case 'test_f':
      testF();
      break;
    case 'tabRemoved':
      socket.close();
      break;
    case 'connect_user_to_room':
      conectUserToRoom(request.data);
      break;
    //popup.js
    case 'getUser': {
      sendUserToPopup();
      break;
    }
    case 'getStatus': {
      sendStatusToPopup();
      break;
    }
    case 'getUsersList': {
      sendUsersListToPopup();
      break;
    }
    case 'getShare': {
      sendShareToPopup();
      break;
    }
    case 'disconnect': {
      exitRoom();
      break;
    }
    //any
    case 'debug_log':
      console.log(request.data);
      break;
    case 'error':
      console.error(request);
      break;
    //warn
    default:
      console.warn(message);
      break;
  }
}

//video observer
function onPlaying(event) {
  console.log('onPlaying');
  console.log(event);
  const message = JSON.stringify({ 'message': 'broadcast', user, eventType: 'play' });
  if (socket.readyState === socket.OPEN && user.room) {
    socket.send(message);
  }
}

function onPause(event) {
  console.log('onPause');
  console.log(event);
  const message = JSON.stringify({ 'message': 'broadcast', user, eventType: 'pause' });
  if (socket.readyState === socket.OPEN && user.room) {
    socket.send(message);
  }

}

function onSeeked(event) {
  console.log('onSeeked');
  console.log(event);
  const message = JSON.stringify({ 'message': 'broadcast', user, eventType: 'seeked' });
  if (socket.readyState === socket.OPEN && user.room) {
    socket.send(message);
  }
}

const obsEventsConfig = [
  { event: 'playing', handler: onPlaying },
  { event: 'pause', handler: onPause },
  { event: 'seeked', handler: onSeeked },
];

function addObsEvents(video, obsEventsConfig) {
  for (let i = 0; i < obsEventsConfig.length; i++) {
    video.addEventListener(obsEventsConfig[i].event, obsEventsConfig[i].handler, true);
  }
}

function initVideoObserver(obsEventsConfig) {
  try {
    const videoToSync = findInFramesSelector('video', document);
    if (videoToSync) {
      if (debug) videoToSync.pause();
      addObsEvents(videoToSync, obsEventsConfig);
    }
    if (debug) console.log(videoToSync);
    console.log('video Observed');
  } catch (err) {
    console.log('can\t find or observe video on this page' + err);
  }

}

//video observer init
initVideoObserver(obsEventsConfig);

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  runtimeMSGSwitch(request);
});

socket.onmessage = event => {
  socketMSGSwitch(event.data);
};


