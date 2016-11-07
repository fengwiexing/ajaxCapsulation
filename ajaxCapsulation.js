
//7，提供alwarys方法用来绑定 readystate==4时的回调，不管status为任何值，回调参数status, responseText, xhr;
//8 ，提供timeout方法设定超时时间并绑定超时处理函数
//ajax(options)
//.before(callback(xhr))
//.header(name, value)
//.headers({ headers})
//.get | post | other(url, [data], [contentType])
//.success(callback(retData, xhr), [jsonForceValidate = false])
//.error(callback(statusCode, responsetext, xhr))
//.always(callback(statusCode, responseText.xhr))
//.timeout(timeout, [callback(xhr)]);

//所有方法返回的都是一个对象，其中有abort方法，用于在连接请求时中止前一个请求

//调用示例，获取用户列表
//ajax().get("/users").success( fucntion(data){ console.log(data); console.log(typeof data);})
//

//对AJAX操作的封装，以方便使用
(function () {
    //初始化一个对象，用来发起AJAX请求
    //@param ｛object} options
    window.ajax = function (options) {

        // 默认参数
        var defaultOptions = {
            async: true,
            Caching:false//阻止IE缓存
        };
        //对象浅拷贝
        options = extend(defaultOptions, options);

        //核心功能对象 包含了XHR并实现了需求中各方法和属性

        var _obj = {
            xhr: createXhr(),//xhr对象
            successCallbacks: [],
            errorCallbacks: [],
            alwaysCallbacks: [],
            options: options
        };
        //设置前置处理方法 @param {Function} callback
        _obj.before = function (callback) {
            typeof (callback) === 'function' && callback(_obj.xhr);
            return _obj;
        }

        //设置单个请求头 header方法必须在get|post方法之前执行，否则请求已发送出再设置header没意义 @param {string} name @param {string} value
        _obj.header = function (name, value) {
            //ajax设置请求头方法，多次调用可以设置多个请求头
            _obj.xhr.setRequestHeader(name, value);
            return _obj;
        }
        //设置多个请求头 headers方法必须在get|post方法之前执行，否则请求已发送出再设置header没意义 @param {object} headers
        _obj.headers = function (headers) {
            if (isObject(headers)) {
                for (var name in headers) {
                    _obj.xhr.setRequestHeader(name, headers[name]);
                }
            }
            return _obj;
        }
        //成功时的回调 @param {function} callback  @param {boolean} jsonForcevalidate
        _obj.success = function (callback, jsonForceValidate) {
            _obj.jsonForceValidate = jsonForceValidate;

            if (typeof (callback) === 'function') {
                _obj.successCallbacks.push(callback);
            }

            return _obj;
        }

        //失败时的回调 @param {function} callback  
        _obj.error = function (callback) {
            if (typeof (callback) === 'function') {
                _obj.errorCallbacks.push(callback);
            }

            return _obj;
        }
        //执行完成时的回调，无论成功失败 @param { Function } callback
        _obj.always = function (callback) {
            if (typeof (callback) === 'function') {
                _obj.alwaysCallbacks.push(callback);
            }
            return _obj;
        }
        //设定超时时间并绑定超时回调 @param  {object} timeout  @param  {Function} callback
        _obj.timeout = function (timeout, callback) {
            _obj.xhr.timeout = timeout;

            if (typeof (callback) === 'functioon') {
                _obj.xhr.ontimeout = function () {
                    callback(_obj.xhr);
                }
            }
            return _obj;
        }
        //以get 方法发起请求
        _obj.get = function (url, data) {
            if (typeof (url) === 'undefined') throw 'url 不能为空';
            if (!isObject(data)) data = undefined;

            doAjax(_obj, 'get', url, data, 'urlencoded');

            return _obj;
        }
        //以post 方法发起请求
        _obj.post = function (url, data, contentType) {
            if (typeof (url) === 'undefined') throw 'url 不能为空';
            if (!isObject(data)) data = undefined;
            if (typeof (contentType) !== 'string') contentType = 'urlencoded';

            doAjax(_obj, 'post', url, data, contentType);

            return _obj;
        }

        //中止ajax请求
        _obj.abort = function () {
            _obj.xhr.abort();
        }

        return _obj;
    }
    //检查是否是对象
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]'
    }
    //1，创建XMLHttpReqeust对象
    function createXhr(){
        var xhr;
        if (window.XMLHttpRequest) {

            xhr = new XMLHttpRequest();

        } else if (window.ActiveXObject) {

            var aVersions = ["Microsoft.XMLHttp", "MSXML2.XMLHttp.5.0", "MSXML2.XMLHttp.4.0", "MSXML2.XMLHttp.3.0", "MSXML2.XMLHttp"];

            for (var i = 0; i < aVersions.length; i++) {
                try {
                    xhr = new ActiveXObject(aVersions[i]);
                    return;
                }
                catch (oError) { }
            }
        } else { return xhr = null; }
        return xhr;
    }


    // 对象浅拷贝， 用obj2成员值替换obj1成员值
    function extend(obj1, obj2) {
        if (isObject(obj1) && isObject(obj2)) {
            for (var pname in obj2) {
                obj1[pname] = obj2[pname];
            }
        }
        return obj1;
    }



    //@param {object} url   @param {object} data   @param {object} contentType 
    function doAjax(_obj, method, url, data, contentType) {
        var xhr = _obj.xhr;

        //编码数据对象
        data = encodeData(_obj,data, contentType);

        //每次请求加一个当前时间，防止IE缓存数据
        if (!_obj.options.Caching) {
            url += (url.indexOf("?") == -1 ? '?' : '&') + "t=" + new Date().getTime();
        }

        //如果是GET请求，将编码后的DATA做为查询参数附加到url上
        if ('get' === method) {
            url += (url.indexOf('?') == -1 ? '?' : '&') + data;
        }
        //绑定事件处理器
        bindEventHandler(xhr,_obj);
        //open
        xhr.open(method, url, _obj.options.async);

        //send
        if ('post' === method && data) {
            xhr.setRequestHeader('Content-Type', _obj.postContentType);
            xhr.send(data);
        } else {
            xhr.send();
        }
    }

    function encodeData(_obj,data, contentType) {
        if (isObject(data)) {
            //此处需要json转字符串，现代浏览器都支持内置的JSON对象，如果老浏览器不支持，可通过使用json2.js来模拟实现
            if ('json' === contentType.toLowerCase()//以application/json格式post数据
                && typeof (JSON) === 'object'       //支持JSON序列化
                && typeof (JSON.stringify) === 'function') {
            
                _obj.postContentType = 'application/json';

                return JSON.stringify(data);
            } else {
                //其它所有情况都做为urlencoded处理 
                _obj.postContentType = 'application/x-www-form-urlencoded';
                return encodeParam(data);
            }
        }
    }

    //以urlencoded方式编码数据 @param {object} data
    function encodeParam(data) {
        if (isObject(data)) {
            var params = [];
            for (var name in data) {
                var value = data[name];
                if (Object.prototype.toString.call(value) === '[object Array]') {
                    //如果是数组 需要组装成paraName=v1&paraName=v2这样的形式，便于后台以数据格式接收
                    for (var i = 0; i < value.length; i++) {
                        params.push(name + "=" + encodeURIComponent(value[i]));
                    }

                } else {
                    params.push(name + "=" + encodeURIComponent(data[name]));//encodeURIComponent方法用于编码以防乱码
                }
            }
            return params.join("&");
        }

    }
   //转JSON  @param {string}  text
        function toJson(text) {
            var json;
            try {
                //尝试将结果转为JSON对象 优先使用JSON.PARSE，如果浏览器不支持内置json对象，则以eval方式执行
                if (typeof (JSON) === 'object' && typeof (JSON.parse) === 'function') {
                    json = JSON.parse(text);
                } else {
                    json = eval(text);
                }

            } catch (e) { }
            return json;
        }
 //绑定readydtatechange事件处理器
    function bindEventHandler(xhr, _obj) {

            xhr.onreadystatechange = function () {
                //仅当请求完成时执行处理
                if (xhr.readyState == 4) {
                    var i, len;
                    //如果有always回调，先执行always
                    for (i = 0, len = _obj.alwaysCallbacks.length; i < len; i++) {
                        _obj.alwaysCallbacks[i](xhr.status, xhr.responseText, xhr);
                    }

                    //根据是否成功，决定调用success  or  error
                    var resText = xhr.responseText;
                    var resJson = toJson(resText);

                    if (xhr.status == 200) {
                        if (_obj.jsonForceValidate && typeof (resJson) === 'undefined') {
                            //强制json格式验证且转换失败，触发errorCallback
                            for (i = 0, len = _obj.errorCallbacks.length; i < len; i++) {
                                _obj.errorCallbacks[i](xhr.status, xhr.responseText, xhr);
                            }
                        } else {
                            for (i = 0, len = _obj.successCallbacks.length; i < len; i++) {
                                _obj.successCallbacks[i](resJson || resText, xhr);
                            }
                        }
                    } else {
                        //非200 状态调用 errorCallback
                        for (i = 0, len = _obj.errorCallbacks.length; i < len; i++) {
                            _obj.errorCallbacks[i](xhr.status, xhr.responseText, xhr);
                        }
                    }
                }
            }
        }

})();

