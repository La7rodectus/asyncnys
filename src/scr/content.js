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

//Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  console.log(request);
  switch (message) {
    //background.js
    case 'test_f':
      testF();
      break;
    case 'connect_user_to_room':
      conectUserToRoom(request.data);
      break;
    case 'debug_log':
      console.log(request.data);
      break;
    case 'error':
      console.error(request);
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






