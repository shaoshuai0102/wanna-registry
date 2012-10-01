var fs = require('fs'),
    shell = require('shelljs');

/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', { title: 'Wanna Themes' });
};

exports.getTheme = function(req, res) {
    var themename = req.params.themename;

    var _themes_dir_ = global.config['themes_dir'];
    var path_theme = _themes_dir_ + '/' + themename;
    switch (req.headers['accept']) {
        case 'application/json':
            if (!fs.existsSync(path_theme + '/theme.json')) {
                res.send(404);
                return;
            }

            var config = require(path_theme + '/theme.json');
            res.json(config);
            break;
        default:
            res.send(400, 'wrong Accept in http header. ' + req.headers['accept'] + ' not supported.');
    }
};

exports.getThemeVersion = function(req, res) {
    var themename = req.params.themename,
        version = req.params.version;

    var _themes_dir_ = global.config['themes_dir'];

    if (version == 'latest') {
        var theme_json_file = _themes_dir_ + '/' + themename + '/theme.json';
        if (!fs.existsSync(theme_json_file)) {
            res.send(404);
            return;
        }
        var c = require(theme_json_file);
        version = c.versions.latest.version;
    }

    var path_theme = _themes_dir_ + '/' + themename + '/' + version;

    if (!fs.existsSync(path_theme)) {
        res.send(404);
        return;
    }

    switch (req.headers['accept']) {
        case 'application/json':
            var file = path_theme + '/theme.json';
            var config = require(file);
            res.json(config);
            break;
        case 'application/x-tar-gz':
            var file = path_theme + '/' + themename + '-' + version + '.tgz'
            res.sendfile(file);
            break;
        default:
            res.send(400, 'wrong Accept in http header. ' + req.headers['accept'] + ' not supported.');
    }
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

            fs.writeFileSync(path_tmp + '/theme.json', JSON.stringify(req.body));
            res.send(200);
            break;
        case 'application/x-tar-gz':
            shell.rm('-f', path_tmp + '/' + themename + '-' + version + '.tgz');
            req.on('data', function(data) {
                fs.appendFileSync(path_tmp + '/' + themename + '-' + version + '.tgz', data);
            })
            .on('end', function(err) {
                if (err) {
                    console.error(err);
                    res.send(500);
                    return;
                }

                if (fs.existsSync(path_tmp + '/theme.json')) {
                    var config = require(path_tmp + '/theme.json');
                    config.tarball = 'http://registry.wannajs.org/' + themename + '/' + version + '/' + themename + '-' + version + '.tgz';
                    fs.writeFileSync(path_tmp + '/theme.json', JSON.stringify(config));
                    shell.mkdir('-p', path_theme);
                    shell.cp('-Rf', path_tmp + '/*', path_theme);

                    var theme_config_file = _themes_dir_ + '/' + themename + '/theme.json';

                    if (fs.existsSync(theme_config_file))
                        var theme_config = require(theme_config_file);
                    else
                        var theme_config = {};

                    theme_config.name = themename;
                    theme_config.versions = theme_config.versions || {};
                    theme_config.versions[version] = config;

                    if (!theme_config.versions['latest'] || compareVersion(theme_config.versions['latest'].version, version) == -1)  {
                        theme_config.versions['latest'] = config;
                    }

                    fs.writeFileSync(theme_config_file, JSON.stringify(theme_config));
                    res.send(200);
                } else {
                    res.send(400, 'send theme.json first please');
                }
            });
            break;
        default:
            res.send(400, 'wrong content-type in http header. ' + req.headers['content-type'] + ' not supported.');
    }

};


function compareVersion(first, second) {
    var versionToArray = function(str) {
        var version = (str + '').split('.'),
            length = version.length, i = 0;
        for ( ; i < length; i++) {
            version[i] = parseInt(version[i], 10);
        }

        return version;
    }, length, i = 0, n1, n2;

    first = versionToArray(first);
    second = versionToArray(second);

    // if arrays are equal - we have equal versions
    if (first === second) {
        return 0;
    }

    length = Math.max(first.length, second.length);

    for ( ; i < length; i++) {
        n1 = first[i] || 0;
        n2 = second[i] || 0;
        if (n1 === n2) {
            continue;
        }

        return n1 - n2 > 0 ? 1 : -1;
    }
}
