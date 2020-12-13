'use strict';
/* eslint-disable no-undef */
/* eslint-disable max-len */

// library
function sendMessageToActiveTab(msg) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const message = { 'message': msg };
      chrome.tabs.sendMessage(activeTab.id, message);
    });
  } catch (err) {
    if (debug) console.error('can\'t sendMessageToActiveTab');
  }
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
    //from content.js
    case 'open_new_tab':
      openNewTab(request.url);
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


