'use strict';
/* eslint-disable max-len */
/* eslint-disable no-undef */



// library
function logHref() {
  const windowHref = document.location.href;
  console.log(windowHref);
  return windowHref;
}

function findInFramesRec(selector, doc) {
  try {
    let hit = doc.querySelector(selector);
    if (hit) return hit;
    const frames = Array.prototype.slice.call(doc.frames);
    for (let i = 0; (i < frames.length) &&   !hit; i++) {
      try {
        if (!frames[i] || !frames[i].document) continue;
        hit = findInFramesRec(selector, frames[i].document);
      } catch (err) {
        console.warn('Can\'t fined video element ' + err.name + ': ' + err.message);
      }
    }
    return hit;
  } catch (err) {
    console.warn('Can\'t exec inFrame search ' + err.name + ': ' + err.message);
    return false;
  }

}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.message === 'clicked_browser_action') {
    const res = findInFramesRec('video', document);
    if (res) {
      res.pause();
    }
    console.log(res);
    logHref();
  }



  //chrome.runtime.sendMessage({ 'message': 'open_new_tab', 'url': document.location.href });

});
