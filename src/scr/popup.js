'use strict';


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


//buttons handler
shareBtn.onclick = () => {
  chrome.runtime.sendMessage({ message: 'test_f' });
};

connectBtn.onclick = () => {
  chrome.runtime.sendMessage({ message: 'connectBtn_clicked' });
};


