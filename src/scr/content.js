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
let socket = undefined;
let videoToSync = null;

// library
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

function updatePopupData() {
  sendShareToPopup('url');
  sendStatusToPopup(status);
  sendUserToPopup();
  sendUsersListToPopup();
}

//Runtime Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  console.log('runtimeMSGSwitch:');
  console.log(request);
  switch (message) {
    //background.js
    case 'connect_user_to_room':
      conectUserToRoom(request.data);
      break;
    //popup.js
    case 'updatePopup': {
      updatePopupData();
      break;
    }
    case 'disconnect': {
      disconnect();
      break;
    }
    //any
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
  if (videoToSync.readyState === 4 && videoToSync.play) {
    console.log('onPlaying');
    console.log(event);
    const message = JSON.stringify({
      'message': 'broadcast',
      user,
      eventType: 'play',
      videoTime: videoToSync.currentTime,
    });
    if (socket.readyState === socket.OPEN && user.room && socket) {
      socket.send(message);
    }
  }
}

function onPause(event) {
  if (videoToSync.readyState === 4 && videoToSync.pause) {
    console.log('onPause');
    console.log(event);
    const message = JSON.stringify({
      'message': 'broadcast',
      user,
      eventType: 'pause',
      videoTime: videoToSync.currentTime,
    });
    if (socket.readyState === socket.OPEN && user.room && socket) {
      socket.send(message);
    }
  }

}

function onSeeked(event) {
  if (videoToSync.readyState === 4 && !videoToSync.seeked) {
    console.log('onSeeked');
    console.log(event);
    const message = JSON.stringify({
      'message': 'broadcast',
      user,
      eventType: 'seeked',
      videoTime: videoToSync.currentTime,
    });
    if (socket.readyState === socket.OPEN && user.room && socket) {
      socket.send(message);
    }
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
    videoToSync = findInFramesSelector('video', document);
    if (videoToSync) {
      addObsEvents(videoToSync, obsEventsConfig);
    }
    if (debug) console.log(videoToSync);
    console.log('video Observed');
  } catch (err) {
    console.log('can\t find or observe video on this page' + err);
  }

}

//WebSocket
//WebSocket events
function conectUserToRoom(data) {
  socket = new WebSocket('ws://127.0.0.1:8000/');
  //video observer init
  initVideoObserver(obsEventsConfig);

  socket.onopen = () => {
    user.name = data.name;
    user.room = data.room;
    data.videoTime = videoToSync.currentTime;
    status = 'connected';
    socket.send(JSON.stringify({
      from: 'popup',
      message: 'conectToRoom',
      data
    }));
    console.log('connected');

    socket.onclose = () => {
      console.log('closed');
    };
    socket.onmessage = event => {
      socketMSGSwitch(event.data);
    };
    updatePopupData();
  };
}

function fireSeeked(event) {
  const MAXVIDEOTIMEDEFF = 0.5;
  videoToSync.pause();
  const deltaVideoTime = Math.abs(event.videoTime - videoToSync.currentTime);
  if (videoToSync.readyState === 4 && deltaVideoTime > MAXVIDEOTIMEDEFF) { // fix seeking recursion
    videoToSync.currentTime = event.videoTime;
  }
}

function firebroadcast(event) {
  console.log(event, videoToSync.currentTime);
  switch (event.type) {
    case 'pause':
      if (videoToSync.readyState === 4) videoToSync.pause();
      break;
    case 'play':
      if (videoToSync.readyState === 4) videoToSync.play();
      break;
    case 'seeked':
      fireSeeked(event);
      break;
    case 'usersList':
      userslist = event.list;
      sendUsersListToPopup();
      break;
    default:
      console.warn('can\'t find event to fire');
      break;
  }
}

function disconnect() {
  status = 'disconnected';
  userslist = [];
  if (socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        from: 'popup',
        message: 'disconnect',
        user
      }));
    }
  }
  user.room = null;
  socket = undefined;
  videoToSync = undefined;
  updatePopupData();
}

//WS event Switches
function socketMSGSwitch(message) {
  const parsedMSG = JSON.parse(message);
  console.log('socketMSGSwitch:');
  console.log(parsedMSG);
  switch (parsedMSG.message) {
    case 'broadcast':
      firebroadcast(parsedMSG.event);
      break;
    case 'uid':
      user.uid = parsedMSG.uID;
      break;
    default:
      console.warn(message);
      break;
  }
}

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  runtimeMSGSwitch(request);
});


window.onbeforeunload = () => disconnect();

