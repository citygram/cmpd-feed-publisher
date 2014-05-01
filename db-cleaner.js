var pg = require('pg');
var connString = process.env.DATABASE_URL || 'postgres://localhost:5432/cmpd_feed';

var client = new pg.Client(connString);
client.connect();

client.query("delete from events where creation < now() - interval '48' hour", function(err, result) {
  client.end();
}); 