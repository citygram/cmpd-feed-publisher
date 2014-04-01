var express = require("express");
var logfmt  = require("logfmt");
var request = require("request");
var xml2js  = require('xml2js').parseString;
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  request("http://maps.cmpd.org/datafeeds/accidentsgeorss.ashx", function(error, response, body) {
    xml2js(body, function (err, result) {
      var r = result.rss.channel[0];

      var data = { 
        "publisher": "CMPD",
        "notifications": []
      };
      
      // Loop through different accidents/obstructions in CMPD's georss feed.
      r.item.forEach(function(item) {
        var notification = {};
        
        notification.message = item.title[0];
        latlon = item["georss:point"][0].split(" ");
        notification.lat = latlon[0];
        notification.lon = latlon[1];

        data.notifications.push(notification);
      });


      // Build feed!
      res.set('Content-Type', 'application/json');
      res.send(data);
    });
  });
});


var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});