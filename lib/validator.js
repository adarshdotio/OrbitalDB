class Validator {
    constructor(s) { this.schema = s; }
    validate(d) { if (d.id === undefined) throw new Error("ID required"); }
}
module.exports = Validator;