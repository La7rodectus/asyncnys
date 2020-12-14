'use strict';
/* eslint-disable max-len */
/* eslint-disable no-undef */
const debug = true;

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


//WebSocket

const socket = new WebSocket('ws://127.0.0.1:8000/');

socket.onopen = () => {
  console.log('connected');
};

socket.onclose = () => {
  console.log('closed');
};

socket.onmessage = event => {
  socketMSGSwitch(event.data);
  console.log(event.data);
};

//WebSocket events

function conectUserToRoom(data) {
  socket.send(JSON.stringify({
    message: 'conectToRoom',
    data
  }));
}

//Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  switch (message) {
    case 'test_f':
      testF();
      break;
    case 'connect_user_to_room':
      conectUserToRoom(request.data);
      break;
    default:
      console.log(message);
      break;
  }
}

function socketMSGSwitch(message) {
  switch (message) {
    case 'pause':
      testF();
      console.log('video paused for all users in room');
      break;
    default:
      console.log(message);
      break;
  }
}

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //chrome.runtime.sendMessage({ 'message': 'open_new_tab', 'url': document.location.href });
  runtimeMSGSwitch(request);

});






