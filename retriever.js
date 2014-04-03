var pg = require('pg');
var request = require("request");
var xml2js  = require('xml2js').parseString;

var connString = process.env.DATABASE_URL || 'postgres://localhost:5432/cmpd_feed';
//var client = new pg.Client(conString);

var remote_feed = {};

request("http://maps.cmpd.org/datafeeds/accidentsgeorss.ashx", function(error, response, body) {
  xml2js(body, function (err, result) {
    var r = result.rss.channel[0];
    
    // Build remote_feed
    r.item.forEach(function(item) {
      var latlon = item["georss:point"][0].split(" ");

      var row = {};

      row.open = true;
      row.message = item.title[0];
      row.lat = latlon[0];
      row.lon = latlon[1];

      remote_feed[item.event_no[0]] = row;
    });

    pg.connect(connString, function(err, client, done){

      // Build db_feed
      client.query("select event_no, message, lat, lon from events where open = true", function(err, result) {
        var db_feed = [];

        result.rows.forEach(function(item) {
          // IF IN BOTH, IGNORE
          if(item.event_no in remote_feed) {
            console.log("No change to item:  " + item.event_no);
          }

          // IF IN DB BUT NOT FEED, MARK AS COMPLETE
          if(!(item.event_no in remote_feed)) {
            client.query("update events set open = false where event_no = '" + item.event_no + "'", function(err, result) {
              var q = "insert into events";
                  q += "(event_no, open, message, lat, lon, creation)";
                  q += "values";
                  q += "(";
                  q += "'C"+ item.event_no +"', ";
                  q += "false, ";
                  q += "'CLOSED: "+ item.message +"', ";
                  q += item.lat +", ";
                  q += item.lon +", ";
                  q += "now()";
                  q += ")";
              client.query(q, function(err, result) {
                console.log("Marked as closed: " + item.event_no);
              });
            });
          }

          db_feed.push(item.event_no);
        });

        Object.keys(remote_feed).forEach(function(item) {
          // IF IN FEED BUT NOT DB, ADD NEW RECORD
          if(db_feed.indexOf(item)==-1) {
            var q = "insert into events";
                q += "(event_no, open, message, lat, lon, creation)";
                q += "values";
                q += "(";
                q += "'"+ item +"', ";
                q += "true, ";
                q += "'"+ remote_feed[item].message +"', ";
                q += remote_feed[item].lat +", ";
                q += remote_feed[item].lon +", ";
                q += "now()";
                q += ")";
            
            client.query(q, function(err, result) {
              console.log("Added new item:   " + item);
            });
          }
        });
      });
      
      // Return DB connection to pool
      done();
    });
    
    // Close DB connection
    pg.end();
  });
});
