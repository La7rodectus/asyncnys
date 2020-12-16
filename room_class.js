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

  addUser(socket, name) {
    if (!this.users.find(item => item.name === name)) {
      this.users.push({ name, socket });
      this.usersLength++;
      return true;
    } else return false;
  }

  disconnectUser(socket) {
    console.log(`${this.name}: ${this.getUser(socket)} disconnected`);
    delete this.users[socket];
    this.usersLength--;
  }

  getUser(socket) {
    return this.users[socket];
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
