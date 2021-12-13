module.exports = {
    keygen: function(path, qstr){
         return (path + (qstr.length > 0 ? '?' + qstr : '')).toLowerCase();
    }
}