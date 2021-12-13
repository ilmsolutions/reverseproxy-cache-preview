

module.exports = function (app, config) {
    var proxy = require('../utilities/api-proxy.js')(config),
        rewriterules = config.routertable.map(function (entry) {			
            return { protocol: entry.protocol, urlrewritepattern: entry.urlrewritepattern, key: (entry.host + (entry.port ? ':' + entry.port : '') + '/' + entry.name).toLowerCase(), value: ('/api/' + entry.name).toLowerCase() };
        }),
        urlrewrite = function (resp, rules, reqheaders) {
            var data = resp.data;
            rules.forEach(function (rule) {
			    var urlprefix = (reqheaders.protocol ? reqheaders.protocol : rule.protocol ? rule.protocol + ':' : 'http:') + '//' + reqheaders.host,
				    re = new RegExp(rule.urlrewritepattern, "ig");
	            //console.log(rule.urlrewritepattern);
				//console.log(urlprefix + rule.value);
            				
                data = data.replace(re, urlprefix + rule.value);
                //console.log(rule.key);
                //console.log(rule.value);
                //console.log("am content type " + resp.headers["content-type"]);
                //console.log(data);
            });
            //console.log(data);
            return data;
        };



    app.use(function (req, res, next) {
        console.log('intercepted %s', req.url);
        next();
    });

    app.get('/', function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Node app working!');
    });

    app.get('/cache/:id', function (req, res) {
        res.status(200).send('You asked for cache: ' + req.params.id);
    });

    app.get('/api/:service/*', function (req, res) {
        var routerentry = config.routertable.filter(function (entry) { return (entry.name.toLowerCase() == req.params.service.toLowerCase()) && (entry.methods.indexOf('get') >= 0); });
        if ((null != routerentry) && routerentry.length > 0) {
            //console.log(req.headers);
            //console.log(req.params.service);
            var callback = req.query.callback ? req.query.callback : null;             
            proxy.get(routerentry[0], '/' + req.params.service + '/' + req.params['0'], req.query, req.headers, function (err, resp) {
                if (err == null) {
                    // if ((null != req.params['0']) && (/\(xml\)/i.test(req.params['0'])))
                    //     res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf8' });
                    // else
                    //     res.writeHead(200, { 'Content-Type': 'application/json; charset=utf8' });
                    //console.log(JSON.stringify(resp));

                    //console.log("testing " + callback);
                    //console.log(resp.headers["content-type"]);

                    if (!callback) {
                        res.writeHead(resp.statusCode, { 'Content-Type': resp.headers["content-type"] });
                        res.write(urlrewrite(resp, rewriterules, req.headers));
                    }
                    else {
                        //console.log(JSON.stringify(resp));
                        //console.log(urlrewrite(resp, rewriterules, req.headers));
                        if (resp.statusCode == 200) {
                            res.status(resp.statusCode).jsonp(JSON.parse(urlrewrite(resp, rewriterules, req.headers)));
                        }
                        else {
                            console.error(new Error(JSON.stringify(resp)));
                            res.status(resp.statusCode).jsonp(JSON.parse(resp));
                        }
                    }
                }
                else {
				    //console.log('in routes');
                    //console.log(err);
                    res.status(err.status, { 'Content-Type': (err['content-type'] ?  err['content-type'] : 'application/html; charset=utf8') });
                    res.write(err.message);
                }
                res.end();
            });
        }
    });

    app.post('/api/:service/*', config.bodyParser, function (req, res) {
        var routerentry = config.routertable.filter(function (entry) { return (entry.name.toLowerCase() == req.params.service.toLowerCase()) && (entry.methods.indexOf('post') >= 0); });
        if ((null != routerentry) && routerentry.length > 0) {
            //console.log(req.headers);
            //var patt = "http://" + routerentry[0].host + (routerentry[0].port ? ":" + routerentry[0].port : ''),
            //     rpatt = req.headers.protocol + req.headers.host;
            proxy.post(routerentry[0], '/' + req.params.service + '/' + req.params['0'], req.query, req.headers, req.body, function (err, resp) {
                if (err == null) {
                    //console.log(JSON.stringify(resp));
                    res.writeHead(resp.statusCode, { 'Content-Type': resp.headers["content-type"] });
                    res.write(urlrewrite(resp, rewriterules, req.headers));
                }
                else {
                    res.status(err.status, { 'Content-Type': 'application/html; charset=utf8' });
                    res.write(err.message);
                }
                res.end();
            });
        }
        else
            res.status(404).send('Unable to find this resource');
    });

    app.get('/api/clear/:service/*', function(req, res){
		res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Clear Service!');   
	});
	
    app.use(function (req, res, next) {
        res.status(404).send('Unable to find this resource');
    });
}