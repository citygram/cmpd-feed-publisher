var pg = require('pg');

var connString = process.env.DATABASE_URL || 'postgres://localhost:5432/cmpd_feed';
var client = new pg.Client(connString);

client.connect();

var query = client.query("CREATE TABLE IF NOT EXISTS events (event_no varchar(255) PRIMARY KEY, open boolean, message varchar(200), lat decimal(9,6), lon decimal(9,6), creation timestamp)");
query.on('end', function() { client.end(); });