'use strict';

class IDGenerator {
  #usedID = [];
  #instance = [];

  constructor() {
    if (this.#instance) {
      return this;
    } else {
      this.#instance = true;
      return new IDGenerator();
    }
  } 

  #gererateID() {
    const stringModel = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    function replaceRule(cur, replace) {
      if (cur !== 'x')  {
        return replace = Math.random() * 16 | 0;
      } else {
        return replace = (replace & 0x3 | 0x8).toString(16)
      }
    }
    return stringModel.replace(/[xy]/g, replaceRule);
  }
  
  getID() {
    let id = undefined;
    do {
      id = this.#gererateID();
      console.log(id);
    } while (this.#usedID.includes(id));
    this.#usedID.push(id);
    return id;
  }

  removeID(id) {
    const idIndex = this.#usedID.indexOf(id);
    if (idIndex !== -1) {
      this.#usedID.splice(idIndex, 1);
      return true;
    }
    return false;
  }

}

module.exports = IDGenerator;


