//var express = require("express");
//var router = express.Router();

//router.all("127.0.0.1", function (req, resp) {
    
//    resp.send('您好：现在是' + new Date());
//});
//module.exports = router;

var express = require('express');
var app = express();

app.post('/abc', function (req, res) {
    res.send('post request');
})

app.get('/abc', function (req, res) {
    res.send('get request');
})
var server = app.listen(8081, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)

})