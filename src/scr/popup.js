'use strict';
/* eslint-disable max-len */

const debug = true;

//get html elements
const roomField = document.getElementById('room');
const nameField = document.getElementById('name');
const connectBtn = document.getElementById('connect');
const shareBtn = document.getElementById('share');
const sharedText = document.getElementById('shared');
const usersListTitle = document.getElementById('usersListTitle');
const usersList = document.getElementById('usersList');
const errorElem = document.getElementById('error');

//library
function isDisplayElem(display = false) {
  sharedText.style.display = display;
  usersListTitle.style.display = display;
  usersList.style.display = display;
}

function storageUserName(name) {
  chrome.storage.sync.set({ name });
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

//buttons handler
shareBtn.onclick = () => {
  sendRuntimeMessage('test_f');
};

connectBtn.onclick = () => {
  if (isRoomAndNameCorrect() === true) {
    const data = { name: nameField.value, room: roomField.value };
    storageUserName(data.name);
    sendRuntimeMessage('connectBtn_clicked', data);
  } else {
    sendRuntimeMessage('error', isRoomAndNameCorrect());
  }
};


