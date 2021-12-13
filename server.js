var express = require('express'),

    config = require('./config'),
//proxy = require('./controllers/api-proxy.js'),
    app = express();

require('./controllers/routes.js')(app, config);


app.listen(process.env.PORT || 8080);

//http.createServer(function (req, res) {
//    
//    res.writeHead(200, { 'Content-Type': 'text/html' });
//    res.end('Hello, world!');
//    
//}).listen(process.env.PORT || 8080);