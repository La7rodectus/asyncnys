'use strict';

function emulateUserConnection(data, socket) {
  return new Promise((resolve, reject) => {
    let timer = undefined;
    socket.send(JSON.stringify({
      from: 'god',
      message: 'w8 for uid',
      'data': null,
    }));
    function responseHandler(msg) {
      const parsedMSG = JSON.parse(msg.data);
      if (parsedMSG.message === 'uid') {
        const result = parsedMSG;
        resolve(result);
        clearTimeout(timer);
      }
    }
    socket.addEventListener('message', responseHandler);
    timer = setTimeout(() => {
      reject(new Error('socket response timeout'));
      socket.removeEventListener('message', responseHandler);
    }, 2000);
  }).then(parsedUID => {
    try {
      data.user.uid = parsedUID.uid,
      socket.send(JSON.stringify({
        from: 'popup',
        message: 'conectToRoom',
        data,
      }));
      return { 'user': data.user, 'err': null };
    } catch (err) {
      return { 'user': data.user, err };
    }
  });
}

function emulateUserDisconnection(user, socket) {
  socket.send(JSON.stringify({
    from: 'popup',
    message: 'disconnect',
    user,
  }));
}

module.exports.emulateUserDisconnection = emulateUserDisconnection;
module.exports.emulateUserConnection = emulateUserConnection;
