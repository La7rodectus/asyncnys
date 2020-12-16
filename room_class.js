'use strict';

class Room {
  constructor(name, roomID) {
    this.name = name;
    this.event = null;
    this.timeUpdated = null;
    this.users = [];
    this.usersLength = 0;
    this.share = null;
    this.roomID = roomID;
    this.joinLink;
  }

  addUser(socketID, name) {
    if (this.users[socketID] === undefined) {
      this.users[socketID] = name;
      this.usersLength++;
    }
  }

  disconnectUser(socketID) {
    console.log(`${this.name}: ${this.getUser(socketID)} disconnected`);
    delete this.users[socketID];
    this.usersLength--;
  }

  getUser(socketID) {
    return this.users[socketID];
  }

  getUsersNames() {
    const list = [];
    for (const key in this.users) list.push(this.users[key]);
    return list.sort();
  }

  nullUsers() {
    if (!this.usersLength) return true;
    return false;
  }

}

module.exports = Room;
