var mhttp = require("./utilities/mhttp")(),
    getRawBody = require('raw-body');

module.exports = {
    bodyParser: function (req, res, next) {
        //console.log(req.headers['content-length']);
        //console.log(req.headers['content-type']);
        getRawBody(req, {
            length: req.headers['content-length'],
            limit: '5mb',
            encoding: "utf-8"
        }, function (err, string) {
            if (err)
                return next(err);
            req.body = string;
            next();
        });
    },
    routertable: [
       { name: 'PublicService', protocol: 'https', host: 'xxxx', port: '', subdirectory:'api' , methods: ['get'],
           urlrewritepattern: "https?:(\\\\?\/){2}xxxx\\\\?\/api\/service",
           cache: {
               use: true,
               exception: null,
               expire: null,
               authorise: null
           }
       },
       { name: 'NonPublicService', protocol: 'https', host: 'xxxx', port: '', subdirectory:'api', methods: ['get'],
           urlrewritepattern: "https?:(\\\\?\/){2}xxxx\\\\?\/api\/nonpublicservice",		 
           cache: {
               use: true,
               exception: function (key) {
                   //do not cache responses when the request is not associated with a particular domain id
                   if (!(/\/id\([0-9A-Za-z]*\)/ig).test(key))
                       return true;
                   return false;
               },
               expire: null,
               authorise: function (router, path, headers, callback) {
                   var matches = path.match(/\/\(([a-zA-Z]*)\)\/domain\((state|school|district)\)\/id\(([0-9A-Za-z]*)\)/i),
                       dataformat = path.match(/\/\((xml|json)\)$/ig);
                   //console.log(path);
                   //console.log(matches);
                   //console.log(dataformat);				   
                   if (matches && matches.length > 0 && dataformat && dataformat.length > 0) {
				       var authorisepath = ('/({0})/Domain({1})/Id({2})').replace('{0}', matches[1]).replace('{1}', matches[2]).replace('{2}', matches[3]),
                           options = {
                           host: router.host,
                           path: mhttp.formatpath(router.protocol, router.host, router.port, 
						                           (router.subdirectory ? '/' + router.subdirectory: '') 
												  + '/' + router.name 
												  + authorisepath + "/IsAuthorised" + dataformat[0],''),
                           port: router.port,
                           headers: headers
                       };
                       //console.log(options);
					   //console.log(router.protocol);
                       //console.log(headers);
                       mhttp.get(router.protocol, options, function (response) {
                           var pageData = "";
                           response.on('error', function () {
                               console.log('i am in error');
                           });
                           response.on('data', function (chunk) {
                                pageData += chunk;
                           });
                           response.on('end', function () {
                               //console.log('i am after authorise');
							   //console.log(response.statusCode);
                               var err = null;
                               if (response.statusCode != "200") {
                                   err = {
                                       status: response.statusCode,
                                       "content-type": response.headers['content-type'],
                                       message: pageData
                                   }
                               }

                               callback(err);
                           });
                       });
                   }
                   else {
                       var err = new Error('Unable to find Authorise API');
                       err.status = 500;
                       callback(err);
                   }

               }
           }
       },
       { name: 'NonPublicService', protocol: 'https', host: 'xxxx', port: '', subdirectory:'api', methods: ['post'],
           urlrewritepattern: "https?:(\\\\?\/){2}xxxx\\\\?\/api\/nonpublicservice",		 
           cache: {
               use: false,
               exception: null,
               expire: function (router, key) {
			       //console.log('in expire....');
				   //console.log(router);
                   //expire similar calls originating from different API end points or for different data formats
                   var _keys = [key.replace(/\(xml\)/ig, '(json)'), key.replace(/\(json\)/ig, '(xml)')],
                           _aliases = ["reportcardservice"],
                           _name = router.name.toLowerCase();

                   _aliases.forEach(function (_alias) {
                       _key = key.replace(_name, _alias).toLowerCase();
                       _keys.push(_key.replace(/\(xml\)/ig, '(json)'));
                       _keys.push(_key.replace(/\(json\)/ig, '(xml)'))
                   });
				   //console.log(_keys);
                   return _keys;
               },
               authorise: null
           }
       },	   
       { name: 'LearningResource', protocol: 'https', host: 'xxxx', port: '', subdirectory:'api', methods: ['get'],
           urlrewritepattern: "https?:(\\\\?\/){2}xxxx\\\\?\/api\/learningresource",
           cache: {
               use: true,
               exception: null,
               expire: null,
               authorise: null
           }
       } 
       ],
    cachedb: {
        connect: 'mongodb://xxxxxx/cache-db',
        expiration: (12 * 60 * 60)  //(12 * 60 * 60 = 12 hours) in seconds
    }
}
