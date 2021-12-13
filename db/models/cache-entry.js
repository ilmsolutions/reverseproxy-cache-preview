var mongoose = require('mongoose');

module.exports = function (config) {
    var module = {},
        entrySchema = mongoose.Schema({
                createdAt: {type: Date, "default": Date.now(), expires: config.cachedb.expiration},
                url: String, 
                response: JSON
        })


    module.Entry = mongoose.model('Entry', entrySchema);

    return module;
}