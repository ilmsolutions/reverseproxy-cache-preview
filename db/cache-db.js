var mongoose = require('mongoose');

module.exports = function (config) {
    var module = {},
            Entry = require('./models/cache-entry')(config).Entry,
            db = mongoose.connect(config.cachedb.connect);

    module.get = function (key, callback) {
        //console.log(key);
        Entry.findOne({ url: key }, function (err, entry) {
            //console.log(entry);        
            if (!err) {
                return callback((null != entry) ? entry.response : entry);
            }
            else
                console.log('did not find any entries');
        });
    }

    module.save = function (key, value, callback) {
        var entry = new Entry({
            url: key,
            response: value
        });
        //console.log(JSON.stringify(entry));
        entry.save(function (err, entry) {
            if (!err) {
                return callback ? callback((null != entry) ? entry.response : entry) : err;
            }
            else
                console.log('save did not go thru!');

        });
    }

    module.remove = function (key, callback) {
        Entry.where({ url: key }).findOneAndRemove(function (err, entry) {
            //console.log("returned from remove callback - " + JSON.stringify(entry));
            if (!err) {
                return callback((null != entry) ? entry.response : entry);
            }
            else
                console.log('error while trying to remove entry!');
        });
    }

    return module;
}