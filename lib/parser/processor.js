var fs     = require('file'),
    util   = require('util'),
   _fs     = require('../util/file.js'),
   _util   = require('../util/util.js'),
   _logger = require('../util/logger.js'),
   _Abstract   = require('../event.js'),
   _ConfParser = require('./config.js'),
   _HtmlParser = require('./html.js');
// deploy processor
var Processor = module.exports = function(file){
    _Abstract.apply(this,arguments);
    // exports process result
    this.result = {};
    this.config = null;
    // log information from parser
    var _doLog = function(type,event){
        var func = _logger[type];
        if (!!func){
            var args = event.data||[];
            args.unshift(event.message);
            func.apply(_logger,args);
        }
    };
    // private variables
    var _gLogConf = {
        debug:_doLog.bind(this,'debug'),
        info:_doLog.bind(this,'info'),
        warn:_doLog.bind(this,'warn')
    };
    // parse config file
    var _doParseConfig = function(file){
        var error = !1,
            config = _util.merge(_gLogConf,{
                error:function(event){
                    error = !0;
                   _doLog.call(this,'error',event);
                }
            });
        // parse config file
        this.config = new _ConfParser(file,config);
        // exit when config parse error
        if (error){
            _logger.dump2file(
                this.config.get('X_LOGGER_FILE')
            );
            process.exist(-1);
        }
    };
    // parse html files
    var _doParseHtmlFiles = function(key){
        // check root
        var root = this.config.get(key);
        if (!root) return;
        // init config
        var flag = this.config.get('X_NOPARSE_FLAG'),
            filter = this.config.get('FILE_FILTER'),
            prsConfig = {
                ignoreMode:this.config.get('X_RELEASE_MODE'),
                keepComment:this.config.get('X_KEEP_COMMENT'),
                notParseInlineStyle:flag==1||flag==3,
                notParseInlineScript:flag==2||flag==3
            },
            logConfig = _util.merge(_gLogConf,{
                error:function(event){
                    _doLog.call(this,'error',event);
                    process.exist(-1);
                }
            }),
            resConfig = {
                
            };
        // dump files and parse every file
        (this.config.get(key+'_SUB')||[root]).forEach(function(dir){
            var list = _fs.lsfile(dir,function(name,path){
                return !/^\./.test(name)&&(!filter||filter.test(path));
            });
            list.forEach(function(file){
                prsConfig.file = file;
                this.result[file] = new HtmlParser(
                    prsConfig,logConfig
                );
                this.result[file].parseResource(resConfig);
            },this);
        },this);
    };
    // start process
    _logger.info(
        'node version is %s, toolkit version is %s',
        process.version,require('../../package.json').version
    );
    // parse config file
    _doParseConfig.call(this,file);
    // update logger config
    _logger.config({
        level:this.config.get('X_LOGGER_LEVEL'),
        onlog:function(event){
            if (!!event.level){
                console.log(event.message);
            }
            fs.appendFileSync(
                this.config.get('X_LOGGER_FILE'),
                event.message
            );
        }
    });
    // parse html/template files
    _doParseHtmlFiles.call(this,'DIR_SOURCE');
    _doParseHtmlFiles.call(this,'DIR_SOURCE_TP');
};
util.inherits(Processor,_Abstract);