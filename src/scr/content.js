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
let sharedSiteURL = undefined;
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

function promisifySocketMSG(message, data, awaitMsgType, timeout = 1000) {
  return new Promise((resolve, reject) => {
    let timer = undefined;
    socket.send(JSON.stringify({
      from: 'content.js',
      message,
      data,
    }));

    function responseHandler(msg) {
      const parsedMSG = JSON.parse(msg.data);
      if (parsedMSG.message === awaitMsgType) {
        const result = parsedMSG;
        resolve(result);
        clearTimeout(timer);
      }
    }

    socket.addEventListener('message', responseHandler);

    timer = setTimeout(() => {
      reject(new Error('socket response timeout'));
      socket.removeEventListener('message', responseHandler);
    }, timeout);
  });
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

function sendShareToPopup(shareURL) {
  if (status === 'connected') {
    if (shareURL !== undefined) {
      sendRuntimeMessage('share', { shareURL });
      console.log(shareURL);
    }

  }
}

function sendUsersListToPopup() {
  sendRuntimeMessage('sendUsersList', userslist);
}

function updatePopupData() {
  sendShareToPopup(sharedSiteURL);
  sendStatusToPopup(status);
  sendUserToPopup();
  sendUsersListToPopup();
}

//Runtime Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  console.log('content.js runtimeMSGSwitch:');
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
    case 'share': {
      sendShareToPopup(sharedSiteURL);
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
      console.log('No handler for runtime massage: ' + message);
      break;
  }
}

//video observer
function onPlaying(event) {
  if (!socket) return;
  if (videoToSync.readyState === 4 && videoToSync.play) {
    console.log('onPlaying');
    console.log(event);
    const message = JSON.stringify({
      'message': 'broadcast',
      user,
      eventType: 'play',
      videoTime: videoToSync.currentTime,
    });
    if (socket.readyState === socket.OPEN && user.room) {
      socket.send(message);
    }
  }
}

function onPause(event) {
  if (!socket) return;
  if (videoToSync.readyState === 4 && videoToSync.pause) {
    console.log('onPause');
    console.log(event);
    const message = JSON.stringify({
      'message': 'broadcast',
      user,
      eventType: 'pause',
      videoTime: videoToSync.currentTime,
    });
    if (socket.readyState === socket.OPEN && user.room) {
      socket.send(message);
    }
  }

}

function onSeeked(event) {
  if (!socket) return;
  if (videoToSync.readyState === 4 && !videoToSync.seeked) {
    console.log('onSeeked');
    console.log(event);
    const message = JSON.stringify({
      'message': 'broadcast',
      user,
      eventType: 'seeked',
      videoTime: videoToSync.currentTime,
    });
    if (socket.readyState === socket.OPEN && user.room) {
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
function conectUserToRoom(popupdata) {
  //socket = new WebSocket('wss://asyncnyshook.herokuapp.com/');
  socket = new WebSocket('ws://127.0.0.1:8000/');
  //video observer init
  initVideoObserver(obsEventsConfig);

  socket.onopen = () => {
    user.name = popupdata.name;
    user.room = popupdata.room;
    sharedSiteURL = document.location.href;
    status = 'connected';
    console.log('connected');
    promisifySocketMSG('waiting fo uid', null, 'uid')
      .then(resolve => {
        const client = {
          name: popupdata.name,
          room: popupdata.room,
          uid: resolve.uid,
        };
        const data = {
          'user': client,
          sharedSiteURL,
          'videoTime': videoToSync.currentTime,
        };
        console.log(data);
        socket.send(JSON.stringify({
          from: 'popup',
          message: 'conectToRoom',
          data,
        }));
      });

    socket.onclose = () => {
      disconnect();
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
    case 'share':
      sharedSiteURL = event.shareURL;
      sendShareToPopup(event.shareURL);
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
  if (socket) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        from: 'popup',
        message: 'disconnect',
        user
      }));
    }
  }
  status = 'disconnected';
  userslist = [];
  sharedSiteURL = undefined;
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
    case 'ping':
      socket.send(JSON.stringify({ 'message': 'pong' }));
      break;
    case 'uid':
      user.uid = parsedMSG.uid;
      break;
    case 'error':
      sendRuntimeMessage('error', parsedMSG.error);
      break;
    default:
      console.log('No handler for socket massage: ' + message);
      break;
  }
}

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  runtimeMSGSwitch(request);
});


window.onbeforeunload = () => disconnect();

