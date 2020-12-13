'use strict';
/* eslint-disable max-len */
/* eslint-disable no-undef */
const debug = true;

// library
function logHref() {
  const windowHref = document.location.href;
  console.log(windowHref);
}

function sendRuntimeMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg);
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

//Event Switches
function runtimeMSGSwitch(message) {
  switch (message) {
    case 'clicked_browser_action':
      testF();
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
      break;
    default:
      console.log(message);
      break;
  }
}

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  runtimeMSGSwitch(request.message);
  //chrome.runtime.sendMessage({ 'message': 'open_new_tab', 'url': document.location.href });

});


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


