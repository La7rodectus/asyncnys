'use strict';

class User {
  constructor(uid, socket) {
    this.uid = uid;
    this.soket = socket;
    this.name = undefined;
    this.room = null;
  }

  setName(name) {
    this.name = name;
  }

  setRoom(roomName) {
    this.room = roomName;
  }

  leaveRoom() {
    this.room = null;
  }
}

module.exports = User;
