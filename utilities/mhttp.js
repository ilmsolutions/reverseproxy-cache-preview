var http = require("http"),
    https = require("https"),
    constants = require("constants"),    
    extend = require("extend");


module.exports = function () {
    var module = {};

    module.formatpath = function(protocol, host, port, path, qstr){
        var pstr = path + (qstr.length > 0 ? '?' + qstr : '');
        if (host == "localhost") {//for some reason in localhost options.path is working when it is relative to the host url
            return pstr;
        }
        else //while for remote requests options.path works with absolute url else reporting as blocked
          return protocol + '://' + host + ((port && port.length > 0) ? ':' + port : '') + pstr;        
    }

    module.get = function (protocol, options, cb) { 
        //console.log('before making https get request');	
        var _mhttp = (protocol == "https" ? https : http);
        if (protocol == "https")
            extend(true, options, {
                agent: false,
                secureOptions:  constants.SSLv3_method,
                strictSSL: false,
				//the below property has been removed as SSL has been configured
				rejectUnauthorized: false //put to suppress the Host Name not being from the alternate names assigned to the SSL certificate, avoids man-in-middle attacks
            });

        return _mhttp.get(options, cb);
    }

    module.request = function (protocol, options, cb) {
		//console.log('before making https post request');
        var _mhttp = (protocol == "https" ? https : http);
        if (protocol == "https")
            extend(true, options, {
                agent: false,
                secureOptions: constants.SSLv3_method,
                strictSSL: false,
				//the below property has been removed as SSL has been configured
				rejectUnauthorized: false //put to suppress the Host Name not being from the alternate names assigned to the SSL certificate, avoids man-in-middle attacks
            });

        return _mhttp.request(options, cb);
    }

    return module;
}