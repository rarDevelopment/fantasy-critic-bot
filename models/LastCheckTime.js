const mongoose = require("mongoose");

const lastCheckTimeSchema = new mongoose.Schema({
    checkType: String,
    checkDate: String
}, { collection: 'lastchecktime' });

module.exports = {
    LastCheckTime: mongoose.model('lastchecktime', lastCheckTimeSchema, 'lastchecktime')
}