'use strict';
/* eslint-disable no-undef */

const assert = require('assert').strict;
const roomTestData = require('./testsData/roomTestsData');
const Room = require('../room_class.js');

describe('Room class test', () => {
  it('Test rooom creation', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    assert.strictEqual(room.name, roomTestData.roomname);
    assert.strictEqual(room.roomID, roomTestData.roomID);
  });
  it('Test addUser method', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const socket = roomTestData.localhostSocket;
    const userName = roomTestData.username;
    room.addUser(socket, userName);
    assert.strictEqual(room.users[0].name, userName);
    assert.strictEqual(room.users[0].socket, socket);
  });
  it('Test getSocketsArr method (exist)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    const res = room.getSocketsArr();
    const expected = ['s1', 's2', 's3', 's4', 's5', 's6'];
    assert.deepStrictEqual(res, expected);
  });
  it('Test getSocketsArr method (empty room)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const res = room.getSocketsArr();
    const expected = [];
    assert.deepStrictEqual(res, expected);
  });
  it('Test getUsers method (exist)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    const res = room.getUsers();
    const expected = [
      { name: 'u1', socket: 's1' },
      { name: 'u2', socket: 's2' },
      { name: 'u3', socket: 's3' },
      { name: 'u4', socket: 's4' },
      { name: 'u5', socket: 's5' },
      { name: 'u6', socket: 's6' },
    ];
    assert.deepStrictEqual(res, expected);
  });
  it('Test getUsers method (empty room)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const res = room.getUsers();
    const expected = [];
    assert.deepStrictEqual(res, expected);
  });
  it('Test disconnectUser method (exist)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    room.disconnectUser('u3');
    const res = room.getUsers();
    const expected = [
      { name: 'u1', socket: 's1' },
      { name: 'u2', socket: 's2' },
      { name: 'u4', socket: 's4' },
      { name: 'u5', socket: 's5' },
      { name: 'u6', socket: 's6' },
    ];
    assert.deepStrictEqual(res, expected);
  });
  it('Test disconnectUser method (non-existent)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    const res = room.disconnectUser('non-existent');
    const expected = false;
    assert.deepStrictEqual(res, expected);
  });
  it('Test getUser method (exist)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    const res = room.getUser('u5');
    const expected = { name: 'u5', socket: 's5' };
    assert.deepStrictEqual(res, expected);
  });
  it('Test getUser method (non-existent)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    const res = room.getUser('non-existent');
    const expected = false;
    assert.deepStrictEqual(res, expected);
  });
  it('Test getUsersNames method (users exist)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    roomTestData.usersData.forEach(userData => {
      room.addUser(userData.socket, userData.userName);
    });
    const res = room.getUsersNames();
    const expected = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
    assert.deepStrictEqual(res, expected);
  });
  it('Test getUsersNames method (empty room)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const res = room.getUsersNames();
    const expected = [];
    assert.deepStrictEqual(res, expected);
  });
  it('Test nullUsers method (0 users)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const res = room.nullUsers();
    const expected = true;
    assert.deepStrictEqual(res, expected);
  });
  it('Test nullUsers method (1 users)', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const user = {
      userName: roomTestData.usersData[0].userName,
      socket: roomTestData.usersData[0].socket,
    };
    room.addUser(user.socket, user.userName);
    const res = room.nullUsers();
    const expected = false;
    assert.deepStrictEqual(res, expected);
  });
  it('Test getRoomID method', () => {
    const room = new Room(roomTestData.roomname, roomTestData.roomID);
    const res = room.getRoomID();
    const expected = roomTestData.roomID;
    assert.deepStrictEqual(res, expected);
  });
});




