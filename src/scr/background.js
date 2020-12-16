'use strict';
/* eslint-disable no-undef */
/* eslint-disable max-len */

// library
function sendMessageToActiveTab(msg, data = null) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const message = { 'message': msg, data };
      chrome.tabs.sendMessage(activeTab.id, message);
    });
  } catch (err) {
    if (debug) console.error('can\'t sendMessageToActiveTab');
  }
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
  socket.send(JSON.stringify({
    from: 'popup',
    message: 'conectToRoom',
    data
  }));
}

//Events
function openNewTab(url) {
  try {
    chrome.tabs.create({ url });
  } catch (err) {
    console.error(`can't openNewTab: ${url}`);
  }
}

//Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  switch (message) {
    //from popup.js
    case 'test_f':
      sendMessageToActiveTab('test_f');
      break;
    case 'connectBtn_clicked':
      conectUserToRoom(request.data);
      break;
    case 'error':
      sendMessageToActiveTab('error', request.data);
      console.error(request.data);
      break;
    case 'debug_log':
      sendMessageToActiveTab('debug_log', request.data);
      console.log(request.data);
      break;
    //from content.js
    case 'open_new_tab':
      openNewTab(request.url);
      break;
    default:
      console.log(message);
      break;
  }
}

//WS event Switches
function socketMSGSwitch(message) {
  const parsedMSG = JSON.parse(message);
  switch (parsedMSG.message) {
    case 'useeList':
      console.log(message);
      break;
    case 'broadcast':
      testF();
      console.log(message);
      break;
    default:
      console.log(message);
      break;
  }
}

//Listeners
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  runtimeMSGSwitch(request);
});

socket.onmessage = event => {
  console.log(event.data);
  socketMSGSwitch(event.data);
  sendMessageToActiveTab('debug_log', JSON.parse(event.data));
};
