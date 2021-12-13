var querystring = require("querystring"),
     commons = require("./commons");

module.exports = function (config) {
    var module = {},
        mhttp = require("./mhttp")(),       
        cachedb = require('../db/cache-db')(config),
		filterqueryparams = ["callback", "%7B%7D", "_"];

    module.post = function (router, path, query, headers, postdata, callback) {
        var querystr = querystring.stringify(query),
         options = {
             host: router.host,
             path: mhttp.formatpath(router.protocol, router.host, router.port, (router.subdirectory ? '/' + router.subdirectory: '') + path, querystr),
             port: router.port,
             method: 'POST',
             headers: headers
         },
        key = commons.keygen(path, querystr);

        //console.log(postdata);
        //console.log(options);
        var request = mhttp.request(router.protocol, options, function (response) {
            var pageData = "";

            response.on('data', function (chunk) {
                pageData += chunk;
            });

            response.on('end', function () {
                //console.log(pageData);
                callback(null, {
                    headers: response.headers,
                    statusCode: response.statusCode,
                    data: pageData
                });
                //callback(null, pageData);

                //expire similar cache entries to ensure that the call is routed to the API ensuring up to date content is being pulled
                //router.expire allows implementing custom expiration policy
                var _keys;

                if (router.cache.expire) {
                    _keys = router.cache.expire(router, key);
                }
                else
                    _keys = [key];

                _keys.forEach(function (_key) {
                    cachedb.remove(_key, function (value) {

                    });
                });



            });
        });

        request.write(postdata);
        request.end();
    }

    module.get = function (router, path, query, headers, callback) {
        var querystr = querystring.stringify(query).split("&").filter(function (elem) {
            var pair = elem.split("=");
            if (pair.length == 2) {
                return filterqueryparams.indexOf(pair[0]) < 0;
            }
            return false;
        }).join("&"),
	    options = {
	        host: router.host,
	        path: mhttp.formatpath(router.protocol, router.host, router.port, (router.subdirectory ? '/' + router.subdirectory: '') + path, querystr),
	        port: router.port,
	        headers: headers
	    },
       key = commons.keygen(path, querystr),
       cbgetserver = function (response) {
           var pageData = "";
           //console.log(JSON.stringify(response.headers));
           response.on('data', function (chunk) {
               pageData += chunk;
           });
           response.on('end', function () {
               var res = {
                   headers: response.headers,
                   statusCode: response.statusCode,
                   data: pageData
               };
               //console.log('api-proxy...');
               //console.log(JSON.stringify(res));
               //save to cache db
               //if it is a successful response && is set to use cache
               // && has no exception rule attached to it
               if (response.statusCode == 200 && router.cache.use == true &&
                        (!router.cache.exception || !router.cache.exception(key)))
                   cachedb.save(key, res);

               callback(null, res);
           });
       };

        if (router.cache.use == false) {
            //console.log('from server --' + key); 
            mhttp.get(router.protocol, options, cbgetserver);
        }
        else {
            cachedb.get(key, function (value) {
                if (null != value) {
                    //console.log('from cache --' + key);
                    if (!router.cache.authorise) {
                        callback(null, value);
                    }
                    else {					  
                        router.cache.authorise(router, path, headers, function (err) {
                            callback(err, value);
                        });
                    }

                }
                else {
                    //console.log(options);
                    //console.log('from server --' + key); 
                    mhttp.get(router.protocol, options, cbgetserver);
                }
            });
        }

    }

    return module;
}
