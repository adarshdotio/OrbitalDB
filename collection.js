const Storage = require('./lib/storage');
const Indexer = require('./lib/indexer');
const Validator = require('./lib/validator');
const Transaction = require('./lib/transaction');
class Collection {
    constructor(dbPath, name, schema, parent) {
        const fullPath = dbPath + '/' + name;
        this.storage = new Storage(fullPath);
        this.indexer = new Indexer();
        this.validator = new Validator(schema);
        this.tx = new Transaction(fullPath);
        this.parent = parent;
        this.tx.recover();
        this.indexer.rebuild(this.storage);
    }
    async insert(doc) {
        this.validator.validate(doc);
        const offset = this.storage.getNextOffset();
        this.storage.write(this.storage.encode(doc), offset);
        this.indexer.set(doc, offset);
    }
    async delete(id) {
        const offset = this.indexer.primary.get(id);
        if (offset === undefined) return;
        const doc = this.storage.read(offset);
        // Mark as tombstone
        this.storage.write(this.storage.encode(doc, true), offset);
        this.indexer.primary.delete(id);
    }
    async compact() {
        const newPrimary = this.storage.compact(this.indexer);
        this.indexer.primary = newPrimary;
    }
    async findOne(query) {
        const id = typeof query === 'object' ? this.indexer.secondary[Object.keys(query)[0]]?.get(Object.values(query)[0]) : query;
        const offset = this.indexer.primary.get(id);
        return (offset !== undefined) ? this.storage.read(offset) : null;
    }
}
module.exports = Collection;