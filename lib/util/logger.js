var util = require('util'),
    Emitter = require('events').EventEmitter;

var Logger = function(){
    Emitter.call(this);
    // enumerate level value
    this.LEVEL = {
        ALL   :  100,
        DEBUG :  4,
        INFO  :  3,
        WARN  :  2,
        ERROR :  1,
        OFF   : -1
    };
    // level config
    var _level = this.LEVEL.ALL;
    // private method
    var _doFormat = function(number){
        number = parseInt(number)||0;
        return (number<10?'0':'')+number;
    };
    var _getTime = function(){
        var time = new Date();
        return util.format(
            '%s-%s-%s %s:%s:%s.%s',
            time.getFullYear(),
            _doFormat(time.getMonth()+1),
            _doFormat(time.getDate()),
            _doFormat(time.getHours()),
            _doFormat(time.getMinutes()),
            _doFormat(time.getSeconds()),
            time.getMilliseconds()
        );
    };
    var _doLog = function(level){
        // check level
        var reqlv = this.LEVEL[level]||this.LEVEL.INFO;
        if (reqlv>_level){
            return;
        }
        // format log text
        var args = [].slice.call(arguments,1);
        args[0] = util.format(
            '[%s]\t%s\t-\t%s',
            level,_getTime(),args[0]
        );
        var text = util.format.apply(util,args);
        this.emit('log',{
            level:level,
            message:text
        });
    };
    // init config 
    this.config = function(config){
        config = config||{};
        _level = this.LEVEL[(config.level||'').toUpperCase()]||
                 this.LEVEL.ALL;
        if (!!config.onlog){
            this.on('log',config.onlog);
        }
    };
    // build interface
    ['debug','info','warn','error'].forEach(
        function(name){
            this[name] = function(){
                var args = [].slice.call(arguments,0);
                args.unshift(name.toUpperCase());
                _doLog.apply(this,args);
            };
        },this
    );
    // default log
    this.log = this.info;
};
util.inherits(Logger,Emitter);
// export api
module.exports = new Logger();