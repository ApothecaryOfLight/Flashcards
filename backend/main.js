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

/*HTTPS*/
const fs = require('fs');
const https = require('https');
var privateKey;
var certificate;
var credentials;

if( process.argv[2] == "https" ) {
  privateKey = fs.readFileSync('/home/ubuntu/Flashcards/privkey.pem');
  certificate = fs.readFileSync('/home/ubuntu/Flashcards/fullchain.pem');
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

function process_tag( inTag, replaceWith ) {
  return inTag.replace(
    /^[bd]\.|[^\w][bd]\.|&#39s|[^\w]/g, " "
  );
}

async function update_tags( card_id, question, answer, tags ) {
  //1) Combine question and answer tag fields into one string, regex clean it.
  const words_string = process_tag( question + " " + answer, " " );
  for( index in tags ) {
    tags[index] = process_tag( tags[index], "" );
  }

  //2) Split that string into an array of values to index as tags.
  const words = words_string.split( " " );

  //3) Add the tag array of topics into the array of word values.
  const all_tags = words.concat( tags );
  //4) Make sure each value is unique.
  const input_tags = all_tags.filter( (value,index,self) => {
    return self.indexOf(value) === index;
  });

  //5) Find any words already indexed for this card.
  const tag_query = "SELECT name FROM tags WHERE card_id = " + card_id + ";";
  const [existing_tags,out_fields] = await sqlPool.query( tag_query );
//TODO: Sorting these arrays first would often speed comparison.
  const duplicate_tags = [];
  const new_tags = [];
  for( index in input_tags ) {
    if( !existing_tags.includes( input_tags[index] ) ) {
      new_tags.push( input_tags[index] );
    }
  }
  //6) Find any words that are indexed for this card that have been removed.
  const delete_tags = [];
  for( index in existing_tags ) {
    if( !input_tags.includes( existing_tags[index].name ) ) {
      delete_tags.push( existing_tags[index].name );
      console.log( "Deleting " + existing_tags[index].name );
    }
  }
  //8) Add any words that need to be indexed for this card.
  let insert_query = "INSERT INTO tags (name,set_id,card_id) VALUES ";
  for( index in input_tags ) {
    insert_query += "(\"" + input_tags[index].replace(
      /^[bd]\.|[^\w][bd]\.|&#39s|[^\w]/g, ""
    );
    insert_query += "\", NULL, " + card_id + "), ";
  }
  insert_query = insert_query.slice( 0, insert_query.length-2 );
  insert_query += ";";
  console.log( insert_query );
  const [insert_rows,insert_fields] = await sqlPool.query( insert_query );

  //7) Remove any words that need to be removed.
  if( delete_tags.length != 0 ) {
    let delete_query = "DELETE FROM tags WHERE card_id = " + card_id + " AND (";
    for( index in delete_tags ) {
      delete_query += " name = \"" + delete_tags[index] + "\" OR";
    }
    delete_query = delete_query.slice( 0, delete_query.length-2 );
    delete_query += ");";
    console.log( "delete_query: " + delete_query );
    const [delete_rows,delete_fields] = await sqlPool.query( delete_query );
  }
}

/*Express Routes*/
function launchRoutes() {
  app.get('/setlist', async function(req,res) {
    try {
      const setlist_query = "SELECT name, set_id, set_creator FROM sets;"
      const [set_rows,field] = await sqlPool.query( setlist_query );
      const setlist = JSON.stringify( set_rows );
      res.send( setlist );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to get set list."
      }));
    }
  });


  /*Add a new set of cards*/
  app.post('/new_set', async function(req,res) {
    try {
      //1) Get new set ID
      let new_set_id_query = "SELECT Flashcards.generate_new_id( 0 ) as new_id;";
      const [new_id_row,new_id_field] = await sqlPool.query( new_set_id_query );
      const new_set_id = new_id_row[0].new_id;

      //2) Insert new set name.
      let insert_query = "INSERT INTO sets (name,set_id,set_creator) VALUES " +
        "( \'" + process_input(req.body.set_name) + "\', " +
        new_set_id + ", " +
        "\'" + req.body.username_hash + "\'" +
        " );";
      const [new_set_row,new_set_field] = await sqlPool.query( insert_query );

      //3) Notify client of success.
      //TODO: On success, on error handling.
      res.send( JSON.stringify({
        "result": "success",
        "set_name": req.body.set_name,
        "set_id": new_set_id
      }));
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to create new set."
      }));
    }
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

  /*Get sets by topic.*/

  /*Set topics of set.*/

  /*Get list of cards by topics.*/

  /*Set topics of card.*/

  /*Get list of cards irrespective of topics.*/

  /*Login*/
  app.post('/login', async function(req,res ) {
    try {
      const login_query = "SELECT password_hash FROM users WHERE " +
        "username_hash = \'" + req.body.username + "\';"
      const [login_row,login_field] = await sqlPool.query( login_query );
      const password_hash = String.fromCharCode.apply(null, login_row[0].password_hash);
      if( password_hash == req.body.password ) {
        res.send( JSON.stringify({
          "result": "approve",
          "username_hash": req.body.username
        }));
      } else {
        res.send( JSON.stringify({
          "result": "refused",
          "reason": "Credentials failed to authenticate!",
        }));
      }
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "refused",
        "reason": "Unspecified."
      }));
    }
  });

  app.post('/create_account', async function(req,res) {
    try {
      const create_acct_query = "INSERT INTO users " +
        "( username_hash, password_hash )" +
        " VALUES ( \'" + req.body.username + "\', \'" + req.body.password + "\');";
      const [create_acct_row, create_acct_field] =
        await sqlPool.query( create_acct_query );
      res.send( JSON.stringify({
        "result": "approve",
        "username_hash": req.body.username
      }));
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to create account."
      }));
    }
  });

  /*Generate a new card ID. DEPRECATED, TODO REMOVE*/
  app.post('/new_card', async function(req,res) {
    try {
      const new_card_id_query = "SELECT Flashcards.generate_new_id(1) AS new_card_id;";
      const [new_card_id_row,new_card_id_field] = await sqlPool.query( new_card_id_query );
      const new_card_id = new_card_id_row[0].new_card_id;
      //TODO: On success, on error handling
      res.send( JSON.stringify({
        "result": "success",
        "card_id": new_card_id
      }));
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to create new card."
      }));
    }
  });

  /*Add a new card*/
  app.post('/add_card', async function(req,res) {
    try {
      const new_card_id_query = "SELECT Flashcards.generate_new_id(1) AS new_card_id;";
      const [new_card_id_row,new_card_id_field] = await sqlPool.query( new_card_id_query );
      const new_card_id = new_card_id_row[0].new_card_id;

      const new_card_query = "INSERT INTO cards (card_id,question,answer,set_id) " +
        "VALUES ( " + new_card_id + ", " +
        "\'" + process_input(req.body.question) + "\', " +
        "\'" + process_input(req.body.answer) + "\', " +
        req.body.set_id + ");"
      const [add_card_row,add_card_field] = await sqlPool.query( new_card_query );

      update_tags( new_card_id, req.body.question, req.body.answer, req.body.tags );

      //TODO: On success, on error handling.
      res.send( JSON.stringify({
        "result": "success"
      }));
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to create new card."
      }));
    }
  });

  /*Update card*/
  app.post( '/update_card', async function(req,res) {
    try {
      const update_card_query = "UPDATE cards SET " +
        "question = " + "\'" + process_input(req.body.question) + "\', " +
        "answer = " + "\'" + process_input(req.body.answer) + "\'" +
        "WHERE set_id = " + req.body.set_id +
        " AND card_id = " + req.body.card_id + ";";
      const [update_card_row,update_card_field] = await sqlPool.query( update_card_query );

      update_tags( req.body.card_id, req.body.question, req.body.answer, req.body.tags );

      //TODO: On success, on error
      res.send( JSON.stringify({
        "result": "success"
      }));
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to update card."
      }));
    }
  });

  app.post('/delete_set/:set_id', async function(req,res) {
    try {
      const delete_set_query = "DELETE FROM sets WHERE set_id = " + req.params.set_id + ";";
      const [delete_row,delete_field] = await sqlPool.query( delete_set_query );

      const retired_set_id = "INSERT INTO sequence_retired " +
        "(sequence_id,retired_id) VALUES ( 0, " +
        req.params.set_id + " );";
      const [retire_id_row,retire_id_field] = await sqlPool.query( retired_set_id );

      res.send( JSON.stringify( { result: "success" } ) );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to delete set."
      }));
    }
  });

  app.post('/delete_card/:card_id', async function(req,res) {
    try {
      const delete_card_query = "DELETE FROM cards WHERE card_id = " + req.params.card_id + ";";
      const [delete_row,delete_field] = await sqlPool.query( delete_card_query );

      const retire_card_id = "INSERT INTO sequence_retired " +
        "(sequence_id,retired_id) VALUES (1, " +
        req.params.card_id + " );";
      const [retire_card_id_row,retire_card_id_field] =
        await sqlPool.query( retire_card_id );

      res.send( JSON.stringify( { result: "success" } ) );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to delete card."
      }));
    }
  });

  app.get('/get_cardlist/:set_id', async function(req,res) {
    try {
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
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to retrieve cardlist."
      }));
    }
  });

  app.get('/get_card/:card_id', async function(req,res) {
    try {
//TODO) Place these in an async function so that both can be run simultaneously.
      //1) Get card itself
      const get_card_query = "SELECT question, answer FROM cards WHERE card_id = " +
        req.params.card_id + ";";
      const [card_row,card_field] = await sqlPool.query( get_card_query );

      //2) Get all tags.
      const get_card_tags_query = "SELECT name FROM tags WHERE card_id = " +
        req.params.card_id + ";";
      const [tags_row,tags_field] = await sqlPool.query( get_card_tags_query );
//console.dir( tags_row );
      //3) Combine results.
      const card_obj = {
        result: "success",
        card: card_row[0],
        tags: tags_row
      }

      res.send( JSON.stringify( card_obj ) );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to retrieve card."
      }));
    }
  });

  if( process.argv[2] == "https" ) {
    var server = https.createServer( credentials, app );
    server.listen( 3000 );
  } else {
    app.listen(3000);
  }
}
