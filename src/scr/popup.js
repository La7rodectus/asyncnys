'use strict';
/* eslint-disable max-len */

const debug = true;
//get html elements
const roomField = document.getElementById('room');
const nameField = document.getElementById('name');
const connectBtn = document.getElementById('connect');
const shareBtn = document.getElementById('share');
const sharedLink = document.getElementById('shared');
const usersList = document.getElementById('usersList');
const statusBar = document.getElementById('status');
const errorElem = document.getElementById('error');

//library
function displayElem(display) {
  sharedLink.style.display = display;
  usersList.style.display = display;
  shareBtn.style.display = display;
}

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

function showError(error) {
  errorElem.style.display = 'block';
  setTimeout(() => errorElem.style.display = 'none', 2000);
  errorElem.innerText = error;
}

function getFaviconFromUrl(url) {
  let position = 0;
  for (let i = 0; i < 3; i++) {
    position = url.indexOf('/', position);
    position++;
  }
  return `${url.substring(0, position)}favicon.ico`;
}

function sendRuntimeMessage(msg, data = null) {
  try {
    const message = { 'message': msg, data };
    chrome.runtime.sendMessage(message);
  } catch (err) {
    if (debug) console.error('can\'t sendRuntimeMessage');
  }
}

function isRoomAndNameCorrect() {
  if (nameField.value === '' || nameField.value === undefined) return 'incorrect_write_name';
  if (nameField.value.length < 2 || nameField.value.length > 24) return 'incorrect_name_length';
  if (roomField.value === '' || roomField.value === undefined) return 'incorrect_write_room';
  if (roomField.value.length < 2 || roomField.value.length > 24) return 'incorrect_room_length';
  return true;
}

function updatePopup() {
  sendMessageToActiveTab('updatePopup');
}

function connectBtnAction() {
  if (isRoomAndNameCorrect() === true) {
    const data = { name: nameField.value, room: roomField.value };
    sendMessageToActiveTab('connect_user_to_room', data);
  } else {
    showError(isRoomAndNameCorrect());
  }
  updatePopup();
}

//Runtime Events
function onStatus(status) {
  if (status === 'connected') {
    nameField.readOnly = true;
    roomField.readOnly = true;
    connectBtn.value = 'disconnect';
    connectBtn.onclick = () => sendMessageToActiveTab('disconnect');
    displayElem('block');
  } else {
    nameField.readOnly = false;
    roomField.readOnly = false;
    connectBtn.value = 'connect';
    connectBtn.onclick = () => connectBtnAction();
    displayElem('none');
  }
  statusBar.innerText = 'status: ' + status;
}

function onShare(data) {
  if (data) {
    sharedLink.href = data.shareURL;
    sharedLink.innerText = '';
    const img = document.createElement('img');
    const span = document.createElement('span');
    sharedLink.appendChild(img);
    sharedLink.appendChild(span);
    img.style.height = '16px';
    img.src = getFaviconFromUrl(data.shareURL);
    span.innerText = data.shareURL;//data.title
    sharedLink.style.display = 'block';
  }
}

function onUserList(list) {
  usersList.style.display = 'block';
  usersList.innerText = 'users in room ' + roomField.value + ':';
  list.forEach(userName => {
    const li = document.createElement('li');
    li.innerText = userName;
    usersList.appendChild(li);
  });
}

function onSendUser(data) {
  nameField.value = data.name;
  roomField.value = data.room;
}

//Runtime Event Switches
function runtimeMSGSwitch(request) {
  const message = request.message;
  console.log('popup.js runtimeMSGSwitch: ' + message);
  switch (message) {
    //content.js
    case 'status':
      onStatus(request.data);
      break;
    case 'share':
      onShare(request.data);
      break;
    case 'sendUsersList':
      onUserList(request.data);
      break;
    case 'sendUser':
      onSendUser(request.data);
      break;
    case 'error':
      showError(request.data);
      break;
    default:
      console.warn('No handler for runtime message: ' + message);
      break;
  }
}


//buttons handler
shareBtn.onclick = () => sendMessageToActiveTab('share');
connectBtn.onclick = () => connectBtnAction();
//sharedLink.onclick = () => sendRuntimeMessage('sharedLinkClicked', );

//listeners
chrome.runtime.onMessage.addListener(request => {
  runtimeMSGSwitch(request);
});

window.onload = () => updatePopup();


