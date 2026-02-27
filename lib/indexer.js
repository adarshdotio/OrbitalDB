const fs = require('fs');

class Indexer {
  constructor(filePath) {
    this.primary = new Map();
    this.secondary = {};
    this.indexPath = filePath + '.idx';
    this.loadFromDisk();
  }
  
  // Save index so we don't have to rebuild on restart
  saveToDisk() {
    try {
      const data = JSON.stringify(Array.from(this.primary.entries()));
      fs.writeFileSync(this.indexPath, data);
    } catch (e) {
      console.error("Index save failed");
    }
  }
  
  loadFromDisk() {
    if (fs.existsSync(this.indexPath)) {
      try {
        const raw = fs.readFileSync(this.indexPath, 'utf8');
        this.primary = new Map(JSON.parse(raw));
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  
  set(doc, offset) {
    this.primary.set(doc.id, offset);
    this.saveToDisk();
  }
  
  rebuild(storage) {
    if (this.loadFromDisk()) return; // Skip if index exists
    
    this.primary.clear();
    let offset = 0;
    const size = fs.statSync(storage.path).size;
    while (offset < size) {
      const doc = storage.read(offset);
      if (!doc._deleted) this.primary.set(doc.id, offset);
      
      const fd = fs.openSync(storage.path, 'r');
      const h = Buffer.alloc(4);
      fs.readSync(fd, h, 0, 4, offset);
      fs.closeSync(fd);
      offset += (5 + h.readUInt32BE(0));
    }
    this.saveToDisk();
  }
}
module.exports = Indexer;