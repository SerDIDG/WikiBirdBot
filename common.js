const window = {};

var cm = {
    '_debug' : true,
    '_debugAlert' : false,
    '_baseUrl': '/',
    '_pathUrl' : '',
    '_assetsUrl' : '/',
    '_config' : {
        'loadDelay' : 500,
        'requestDelay' : 300,
        'dateFormat' : '%Y-%m-%d',
        'dateTimeFormat' : '%Y-%m-%d %H:%i:%s',
        'dateFormatCase' : 'nominative',
        'timeFormat' : '%H:%i:%s',
        'displayDateFormat' : '%F %j, %Y',
        'displayDateTimeFormat' : '%F %j, %Y, %H:%i',
        'displayDateFormatCase' : 'nominative'
    },
    '_variables' : {
        '%baseUrl%' : 'cm._baseUrl',
        '%assetsUrl%' : 'cm._assetsUrl',
        '%pathUrl%' : 'cm._pathUrl',
        '%version%' : 'cm._version'
    },
    '_strings' : {
        'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        'days' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
};

/* ******* COMMON ******* */

cm._getVariables = function(){
    var data = {};
    cm.forEach(cm._variables, function(value, name){
        data[name] = cm.reducePath(value, window);
    });
    return data;
};

/* ******* OBJECTS AND ARRAYS ******* */

cm.isType = function(o, types){
    if(cm.isString(types)){
        return Object.prototype.toString.call(o) === '[object ' + types +']';
    }
    if(cm.isRegExp(types)){
        return types.test(Object.prototype.toString.call(o));
    }
    if(cm.isObject(types)){
        var match = false;
        cm.forEach(types, function(type){
            if(!match){
                match = Object.prototype.toString.call(o) === '[object ' + type +']';
            }
        });
        return match;
    }
    return false;
};

cm.isBoolean = function(o){
    return Object.prototype.toString.call(o) === '[object Boolean]';
};

cm.isString = function(o){
    return Object.prototype.toString.call(o) === '[object String]';
};

cm.isNumber = function(o){
    return Object.prototype.toString.call(o) === '[object Number]';
};

cm.isArray = Array.isArray || function(o){
    return Object.prototype.toString.call(o) === '[object Array]';
};

cm.isObject = function(o){
    return Object.prototype.toString.call(o) === '[object Object]';
};

cm.isArguments = function(o){
    return Object.prototype.toString.call(o) === '[object Arguments]';
};

cm.isFunction = function(o){
    return Object.prototype.toString.call(o) === '[object Function]';
};

cm.isRegExp = function(o){
    return Object.prototype.toString.call(o) === '[object RegExp]';
};

cm.isDate = function(o){
    return Object.prototype.toString.call(o) === '[object Date]';
};

cm.isFile = function(o){
    return Object.prototype.toString.call(o) === '[object File]';
};

cm.isWindow = function(o){
    return Object.prototype.toString.call(o) === '[object Window]' || Object.prototype.toString.call(o) === '[object global]';
};

cm.isNode = function(node){
    try{
        return !!(node && node.nodeType);
    }catch(e){}
    return false;
};

cm.isTextNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType === 3);
    }catch(e){}
    return false;
};

cm.isElementNode = function(node){
    try{
        return !!(node && node.nodeType && node.nodeType === 1);
    }catch(e){}
    return false;
};

cm.isTagName = function(node, tag){
    return cm.isElementNode(node) && node.tagName.toLowerCase() === tag.toLowerCase();
};

cm.isPlainObject = function(obj) {
    if (typeof obj === 'object' && obj !== null) {
        if (typeof Object.getPrototypeOf === 'function') {
            var proto = Object.getPrototypeOf(obj);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(obj) === '[object Object]';
    }
    return false;
};

cm.forEach = function(o, callback){
    if(!o || !(callback && typeof callback === 'function')){
        return o;
    }
    var i, l;
    // Objects
    if(cm.isObject(o)){
        for(var key in o){
            if(o.hasOwnProperty(key)){
                callback(o[key], key, o);
            }
        }
        return o;
    }
    // Arrays
    if(cm.isArray(o)){
        o.forEach(callback);
        return o;
    }
    // Numbers
    if(cm.isNumber(o)){
        for(i = 0; i < o; i++){
            callback(i);
        }
        return o;
    }
    // Default
    try{
        Array.prototype.forEach.call(o, callback);
    }catch(e){
        try{
            for(i = 0, l = o.length; i < l; i++){
                callback(o[i], i, o);
            }
        }catch(e){}
    }
    return o;
};

cm.forEachReverse = function(o, callback){
    if(!o){
        return null;
    }
    if(!callback){
        return o;
    }
    o.reverse();
    cm.forEach(o, callback);
    o.reverse();
    return o;
};

cm.merge = function(o1, o2){
    var o;
    if(!o2){
        if(cm.isArray(o1)){
            o2 = [];
        }else{
            o2 = {};
        }
    }
    if(!o1){
        if(cm.isArray(o2)){
            o1 = [];
        }else{
            o1 = {};
        }
    }
    if(cm.isObject(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item, key){
            try{
                if(item === undefined){
                    o[key] = item;
                }else if(item._isComponent){
                    o[key] = item;
                }else if(cm.isObject(item)){
                    if(cm.isObject(o[key])){
                        o[key] = cm.merge(o[key], item);
                    }else{
                        o[key] = cm.clone(item);
                    }
                }else if(cm.isArray(item)){
                    o[key] = cm.clone(item);
                }else{
                    o[key] = item;
                }
            }catch(e){
                o[key] = item;
            }
        });
    }else if(cm.isArray(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item){
            if(!cm.inArray(o, item)){
                o.push(item);
            }
        });
    }
    return o;
};

cm.extend = function(o1, o2, deep){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    var o;
    if(cm.isArray(o1)){
        o = o1.concat(o2);
        return o;
    }
    if(cm.isObject(o1)){
        o = cm.clone(o1);
        cm.forEach(o2, function(item, key){
            if(deep){
                o[key] = cm.extend(o[key], item);
            }else{
                o[key] = item;
            }
        });
        return o;
    }
    return o2;
};

cm.extract = function(o1, o2){
    if(!o1){
        return o2;
    }
    if(!o2){
        return o1;
    }
    var o;
    if(cm.isArray(o1)){
        o = o1.filter(function(value){
            return !cm.inArray(o2, value);
        });
    }
    return o;
};

cm.clone = function(o, cloneNode, deep){
    var newO;
    if(!o){
        return o;
    }
    cloneNode = cm.isUndefined(cloneNode) ? false : cloneNode;
    deep = cm.isUndefined(deep) ? true : deep;
    // Arrays
    if(cm.isType(o, 'Arguments')){
        return [].slice.call(o);
    }
    if(cm.isType(o, /Array|StyleSheetList|CSSRuleList|HTMLCollection|NodeList|DOMTokenList|FileList/)){
        if(deep){
            newO = [];
            cm.forEach(o, function(item){
                newO.push(cm.clone(item, cloneNode));
            });
            return newO;
        }else{
            return [].slice.call(o);
        }
    }
    // Objects
    if(cm.isObject(o) && !o._isComponent){
        newO = {};
        cm.forEach(o, function(item, key){
            if(deep){
                newO[key] = cm.clone(item, cloneNode);
            }else{
                newO[key] = item;
            }
        });
        return newO;
    }
    // Dates
    if(cm.isDate(o)){
        newO = new Date();
        newO.setTime(o.getTime());
        return newO;
    }
    // Nodes
    if(cm.isNode(o)){
        if(cloneNode){
            newO = o.cloneNode(true);
        }else{
            newO = o;
        }
        return newO;
    }
    // Other (make links)
    return o;
};

cm.getLength = function(o){
    // Array
    if(cm.isArray(o)){
        return o.length;
    }
    // Object
    var i = 0;
    cm.forEach(o, function(){
        i++;
    });
    return i;
};

cm.getCount = function(o){
    var i = 0;
    cm.forEach(o, function(item){
        if(!cm.isUndefined(item)){
            i++;
        }
    });
    return i;
};

cm.arrayIndex = function(a, item){
    return Array.prototype.indexOf.call(a, item);
};

cm.inArray = function(a, item){
    if(cm.isString(a)){
        return a === item;
    }
    if(cm.isArray(a)){
        return a.indexOf(item) > -1;
    }
    return false
};

cm.arrayRemove = function(a, item){
    var index = cm.arrayIndex(a, item);
    if(index > -1){
        a.splice(index, 1);
    }
    return a;
};

cm.arrayAdd = function(a, item){
    if(!cm.inArray(a, item)){
        a.push(item);
    }
    return a;
};

cm.arraySort = function(a, key, dir){
    if(!cm.isArray(a)){
        return a;
    }
    var newA = cm.clone(a);
    dir = cm.isUndefined(dir) ? 'asc' : dir.toLowerCase();
    dir = cm.inArray(['asc', 'desc'], dir) ? dir : 'asc';
    switch(dir){
        case 'asc':
            newA.sort(function(a, b){
                if(key){
                    return (a[key] < b[key]) ? 1 : ((a[key] > b[key]) ? -1 : 0);
                }else{
                    return (a < b) ? 1 : ((a > b) ? -1 : 0);
                }
            });
            break;
        case 'desc' :
            newA.sort(function(a, b){
                if(key){
                    return (a[key] < b[key]) ? -1 : ((a[key] > b[key]) ? 1 : 0);
                }else{
                    return (a < b) ? -1 : ((a > b) ? 1 : 0);
                }
            });
            break;
    }
    return newA;
};

cm.arrayParseFloat = function(a){
    return a.map(Number.parseFloat);
};

cm.objectToArray = function(o){
    if(!cm.isObject(o)){
        return [o];
    }
    var a = [];
    cm.forEach(o, function(item){
        if(!cm.isEmpty(item)){
            a.push(item);
        }
    });
    return a;
};

cm.arrayToObject = function(a){
    var o = {};
    a.forEach(function(item, i){
        if(typeof item === 'object'){
            o[i] = item;
        }else{
            o[item] = item;
        }
    });
    return o;
};

cm.objectReplace = function(o, vars){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(cm.isObject(value)){
            newO[key] = cm.objectReplace(value, vars);
        }else if(cm.isString(value)){
            newO[key] = cm.strReplace(value, vars);
        }
    });
    return newO;
};

cm.isEmpty = function(value){
    if(cm.isUndefined(value)){
        return true;
    }
    if(cm.isBoolean(value)){
        return value === false;
    }
    if(cm.isString(value) || cm.isArray(value)){
        return value.length === 0;
    }
    if(cm.isObject(value)){
        return cm.getLength(value) === 0;
    }
    return false;
};

cm.isUndefined = function(value){
    return typeof value === 'undefined' || value === undefined || value === null;
};

cm.objectFormPath = function(name, apply){
    var newO = {},
        tempO = newO,
        nameO = name.toString().split('.'),
        nameL = nameO.length;
    nameO.map(function(item, i){
        if(apply && (nameL === i + 1)){
            tempO[item] = apply;
        }else{
            tempO = tempO[item] = {};
        }
    });
    return newO;
};

cm.objectPath = function(name, obj){
    if(cm.isUndefined(obj) || cm.isUndefined(name)){
        return obj;
    }
    name = name.toString().split('.');
    var findObj = obj;
    cm.forEach(name, function(item){
        if(findObj){
            findObj = findObj[item];
        }
    });
    return findObj;
};

cm.objectSelector = function(name, obj, apply){
    if(cm.isUndefined(obj) || cm.isUndefined(name)){
        return obj;
    }
    name = name.toString().split('.');
    var findObj = obj,
        length = name.length;
    cm.forEach(name, function(item, key){
        if(!findObj[item]){
            findObj[item] = {};
        }
        if(apply && key === length -1){
            findObj[item] = apply;
        }
        findObj = findObj[item];
    });
    return findObj;
};

cm.reducePath = function(name, obj){
    if(cm.isUndefined(obj) || cm.isUndefined(name)){
        return obj;
    }
    name = name.toString().split('.');
    return name.reduce(function(object, property){
        return object[property];
    }, obj);
};

cm.sort = function(o){
    var a = [];
    cm.forEach(o, function(item, key){
        a.push({'key' : key, 'value' : item});
    });
    a.sort(function(a, b){
        return (a['key'] < b['key']) ? -1 : ((a['key'] > b['key']) ? 1 : 0);
    });
    o = {};
    a.forEach(function(item){
        o[item['key']] = item['value'];
    });
    return o;
};

cm.replaceDeep = function(o, from, to){
    var newO = cm.clone(o);
    cm.forEach(newO, function(value, key){
        if(typeof value === 'object'){
            newO[key] = cm.replaceDeep(value, from, to);
        }else{
            newO[key] = value.replace(from, to);
        }
    });
    return newO;
};

/* ******* EVENTS ******* */

cm.debounce = function(func, wait, immediate){
    var timeout, result;
    return function(){
        var context = this, args = arguments;
        var later = function(){
            timeout = null;
            if(!immediate){
                result = func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if(callNow){
            result = func.apply(context, args);
        }
        return result;
    };
};


cm.dataURItoBlob = function(dataURI){
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {'type': mimeString});
};

/* ******* FORM ******* */

cm.constraintsPattern = function(pattern, match, message){
    var test,
        testPattern;
    return function(data){
        testPattern = cm.isFunction(pattern) ? pattern(data) : pattern;
        if(cm.isRegExp(testPattern)){
            test = testPattern.test(data['value']);
        }else{
            test = testPattern === data['value'];
        }
        data['pattern'] = testPattern;
        data['message'] = message;
        data['valid'] = match? test : !test;
        return data;
    }
};

cm.constraintsCallback = function(callback, message){
    return function(data){
        data['message'] = message;
        data['valid'] = cm.isFunction(callback) ? callback(data) : function(){};
        return data;
    }
};

/* ******* STRINGS ******* */

cm.toFixed = function(n, x){
    return parseFloat(n).toFixed(x);
};

cm.toNumber = function(str){
    return parseInt(str.replace(/\s+/, ''));
};

cm.decode = function(str){
    return decodeURI(str);
};

cm.RegExpEscape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

cm.strWrap = function(str, symbol){
    str = str.toString();
    return ['', str, ''].join(symbol);
};

cm.strReplace = function(str, vars){
    if(vars && cm.isObject(vars)){
        str = str.toString();
        cm.forEach(vars, function(item, key){
            if(cm.isObject(item)){
                item = JSON.stringify(item);
            }
            str = str.replace(new RegExp(key, 'g'), item);
        });
    }
    return str;
};

cm.reduceText = function(str, length, points){
    str = str.toString();
    points = cm.isUndefined(points) ? false : points;
    if(str.length > length){
        return str.slice(0, length) + ((points) ? '…' : '');
    }else{
        return str;
    }
};

cm.reduceTextSmart = function(str, length, points){
    if(str.length <= length){
        return str;
    }
    var split = str.split(/[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+/),
        newStr = '',
        testStr = '',
        i = 0;
    while(split[i] && testStr.length <= length){
        newStr = testStr;
        testStr += ' ' + split[i];
        i++;
    }
    if(!cm.isUndefined(points)){
        newStr += '…';
    }
    return newStr;
};

cm.removeDanger = function(str){
    return str.replace(/(<|>|&lt;|&gt;)/gim, '');
};

cm.removeSpaces = function(str){
    return str.replace(/[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+/g, '');
};

cm.cutHTML = function(str){
    return str.replace(/<[^>]*>/g, '');
};

cm.splitNumber = function(str){
    return str.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
};

cm.getPercentage = function(num, total){
    return num / total / 100;
};

cm.rand = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

cm.isEven = function(num){
    return /^(.*)(0|2|4|6|8)$/.test(num);
};

cm.addLeadZero = function(x){
    x = parseInt(x, 10);
    return x < 10 ? '0' + x : x;
};

cm.plural = cm.getNumberDeclension = function(number, titles /* ['найдена', 'найдено', 'найдены'] */){
    var cases = [2, 0, 1, 1, 1, 2];
    return titles[
        (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]
    ];
};

cm.toRadians = function(degrees) {
    return degrees * Math.PI / 180;
};

cm.toDegrees = function(radians) {
    return radians * 180 / Math.PI;
};

/* ******* DATE AND TIME ******* */

cm.isDateValid = function(date){
    return (cm.isDate(date) && !isNaN(date.valueOf()));
};

cm.getCurrentDate = function(format){
    format = format || cm._config.dateTimeFormat;
    return cm.dateFormat(new Date(), format);
};

cm.dateFormat = function(date, format, langs, formatCase){
    if(cm.isDate(date)){
        date = new Date(+date);
    }else if(cm.isString(date)){
        date = new Date(date);
    }
    if(isNaN(date)){
        date = null;
    }
    // Validate format
    format = cm.isString(format) ? format : cm._config.dateTimeFormat;
    formatCase = cm.isString(formatCase) ? formatCase : cm._config.dateFormatCase;
    // Validate language strings
    langs = cm.merge({
        'months' : cm._strings.months,
        'days' : cm._strings.days
    }, langs);
    // Validate language case
    if(cm.isObject(langs['months']) && langs['months'][formatCase]){
        langs['months'] = langs['months'][formatCase]
    }
    // Define format variables
    var convertFormats = {
        '%Y%' : '%Y',
        '%m%' : '%m',
        '%n%' : '%n',
        '%F%' : '%F',
        '%d%' : '%d',
        '%j%' : '%j',
        '%l%' : '%l',
        '%a%' : '%a',
        '%A%' : '%A',
        '%g%' : '%g',
        '%G%' : '%G',
        '%h%' : '%h',
        '%H%' : '%H',
        '%i%' : '%i',
        '%s%' : '%s'
    };
    var formats = function(date){
        return {
            '%Y' : function(){
                return date ? date.getFullYear() : '0000';
            },
            '%m' : function(){
                return date ? cm.addLeadZero(date.getMonth() + 1) : '00';
            },
            '%n' : function(){
                return date ? (date.getMonth() + 1) : '00';
            },
            '%F' : function(){
                return date ? langs['months'][date.getMonth()] : '00';
            },
            '%d' : function(){
                return date ? cm.addLeadZero(date.getDate()) : '00';
            },
            '%j' : function(){
                return date ? date.getDate() : '00';
            },
            '%l' : function(){
                return date ? langs['days'][date.getDay()] : '00';
            },
            '%a' : function(){
                return date ? (date.getHours() >= 12? 'pm' : 'am') : '';
            },
            '%A' : function(){
                return date ? (date.getHours() >= 12? 'PM' : 'AM') : '';
            },
            '%g' : function(){
                return date ? (date.getHours() % 12 || 12) : '00';
            },
            '%G' : function(){
                return date ? date.getHours() : '00';
            },
            '%h' : function(){
                return date ? cm.addLeadZero(date.getHours() % 12 || 12) : '00';
            },
            '%H' : function(){
                return date ? cm.addLeadZero(date.getHours()) : '00';
            },
            '%i' : function(){
                return date ? cm.addLeadZero(date.getMinutes()) : '00';
            },
            '%s' : function(){
                return date ? cm.addLeadZero(date.getSeconds()) : '00';
            }
        };
    };
    format = cm.strReplace(format, convertFormats);
    format = cm.strReplace(format, formats(date));
    return format;
};

cm.parseDate = function(str, format){
    if(!str){
        return null;
    }
    var date = new Date(),
        convert = {
            '%Y%' : 'YYYY',
            '%m%' : 'mm',
            '%d%' : 'dd',
            '%H%' : 'HH',
            '%i%' : 'ii',
            '%s%' : 'ss',
            '%Y' : 'YYYY',
            '%m' : 'mm',
            '%d' : 'dd',
            '%H' : 'HH',
            '%i' : 'ii',
            '%s' : 'ss'
        },
        helpers = {
            'YYYY' : function(value){
                return (value !== '0000') ? value : date.getFullYear();
            },
            'mm' : function(value){
                return (value !== '00') ? value - 1 : date.getMonth();
            },
            'dd' : function(value){
                return (value !== '00') ? value : date.getDate();
            },
            'HH' : function(value){
                return value;
            },
            'ii' : function(value){
                return value;
            },
            'ss' : function(value){
                return value;
            }
        },
        parsed = {
            'YYYY' : '0000',
            'mm' : '00',
            'dd' : '00',
            'HH' : '00',
            'ii' : '00',
            'ss' : '00'
        },
        fromIndex = 0;
    format = cm.isString(format) ? format : cm._config.dateTimeFormat;
    format = cm.strReplace(format, convert);
    cm.forEach(helpers, function(item, key){
        fromIndex = format.indexOf(key);
        while(fromIndex !== -1){
            parsed[key] = item(str.substr(fromIndex, key.length));
            fromIndex = format.indexOf(key, fromIndex + 1);
        }
    });
    return new Date(parsed['YYYY'], parsed['mm'], parsed['dd'], parsed['HH'], parsed['ii'], parsed['ss']);
};

cm.parseFormatDate = function(str, format, displayFormat, langs, formatCase){
    format = format || cm._config.dateFormat;
    displayFormat = displayFormat || cm._config.displayDateFormat;
    formatCase = formatCase|| cm._config.displayDateFormatCase;
    var date = cm.parseDate(str, format);
    return cm.dateFormat(date, displayFormat, langs, formatCase);
};

cm.parseFormatDateTime = function(str, format, displayFormat, langs, formatCase){
    format = format || cm._config.dateTimeFormat;
    displayFormat = displayFormat || cm._config.displayDateTimeFormat;
    formatCase = formatCase|| cm._config.displayDateFormatCase;
    var date = cm.parseDate(str, format);
    return cm.dateFormat(date, displayFormat, langs, formatCase);
};

cm.getWeek = function(date){
    var d = new Date();
    if(cm.isDate(date)){
        d = new Date(+date);
    }else if(cm.isString(date)){
        d = new Date(date);
    }
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

cm.getWeeksInYear = function(year){
    year = !year ? new Date().getFullYear() : year;
    var date = new Date(year, 11, 31),
        week = cm.getWeek(date);
    return week === 1 ? cm.getWeek(date.setDate(24)) : week;
};

/* ******* STYLES ******* */

cm.getStyleDimension = function(value){
    var pure = value.toString().match(/\d+(\D*)/);
    return pure ? pure[1] : '';
};

cm.styleToNumber = function(data){
    data = parseFloat(data.toString().replace(/(pt|px|%)/g, ''));
    data = isNaN(data)? 0 : data;
    return data;
};

cm.hex2rgb = function(hex){
    return(function(v){
        return [v >> 16 & 255, v >> 8 & 255, v & 255];
    })(parseInt(hex, 16));
};

cm.rgb2hex = function(r, g, b){
    var rgb = [r, g, b];
    for(var i in rgb){
        rgb[i] = Number(rgb[i]).toString(16);
        if(rgb[i] == '0'){
            rgb[i] = '00';
        }else if(rgb[i].length === 1){
            rgb[i] = '0' + rgb[i];
        }
    }
    return '#' + rgb.join('');
};

cm.styleStrToKey = function(line){
    line = line.replace(/\s/g, '');
    if(line === 'float'){
        line = ['cssFloat', 'styleFloat'];
    }else if(line.match('-')){
        var st = line.split('-');
        line = st[0] + st[1].replace(st[1].charAt(0), st[1].charAt(0).toUpperCase());
    }
    return line;
};

cm.inRange = function(a1, b1, a2, b2){
    return a1 >= a2 && a1 <= b2 || b1 >= a2 && b1 <= b2 || a2 >= a1 && a2 <= b1
};

cm.CSSValuesToArray = function(value){
    if(cm.isEmpty(value)){
        return [0, 0, 0, 0];
    }
    value = value.toString().replace(/[^\d\s-]/g , '').split(/\s+/);
    cm.forEach(value, function(item, key){
        value[key] = cm.isEmpty(item) ? 0 : parseFloat(item);
    });
    switch(value.length){
        case 0:
            value = [0, 0, 0, 0];
            break;
        case 1:
            value = [value[0], value[0], value[0], value[0]];
            break;
        case 2:
            value = [value[0], value[1], value[0], value[1]];
            break;
        case 3:
            value = [value[0], value[1], value[2], value[1]];
            break;
    }
    return value;
};

cm.arrayToCSSValues = function(a, units){
    units = !cm.isUndefined(units) ? units : 'px';
    cm.forEach(a, function(item, key){
        a[key] = cm.isEmpty(item) ? 0 : parseFloat(item);
    });
    return a.reduce(function(prev, next, index, a){
        return [prev + units, next + ((index === a.length - 1) ? units : '')].join(' ');
    });
};

cm.URLToCSSURL = function(url){
    return !cm.isEmpty(url) ? 'url("' + url + '")' : 'none';
};

/* ******* AJAX ******* */

cm.obj2URI = function(obj, prefix){
    var str = [],
        keyPrefix;
    cm.forEach(obj, function(item, key){
        if(!cm.isUndefined(item)){
            keyPrefix = !cm.isEmpty(prefix) ? prefix + "[" + key + "]" : key;
            if(typeof item === 'object'){
                str.push(cm.obj2URI(item, keyPrefix));
            }else{
                str.push([keyPrefix, encodeURIComponent(item)].join('='));
            }
        }
    });
    return !cm.isEmpty(str) ? str.join('&') : null;
};

cm.obj2Filter = function(obj, prefix, separator, skipEmpty){
    var data = {},
        keyPrefix;
    separator = !cm.isUndefined(separator) ? separator : '=';
    cm.forEach(obj, function(item, key){
        if(!skipEmpty || !cm.isEmpty(item)){
            keyPrefix = !cm.isEmpty(prefix) ? prefix + separator + key : key;
            if(cm.isObject(item)){
                data = cm.merge(data, cm.obj2Filter(item, keyPrefix, separator, skipEmpty))
            }else{
                data[keyPrefix] = item;
            }
        }
    });
    return data;
};

cm.obj2FormData = function(o){
    var fd = new FormData();
    cm.forEach(o, function(value, key){
        fd.append(key, value);
    });
    return fd;
};

cm.formData2Obj = function(fd){
    var o = {},
        data;
    if(fd.entries && (data = fd.entries())){
        cm.forEach(data, function(item){
            o[item[0]] = item[1];
        });
    }
    return o;
};

cm.formData2URI = function(fd){
    return cm.obj2URI(cm.formData2Obj(fd));
};

module.exports = cm;