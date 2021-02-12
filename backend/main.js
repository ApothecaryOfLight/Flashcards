/*
Flashcards NodeJS
*/
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

/*mySQL*/
const mysql = require('mysql2');

/*mySQL Code*/
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


/*Regex Processing*/
const replacement = {
"\/\/g" : "<ESCAPECHAR>",
"\/'\/g" : "<APOSTROPHE>",
"\/\"\/g" : "<QUOTATIONMARK>", 
"\/-/" : "<HYPHEN>",
"=" : "<EQUALS>"
}

function process_input( inText ) {
  let processed_text = "";
//1) Make sure there are no SQL-injection characters.


//2) Replace single and double quotation marks.
  //for( regex in replacement ) {
    processed_text = inText.replace(/['"]+/g,'&#39' );
  //}
//3) Replace line breaks.

//4) Replace equals signs.

//5) Ensure that the length of processed string is good.

  //return inText;
  return processed_text;
}


/*Express Routes*/
function launchRoutes() {
  app.get('/setlist', async function(req,res) {
    const [set_rows,field] = await sqlPool.query( "SELECT name, set_id FROM sets;" );
    const setlist = JSON.stringify( set_rows );
    res.send( setlist );
  });


  /*Add a new set of cards*/
  app.post('/new_set', async function(req,res) {
    //1) Get new set ID
    let new_set_id_query = "SELECT Flashcards.generate_new_id( 0 ) as new_id;";
    const [new_id_row,new_id_field] = await sqlPool.query( new_set_id_query );
    const new_set_id = new_id_row[0].new_id;

    //2) Insert new set name.
    let insert_query = "INSERT INTO sets (name,set_id) VALUES " +
      "( \'" + process_input(req.body.set_name) + "\', " + new_set_id + " );";
    const [new_set_row,new_set_field] = await sqlPool.query( insert_query );

    //3) Notify client of success.
    //TODO: On success, on error handling.
    res.send( JSON.stringify({
      "result": "success",
      "set_name": req.body.set_name,
      "set_id": new_set_id
    }));
  });


  /**/
  app.get('/set/:set_name', async function(req,res) {
    res.send( 'placeholder' );
  });


  /**/
  app.post('/request', function(req,res) {
    console.dir( req );
    console.log( "reqqy" );
    res.send('yuuuup');
  });

  app.post('/login', async function(req,res ) {
    const login_query = "SELECT password_hash FROM users WHERE " +
      "username_hash = \'" + req.body.username + "\';"
    const [login_row,login_field] = await sqlPool.query( login_query );
    const password_hash = String.fromCharCode.apply(null, login_row[0].password_hash);
    if( password_hash == req.body.password ) {
      res.send( JSON.stringify({
        "result": "approve"
      }));
    } else {
      res.send( JSON.stringify({
        "result": "refused",
        "reason": "Credentials failed to authenticate!"
      }));
    }
  });

  app.post('/create_account', async function(req,res) {
    const create_acct_query = "INSERT INTO users " +
    "( username_hash, password_hash )" +
    " VALUES ( \'" + req.body.username + "\', \'" + req.body.password + "\');";
    const [create_acct_row, create_acct_field] =
      await sqlPool.query( create_acct_query );
    res.send( JSON.stringify({
      "result": "approve"
    }));
  });

  /*Generate a new card ID.*/
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

  /*Add a new card*/
  app.post('/add_card', async function(req,res) {
    console.dir( req.body );

    const new_card_id_query = "SELECT Flashcards.generate_new_id(1) AS new_card_id;";
    const [new_card_id_row,new_card_id_field] = await sqlPool.query( new_card_id_query );
    const new_card_id = new_card_id_row[0].new_card_id;
    const new_card_query = "INSERT INTO cards (card_id,question,answer,set_id) " +
      "VALUES ( " + new_card_id + ", " +
      "\'" + process_input(req.body.question) + "\', " +
      "\'" + process_input(req.body.answer) + "\', " +
      req.body.set_id + ");"
    const [add_card_row,add_card_field] = await sqlPool.query( new_card_query );
    //TODO: On success, on error handling.
    res.send( JSON.stringify({
      "result": "success"
    }));
  });

  app.post( '/update_card', async function(req,res) {
    const update_card_query = "UPDATE cards SET " +
      "question = " + "\'" + req.body.question + "\', " +
      "answer = " + "\'" + req.body.answer + "\'" +
      "WHERE set_id = " + req.body.set_id +
      " AND card_id = " + req.body.card_id + ";";
    const [update_card_row,update_card_field] = await sqlPool.query( update_card_query );
    //TODO: On success, on error
    res.send( JSON.stringify({
      "result": "success"
    }));
  });

  app.post('/delete_set/:set_id', async function(req,res) {
    const delete_set_query = "DELETE FROM sets WHERE set_id = " + req.params.set_id + ";";
    const [delete_row,delete_field] = await sqlPool.query( delete_set_query );
    res.send( JSON.stringify( { result: "success" } ) );
  });

  app.post('/delete_card/:card_id', async function(req,res) {
    const delete_card_query = "DELETE FROM cards WHERE card_id = " + req.params.card_id + ";";
    const [delete_row,delete_field] = await sqlPool.query( delete_card_query );
    res.send( JSON.stringify( { result: "success" } ) );
  });

  app.get('/get_cardlist/:set_id', async function(req,res) {
    const get_cardlist_set_name_query = "SELECT name FROM sets WHERE set_id = " +
      req.params.set_id + ";";
    const [set_name_row,set_name_field] = await sqlPool.query( get_cardlist_set_name_query );
    const get_cardlist_cards = "SELECT card_id, answer, question FROM cards " +
      "WHERE set_id = "  + req.params.set_id + ";";
    const [cardlist_row,cardlist_field] = await sqlPool.query( get_cardlist_cards );
    const cardlist_obj = {
      result: "success",
      set_name: set_name_row[0],
      cards: cardlist_row
    };

    res.send( JSON.stringify( cardlist_obj ) );
  });

  app.get('/get_card/:card_id', async function(req,res) {
    const get_card_query = "SELECT question, answer FROM cards WHERE card_id = " +
      req.params.card_id + ";";
    const [card_row,card_field] = await sqlPool.query( get_card_query );
    const card_obj = {
      result: "success",
      card: card_row[0]
    }
    res.send( JSON.stringify( card_obj ) );
  });

  app.listen(3000);
}
