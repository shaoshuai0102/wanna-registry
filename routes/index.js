var fs = require('fs'),
    shell = require('shelljs');

/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Wanna Themes' });
};

exports.getTheme = function(req, res) {
    res.json({
        name: 'default'
    });
};

exports.createTheme = function(req, res) {
    var themename = req.params.themename,
        version = req.params.version;

    var _tmp_dir_ = global.config['tmp_dir'],
        _themes_dir_ = global.config['themes_dir'];


    var path_tmp = _tmp_dir_ + '/' + themename + '/' + version,
        path_theme = _themes_dir_ + '/' + themename + '/' + version;
    switch (req.headers['content-type']) {
        case 'application/json':

            // validation
            if ( themename != req.body.name || version != req.body.version) {
                res.send(400, 'requested url is not consistent with request body');
                return;
            }

            shell.mkdir('-p', path_tmp);

            fs.writeFileSync(path_tmp + '/config.json', JSON.stringify(req.body));
            res.send(200);
            break;
        case 'application/x-tar-gz':
            console.log(req.body);
            shell.rm('-f', path_tmp + '/' + themename + '-' + version + '.tgz');
            req.on('data', function(data) {
                fs.appendFileSync(path_tmp + '/' + themename + '-' + version + '.tgz', data);
            })
            .on('end', function(err) {
                if (err) {
                    console.log(err);
                    res.send(500);
                }

                console.log('upload success');
                if (fs.existsSync(path_tmp + '/config.json')) {
                    var config = require(path_tmp + '/config.json');
                    config.tarball = 'http://registry.wannajs.org/' + themename + '/' + version + '/' + themename + '-' + version + '.tgz';
                    console.log('config', config);
                    fs.writeFileSync(path_tmp + '/config.json', JSON.stringify(config));
                    shell.mkdir('-p', path_theme);
                    shell.cp('-R', path_tmp + '/*', path_theme);
                    res.send(200);
                } else {
                    res.send(400, 'send config.json first please');
                }
            });

            break;
    }

};
