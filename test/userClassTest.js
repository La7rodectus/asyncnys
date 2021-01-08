'use strict';

const assert = require('assert').strict;
const userTestData = require('./testsData/userTestsData');
const User = require('../user_class.js');
const mocha = require('mocha');
const describe = mocha.describe;
const it = mocha.it;

describe('User class test', () => {
  it('Test user creation', () => {
    const socket = userTestData.localhostSocket;
    const user = new User(userTestData.userID, socket);
    assert.strictEqual(user.soket, socket);
    assert.strictEqual(user.uid, userTestData.userID);
  });
  it('Test setName method', () => {
    const socket = userTestData.localhostSocket;
    const user = new User(userTestData.userID, socket);
    const username = userTestData.username;
    user.setName(username);
    assert.strictEqual(user.name, username);
  });
  it('Test setRoom method', () => {
    const socket = userTestData.localhostSocket;
    const user = new User(userTestData.userID, socket);
    const roomname = userTestData.roomname;
    user.setRoom(roomname);
    assert.strictEqual(user.room, roomname);
  });
  it('Test leaveRoom method', () => {
    const socket = userTestData.localhostSocket;
    const user = new User(userTestData.userID, socket);
    const roomname = userTestData.roomname;
    user.setRoom(roomname);
    assert.strictEqual(user.room, roomname);
    user.leaveRoom();
    assert.strictEqual(user.room, null);
  });
});

