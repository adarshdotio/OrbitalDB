const fs = require('fs');
const path = require('path');
const Collection = require('./collection');
class OrbitalDB {
  constructor(dbName) {
    this.dbDir = path.join(process.cwd(), 'data', dbName);
    if (!fs.existsSync(this.dbDir)) fs.mkdirSync(this.dbDir, { recursive: true });
    this.collections = {};
  }
  collection(name, schema = {}) {
    if (!this.collections[name]) this.collections[name] = new Collection(this.dbDir, name, schema, this);
    return this.collections[name];
  }
}
module.exports = OrbitalDB;