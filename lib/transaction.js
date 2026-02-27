const fs = require('fs');
class Transaction {
    constructor(p) { this.j = p + '.journal'; }
    begin(d) { fs.writeFileSync(this.j, JSON.stringify(d)); }
    commit() { if (fs.existsSync(this.j)) fs.unlinkSync(this.j); }
    recover() { if (fs.existsSync(this.j)) fs.unlinkSync(this.j); }
}
module.exports = Transaction;