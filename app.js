
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path');

var app = express();


app.configure('development', function(){
    app.use(express.errorHandler());
    global.config = require(process.cwd() + '/config.json')['development'];
});

app.configure('production', function() {
    global.config = require(process.cwd() + '/config.json')['production'];
});

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser({ keepExtensions: true, uploadDir: global.config['tmp_dir'] }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/', routes.index);

app.get('/:themename', routes.getTheme);

app.get('/:themename/:version', routes.getThemeVersion);

app.put('/:themename/:version', routes.createTheme);

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
