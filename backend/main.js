/* Async */
const nonsync = require("async");

/*Error logging*/
const logging = require('./logging.js');
logging.init_log();

/* Express */
const express = require('express');
const app = express();

/*CORS*/
const cors = require('cors');
app.use(cors());

/*Body data*/
const body_parser = require('body-parser');
app.use( body_parser.json({limit:'20mb'}) );

/*mySQL*/
const mysql = require('mysql2');

/*mySQL Code*/
const sqlPool = mysql.createPoolPromise({
  host: 'localhost',
  user: 'Flashcards_User',
  password: 'Flashcards_Password',
  database: 'Flashcards',
  connectionLimit: 45,
  multipleStatements: true
});

/*HTTPS*/
const fs = require('fs');
const https = require('https');
var privateKey;
var certificate;
var credentials;

/*Error logging*/
const error_log = require('./javascript/error_log.js');

/*Sanitizer*/
const sanitizer = require('./javascript/sanitizer.js');

/*Indexer*/
const indexer = require('./javascript/indexer.js');

/*Cards*/
const cards = require('./javascript/cards.js');

/*Cardlist*/
const cardlist = require('./javascript/cardlist.js');

/*Sets*/
const sets = require('./javascript/sets.js');

/*Setlist*/
const setlist = require('./javascript/setlist.js');

/*Temporary Sets*/
const temporary_set = require('./javascript/temporary_set.js');

/*Search*/
const search = require('./javascript/search.js');

/*Pagiantion*/
const pagination = require('./javascript/pagination.js');

/*Login*/
const login = require('./javascript/login.js');

if( process.argv[2] == "https" ) {
  privateKey = fs.readFileSync('../privkey.pem');
  certificate = fs.readFileSync('../fullchain.pem');
  credentials = {key: privateKey, cert: certificate};
}

try {
  sqlPool.getConnection()
    .then( conn => {
      console.log( "Connected to database!" );
      launchRoutes();
    });
} catch( error ) {
  console.log( "MySQL database error!" );
}


/*Express Routes*/
function launchRoutes() {
  error_log.atttach_get_error_log_route( error_log, app, sqlPool );
  error_log.atttach_get_event_log_route( error_log, app, sqlPool );

  setlist.attach_setlist_page_num_route( error_log, app, sqlPool );

  cardlist.attach_cardlist_page_num_route( error_log, app, sqlPool );

  sets.attach_new_set_route( error_log, app, sqlPool, indexer, sanitizer );

  login.attach_login_route( error_log, app, sqlPool );

  login.attach_create_account_route( error_log, app, sqlPool );

  cards.attach_add_card_route( error_log, app, sqlPool, indexer, sanitizer, fs );

  sets.attach_update_sets_route( error_log, app, indexer, sanitizer );

  cards.attach_update_card_route( error_log, app, sqlPool, indexer, sanitizer, fs );

  sets.attach_delete_set_route( error_log, app, sqlPool );

  cards.attach_delete_card_route( error_log, app, sqlPool, fs );

  cardlist.attach_get_cardlist_setid_route( error_log, app, sqlPool, fs );

  cards.atttach_get_card_card_id_route( error_log, app, sqlPool, fs );

  search.attach_searchlist_route( error_log, app, sqlPool );

  cards.attach_card_result_route( error_log, app, sqlPool );

  temporary_set.attach_temporary_set_route( error_log, app, sqlPool );

  pagination.attach_page_count_route( error_log, app, sqlPool );

  if( process.argv[2] == "https" ) {
    var server = https.createServer( credentials, app );
    server.listen( 3001 );
  } else {
    app.listen(3001);
  }
}