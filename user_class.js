'use strict';

class User {
  constructor(uid, socket) {
    this.uID = uid;
    this.soket = socket;
    this.room = null;
  }

  setRoom(roomName) {
    this.room = roomName;
  }

  leaveRoom() {
    this.room = null;
  }
}

module.exports = User;
