'use strict';

const WebSocket = require('ws');
const assert = require('assert').strict;
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;
const beforeEach = mocha.beforeEach;

let socket = undefined;
let lastConnectedClient = undefined;
require('../server');

describe('Server tests', () => {
  beforeEach((done) => {
    socket = new WebSocket('ws://127.0.0.1:8000/');
    done();
  });
  it('get uid test', done => {
    socket.onopen = () => {
      socket.onmessage = event => {
        const parsedMSG = JSON.parse(event.data);
        if (parsedMSG.message === 'uid') {
          assert.strictEqual(parsedMSG.uid.length, 36);
          done();
        }
      };
    };
  });
  it('connect to room: share test', done => {
    socket.onopen = () => {
      new Promise((resolve, reject) => {
        let timer = undefined;
        socket.send(JSON.stringify({
          from: 'god',
          message: 'w8 for uid',
          data: null,
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
        lastConnectedClient = {
          name: 'kolya',
          room: 'muhosransk',
          uid: parsedUID.uid,
        };
        const data = {
          'user': lastConnectedClient,
          sharedSiteURL: 'someSite',
          'videoTime': 666,
        };
        socket.send(JSON.stringify({
          from: 'popup',
          message: 'conectToRoom',
          data,
        }));
        socket.onmessage = event => {
          const parsedMSG = JSON.parse(event.data);
          console.log(parsedMSG);
          if (parsedMSG.message === 'broadcast' &&
          parsedMSG.event.type === 'share') {
            assert.strictEqual(parsedMSG.event.shareURL, 'someSite');
            done();
          }
        };
      });
    };
  });
  it('connect to room: username already exist test', done => {
    socket.onopen = () => {
      new Promise((resolve, reject) => {
        let timer = undefined;
        socket.send(JSON.stringify({
          from: 'god',
          message: 'w8 for uid',
          data: null,
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
        const client = {
          name: 'kolya',
          room: 'muhosransk',
          uid: parsedUID.uid,
        };
        const data = {
          'user': client,
          sharedSiteURL: 'someSite',
          'videoTime': 666,
        };
        socket.send(JSON.stringify({
          from: 'popup',
          message: 'conectToRoom',
          data,
        }));
        socket.onmessage = event => {
          const parsedMSG = JSON.parse(event.data);
          console.log(parsedMSG);
          if (parsedMSG.message === 'error') {
            const expected = 'This username (kolya) already exists';
            assert.strictEqual(parsedMSG.error, expected);
            done();
          }
        };
      });
    };
  });
  it('disconnect test', done => {
    socket.onopen = () => {
      socket.send(JSON.stringify({
        from: 'popup',
        message: 'disconnect',
        user: lastConnectedClient,
      }));
      socket.onmessage = event => {
        const parsedMSG = JSON.parse(event.data);
        console.log(parsedMSG);
        if (parsedMSG.message === 'successfully disconnected') {
          assert.strictEqual(lastConnectedClient.uid, parsedMSG.user.uid);
          done();
        }
      };
    };
  });

});
