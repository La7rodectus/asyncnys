'use strict';

module.exports = class Room {
  constructor(name, roomID) {
    this.name = name;
    this.event = undefined;
    this.roomTime = 0;
    this.users = [];
    this.usersLength = 0;
    this.shareURL = undefined;
    this.roomID = roomID;
  }

  getSocketsArr() {
    const socketList = [];
    for (let i = 0; i < this.usersLength; i++) {
      socketList.push(this.users[i].socket);
    }
    return socketList;
  }

  getUsers() {
    return this.users;
  }

  addUser(socket, name) {
    if (!this.users.find(item => item.name === name)) {
      this.users.push({ name, socket });
      this.usersLength++;
      return true;
    } else return false;
  }

  disconnectUser(name) {
    const userIndex = this.users.findIndex(item => item.name === name);
    if (userIndex !== -1) {
      console.log(`room ${this.name}: ${this.getUser(name).name} disconnected`);
      this.users.splice(userIndex, 1);
      this.usersLength--;
      return true;
    } else return false;
  }

  getUser(name) {
    const user = this.users.find(item => item.name === name);
    if (user) return user; else return false;
  }

  getUsersNames() {
    const list = [];
    for (const key in this.users) list.push(this.users[key].name);
    return list.sort();
  }

  nullUsers() {
    if (this.usersLength <= 0) return true;
    return false;
  }

  getRoomID() {
    return this.roomID;
  }

};

