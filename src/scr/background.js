'use strict';
/* eslint-disable no-undef */
/* eslint-disable max-len */



// background.js // Вызывается, когда пользователь нажимает на действие браузера.
chrome.browserAction.onClicked.addListener((tab) => {
  // Отправить сообщение на активную вкладку
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { 'message': 'clicked_browser_action' });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'open_new_tab') {
    chrome.tabs.create({ 'url': request.url });

  }
}
);


