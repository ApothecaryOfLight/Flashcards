//import { init_log, log } from logging.js
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
app.use( body_parser.json() );

const mysql = require('mysql2');

const sqlPool = mysql.createPoolPromise({
  host: 'localhost',
  user: 'Flashcards_User',
  password: 'Flashcards_Password',
  database: 'Flashcards',
  connectionLimit: 45
});

sqlPool.getConnection()
  .then( conn => {
    console.log( "Connected!" );
    launchRoutes();
  });

function launchRoutes() {
  app.get('/setlist', async function(req,res) {
    const [set_rows,field] = await sqlPool.query( "SELECT name, set_id FROM sets;" );
    /*let set_array = [];
    row.forEach( element => {
      set_array.push( element.name );
    });*/
    const setlist = JSON.stringify( set_rows );
    res.send( setlist );
  });

  app.post('/new_set', async function(req,res) {
    console.log( "New set." );

    //1) Get new set ID
    let new_set_id_query = "SELECT Flashcards.generate_new_id( 0 ) as new_id;";
    const [new_id_row,new_id_field] = await sqlPool.query( new_set_id_query );
    const new_set_id = new_id_row[0].new_id;

    //2) Insert new set name.
    let insert_query = "INSERT INTO sets (name,set_id) VALUES " +
      "( \'" + req.body.set_name + "\', " + new_set_id + " );";
    const [new_set_row,new_set_field] = await sqlPool.query( insert_query );

    //3) Notify client of success.
    //TODO: On success, on error handling.
    res.send( JSON.stringify({
      "result": "success",
      "set_name": req.body.set_name,
      "set_id": new_set_id
    }));
  });

  app.get('/set/:set_name', async function(req,res) {
    console.log( req.params.set_name );
    res.send( 'placeholder' );
  });

  app.post('/request', function(req,res) {
    console.dir( req );
    console.log( "reqqy" );
    res.send('yuuuup');
  });

  app.post('/new_card', async function(req,res) {
    const new_card_id_query = "SELECT Flashcards.generate_new_id(1) AS new_card_id;";
    const [new_card_id_row,new_card_id_field] = await sqlPool.query( new_card_id_query );
    const new_card_id = new_card_id_row[0].new_card_id;
    //TODO: On success, on error handling
    res.send( JSON.stringify({
      "result": "success",
      "card_id": new_card_id
    }));
  });

  app.listen(3000);
}
