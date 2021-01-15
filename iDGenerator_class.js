'use strict';

class IDGenerator {
  constructor() {
    if (this._instance) {
      return this;
    } else {
      this._instance = true;
      return new IDGenerator();
    }
  }

  _usedID
  _instance

  #gererateID() {
    const stringModel = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    function replaceRule(cur, replace) {
      if (cur !== 'x')  {
        replace = Math.random() * 16 | 0;
      } else {
        replace = (replace & 0x3 | 0x8).toString(16)
      }
    }
    return stringModel.replace(/[xy]/g, replaceRule);
  }
  
  getID() {
    let id = undefined;
    do {
      id = this.#gererateID();
    } while (!this.usedID.includes(id));
    this.usedID.push(id);
    return id;
  }

  removeID(id) {
    const idIndex = this.usedID.indexOf(id);
    if (idIndex !== -1) {
      this.usedID.splice(idIndex, 1);
      return true;
    }
    return false;
  }

}

module.exports = IDGenerator;


