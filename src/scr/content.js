'use strict';
/* eslint-disable max-len */
/* eslint-disable no-undef */
const debug = true;

// imports
//const WebSocket = require('ws');

// library
function logHref() {
  const windowHref = document.location.href;
  console.log(windowHref);
}

function sendRuntimeMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg);
  } catch (err) {
    if (debug) throw new Error(err);
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

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.message === 'clicked_browser_action') {
    const videoToSync = findInFramesSelector('video', document);
    if (videoToSync) {
      videoToSync.pause();
    }
    console.log(videoToSync);
    logHref();
  }



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
  console.log(event.data);
};


