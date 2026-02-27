const fs = require('fs');
class Storage {
  constructor(filePath) {
    this.path = filePath + '.db';
    if (!fs.existsSync(this.path)) fs.writeFileSync(this.path, '');
  }
  encode(doc, isTombstone = false) {
    const data = Buffer.from(JSON.stringify(doc));
    const header = Buffer.alloc(5);
    header.writeUInt32BE(data.length, 0);
    header.writeUInt8(isTombstone ? 1 : 0, 4);
    return Buffer.concat([header, data]);
  }
  decode(buf) {
    const isTombstone = buf.readUInt8(4) === 1;
    const data = JSON.parse(buf.slice(5).toString());
    return isTombstone ? { ...data, _deleted: true } : data;
  }
  read(offset) {
    const fd = fs.openSync(this.path, 'r');
    try {
      const h = Buffer.alloc(5);
      fs.readSync(fd, h, 0, 5, offset);
      const size = h.readUInt32BE(0);
      const buf = Buffer.alloc(5 + size);
      fs.readSync(fd, buf, 0, 5 + size, offset);
      return this.decode(buf);
    } finally { fs.closeSync(fd); }
  }
  write(buf, offset) {
    const fd = fs.openSync(this.path, 'r+');
    try { fs.writeSync(fd, buf, 0, buf.length, offset); }
    finally { fs.closeSync(fd); }
  }
  getNextOffset() { return fs.statSync(this.path).size; }
  
  // THE COMPACTOR: Cleans up deleted records
  compact(indexer) {
    const tempPath = this.path + '.tmp';
    const newPrimary = new Map();
    let newOffset = 0;
    
    for (const [id, oldOffset] of indexer.primary) {
      const doc = this.read(oldOffset);
      const buf = this.encode(doc);
      fs.appendFileSync(tempPath, buf);
      newPrimary.set(id, newOffset);
      newOffset += buf.length;
    }
    fs.renameSync(tempPath, this.path);
    return newPrimary;
  }
}
module.exports = Storage;