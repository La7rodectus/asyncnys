/* eslint-disable max-len */
/* eslint-disable no-undef */
'use strict';

//alert(document.location.href);
// library
function logHref() {
  const windowHref = document.location.href;
  console.log(windowHref);
  return windowHref;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.message) {
    case 'clicked_browser_action':
      logHref();
      break;
  }
  chrome.runtime.sendMessage({ 'message': 'open_new_tab', 'url': document.location.href });

});
