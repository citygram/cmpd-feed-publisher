var express = require("express");
var logfmt  = require("logfmt");
var pg = require('pg');
var connString = process.env.DATABASE_URL || 'postgres://localhost:5432/cmpd_feed';
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {

      var data = { 
        "publisher": "CMPD",
        "events": []
      };
      
      var client = new pg.Client(connString);
      client.connect();
      
      client.query("select message, lat, lon from events where creation > now() - interval '24' hour", function(err, result) {
        // Loop through different accidents/obstructions in CMPD's georss feed.
        result.rows.forEach(function(item) {
          var event = {};
          event.message = item.message;
          event.lat = item.lat;
          event.lon = item.lon;

          data.events.push(event);
        });

        // Build feed!
        res.set('Content-Type', 'application/json');
        res.send(data);

        client.end();
      });
    
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});