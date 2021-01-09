'use strict';

const WebSocket = require('ws');
const assert = require('assert').strict;
const mocha = require('mocha');
const utilFnc = require('./testsData/serverTestsUtils');
const describe = mocha.describe;
const it = mocha.it;
const beforeEach = mocha.beforeEach;

let socket = undefined;
const connectedTestClients = [];


describe('Server tests', () => {
  beforeEach((done) => {
    require('../server');
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
    const testsData = {
      user: {
        name: 'ivan',
        room: 'room99',
      },
      videoTime: 666,
      sharedSiteURL: 'someSite',
    };
    socket.onopen = () => {
      utilFnc.emulateUserConnection(testsData, socket).then(data => {
        if (data.err === null) {
          connectedTestClients.push(data.user);
          socket.onmessage = event => {
            const parsedMSG = JSON.parse(event.data);
            if (parsedMSG.message === 'broadcast' &&
              parsedMSG.event.type === 'share') {
              assert.strictEqual(parsedMSG.event.shareURL, 'someSite');
              done();
            }
          };
        } else console.log(data.err);
      });
    };
  });
  it('connect to room: username already exist test', done => {
    socket.onopen = () => {
      const testsData = {
        user: {
          name: 'ivan',
          room: 'room99',
        },
        videoTime: 666,
        sharedSiteURL: 'someSite',
      };
      utilFnc.emulateUserConnection(testsData, socket).then(() => {
        socket.onmessage = event => {
          const parsedMSG = JSON.parse(event.data);
          console.log(parsedMSG);
          if (parsedMSG.message === 'error') {
            const uname = testsData.user.name;
            const expected = `This username (${uname}) already exists`;
            assert.deepStrictEqual(parsedMSG.error, expected);
            done();
          }
        };
      });
    };
  });
  it('disconnect test', done => {
    socket.onopen = () => {
      const testsUser = connectedTestClients[0];
      utilFnc.emulateUserDisconnection(testsUser, socket);
      socket.onmessage = event => {
        const parsedMSG = JSON.parse(event.data);
        if (parsedMSG.message === 'successfully disconnected') {
          assert.strictEqual(testsUser.name, parsedMSG.username);
          done();
        }
      };
    };
  });
});
