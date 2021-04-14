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

async function index_search_data( id, topics, text, isCard ) {
  //1) Set variables for either card or set processing.
  let table;
  let where_predicate;
  let insert_fields;
  //1a) If isCard.
  if( isCard ) {
    table = "card_search_";
    where_predicate = "WHERE card_id = " + id;
    insert_fields = "(name,card_id) VALUES ";
  }

  //1b) If isCard is false.
  if( !isCard ) {
    table = "cardset_search_";
    where_predicate = "WHERE set_id = " + id;
    insert_fields = "(name,set_id) VALUES ";
  }

  //2) Set variables for either topics or text processing.
  let in_terms = [];

  //2a) If topics
  if( topics ) {
    for( index in topics ) {
      in_terms.push(  process_tag( topics[index], "" ) );
    }
    table += "topics ";
  }

  //2b) If text
  if( text ) {
    in_terms = process_tag(text).split(" ");
    table += "text ";
  }

  //3) Make sure each value is unique, not empty, and longer than 1 character.
  const unique_topics = in_terms.filter( (value,index,self) => {
    if( value != "" && value.length > 1 ) {
      return self.indexOf(value) === index;
    }
  });

  //4) Find any topics already indexed for this card/set.
  const topic_query =
    "SELECT name FROM " + table + where_predicate + ";"
  console.log( "\ntopic_query: " + topic_query );
  const [existing_topics_rows,existing_topics_fields] =
    await sqlPool.query( topic_query );
//TODO: Sorting these arrays first would often speed comparison.

  //5) Process the SQL result into a simple array.
//TODO: There should be a way to return this as an array directly.
  const existing_topics = [];
  for( index in existing_topics_rows ) {
    existing_topics.push( existing_topics_rows[index].name );
  }

  //6) Compare input topics and exsiting topics to find new topics.
  const new_tags = [];
  for( index in unique_topics ) {
    if( !existing_topics.includes( unique_topics[index] ) ) {
      new_tags.push( unique_topics[index] );
    }
  }

  //7) Compare input topics and existing topics to find deleted topics.
  const delete_tags = [];
  for( index in existing_topics ) {
    if( !unique_topics.includes( existing_topics[index] ) ) {
      delete_tags.push( existing_topics[index] );
    }
  }

  //8) If there are new tags, compose insert query to add them.
  if( new_tags.length > 0 ) {
    let insert_query = "INSERT INTO " +
      table +
      insert_fields;
    for( index in new_tags ) {
      insert_query += "(\"" + new_tags[index].replace(
        /^[bd]\.|[^\w][bd]\.|&#39s|[^\w]/g, ""
      );
      insert_query += "\", " + id + "), ";
    }
    insert_query = insert_query.slice( 0, insert_query.length-2 );
    insert_query += ";";
    console.log( "\ninsert query: " + insert_query );
    const [insert_rows,fields] = await sqlPool.query( insert_query );
  }

  //9) If there are deleted tags, compose delete query to remove them.
  if( delete_tags.length > 0 ) {
    let delete_query = "DELETE FROM " +
      table +
      where_predicate +
      " AND (";
    for( index in delete_tags ) {
      delete_query += " name = \"" + delete_tags[index] + "\" OR";
    }
    delete_query = delete_query.slice( 0, delete_query.length-2 );
    delete_query += ");";
    console.log( "\ndelete_query: " + delete_query );
    const [delete_rows,delete_fields] = await sqlPool.query( delete_query );
  }
}

/*Express Routes*/
function launchRoutes() {
  app.get('/setlist', async function(req,res) {
    try {
//TODO: Pagination
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

  app.get('/cardlist', async function(req,res) {
//TODO: Pagination
    try {
      const cardlist_query = "SELECT " +
        "cards.card_id, cards.question, cards.answer, cards.set_id, " +
        "sets.set_creator " +
        "FROM cards " +
        "INNER JOIN sets " +
        "ON cards.set_id = sets.set_id;"
      const [cardlist_rows,cardlist_fields] =
        await sqlPool.query( cardlist_query );
      res.send( JSON.stringify({
        "result": "sucess",
        "data": cardlist_rows
      }));
    } catch( error ) {
      res.send( JSON.stringify({
        "result": "failure",
        "error_message": "Unspecified error attempting to get card list."
      }));
    }
  });


//set_cardset_search_topics and set_cardset_search_text
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

//TODO: set_card_search_text and set_card_search_topics
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

      index_search_data(
        new_card_id,
        null,
        req.body.question + " " + req.body.answer,
        true
      );
      index_search_data(
        new_card_id,
        req.body.tags,
        null,
        true
      );

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

  app.post( '/update_set', async function(req,res) {
    try {
      index_search_data(
        req.body.set_id,
        req.body.tags,
        null,
        false
      );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to update card."
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

      index_search_data(
        req.body.card_id,
        null,
        req.body.question + " " + req.body.answer,
        true
      );
      index_search_data(
        req.body.card_id,
        req.body.tags,
        null,
        true
      );

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
      const delete_card_search_text =
        "DELETE FROM card_search_text " +
        "WHERE card_id = " + req.params.card_id + ";";
      const delete_card_search_topics =
        "DELETE FROM card_search_topics " +
        "WHERE card_id = " + req.params.card_id + ";";
      const delete_cardset_search_text =
        "DELETE FROM cardset_search_text " +
        "WHERE card_id = " + req.params.card_id + ";";
      const delete_cardset_search_topics =
        "DELETE FROM cardset_search_topics " +
        "WHERE card_id = " + req.params.card_id + ";";
      const [delete_card_text_rows,delete_card_text_fields] =
        await sqlPool.query( delete_card_search_text );
      const [delete_card_topics_rows,delete_card_topics_fields] =
        await sqlPool.query( delete_card_search_topics );
      const [delete_cardset_text_rows,delete_cardset_text_fields] =
        await sqlPool.query( delete_cardset_search_text );
      const [delete_cardset_topics_rows,delete_cardset_topics_fields] =
        await sqlPool.query( delete_cardset_search_text );

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
      const [set_name_row,set_name_field] =
        await sqlPool.query( get_cardlist_set_name_query );

      const get_cardlist_cards = "SELECT card_id, answer, question FROM cards " +
        "WHERE set_id = "  + req.params.set_id + ";";
      const [cardlist_row,cardlist_field] =
        await sqlPool.query( get_cardlist_cards );

      const get_cardlist_topics = "SELECT name FROM cardset_search_topics " +
        "WHERE set_id = " + req.params.set_id + ";";
      const [topics_rows,topics_fields] =
        await sqlPool.query( get_cardlist_topics );

      const cardlist_obj = {
        result: "success",
        set_name: set_name_row[0],
        cards: cardlist_row,
        topics: topics_rows
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

      //2) Get search topics.
      const card_search_topics_query =
        "SELECT name FROM card_search_topics WHERE card_id = " +
        req.params.card_id + ";";
      const [topics_row,topics_field] =
        await sqlPool.query( card_search_topics_query );

      //3) Combine results.
      const card_obj = {
        result: "success",
        card: card_row[0],
        tags: topics_row
      }

      //4) Send data
      res.send( JSON.stringify( card_obj ) );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to retrieve card."
      }));
    }
  });

  app.post( '/searchlist', async function(req,res) {
    try {
      console.dir( req.body.topics );
      let card_search_text_predicate = "";
      let card_search_topics_predicate = "";
      let cardset_search_text_predicate = "";
      let cardset_search_topics_predicate = "";
      if( req.body.topics.length > 0 ) {
        card_search_text_predicate = "WHERE";
        card_search_topics_predicate = "WHERE";
        cardset_search_text_predicate = "WHERE";
        cardset_search_topics_predicate = "WHERE";
        for( index in req.body.topics ) {
          card_search_text_predicate += " card_search_text.name = \'" +
            req.body.topics[index] + "\' OR";
          card_search_topics_predicate += " card_search_topics.name = \'" +
            req.body.topics[index] + "\' OR";
          cardset_search_text_predicate += " cardset_search_text.name = \'" +
            req.body.topics[index] + "\' OR";
          cardset_search_topics_predicate += " cardset_search_topics.name = \'" +
            req.body.topics[index] + "\' OR";
        }
        card_search_text_predicate = card_search_text_predicate.slice(
          0,
          card_search_text_predicate.length-3
        );
        card_search_text_predicate += " ";
        card_search_topics_predicate = card_search_topics_predicate.slice(
          0,
          card_search_topics_predicate.length-3
        );
        card_search_topics_predicate += " ";
        cardset_search_text_predicate = cardset_search_text_predicate.slice(
          0,
          cardset_search_text_predicate.length-3
        );
        cardset_search_text_predicate += " ";
        cardset_search_topics_predicate = cardset_search_topics_predicate.slice(
          0,
          cardset_search_topics_predicate.length-3
        );
        cardset_search_topics_predicate += " ";
      }


      //1) Determine whether serach is for sets or for cards.
      let card_search_query = "";
      if( req.body.search_type == "card" ) {
        card_search_query =
          "(SELECT cards.card_id, cards.answer, cards.question, " +
          "sets.set_creator, cards.set_id " +
          "FROM cards " +
          "INNER JOIN card_search_text " +
          "ON cards.card_id = card_search_text.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          card_search_text_predicate +
          ") " +
          "UNION " +

          "(SELECT cards.card_id, cards.answer, cards.question, " +
          "sets.set_creator, cards.set_id " +
          "FROM cards " +
          "INNER JOIN card_search_topics " +
          "ON cards.card_id = card_search_topics.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          card_search_topics_predicate +
          ") " +
          "UNION " +

          "(SELECT cards.card_id, cards.answer, cards.question, " +
          "sets.set_creator, cards.set_id " +
          "FROM cards " +
          "INNER JOIN cardset_search_text " +
          "ON cards.card_id = cardset_search_text.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          cardset_search_text_predicate +
          ") " +
          "UNION " +

          "(SELECT cards.card_id, cards.answer, cards.question, " +
          "sets.set_creator, cards.set_id " +
          "FROM cards " +
          "INNER JOIN cardset_search_topics " +
          "ON cards.card_id = cardset_search_topics.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          cardset_search_topics_predicate +
          ")";
      } else if( req.body.search_type == "set" ) {
        card_search_query =
          "(SELECT sets.set_id, sets.name, sets.set_creator FROM sets " +
          "INNER JOIN card_search_text " +
          "ON sets.set_id = card_search_text.set_id " +
          card_search_text_predicate +
          ") UNION " +

          "(SELECT sets.set_id, sets.name, sets.set_creator FROM sets " +
          "INNER JOIN card_search_topics " +
          "ON sets.set_id = card_search_topics.set_id " +
          card_search_topics_predicate +
          ") UNION " +

          "(SELECT sets.set_id, sets.name, sets.set_creator FROM sets " +
          "INNER JOIN cardset_search_text " +
          "ON sets.set_id = cardset_search_text.set_id " +
          cardset_search_text_predicate +
          ") UNION " +

          "(SELECT sets.set_id, sets.name, sets.set_creator FROM sets " +
          "INNER JOIN cardset_search_topics " +
          "ON sets.set_id = cardset_search_topics.set_id " +
          cardset_search_topics_predicate +
          ")";
      }
console.log( "\n\n" + card_search_query );
      const [out_row,out_field] = await sqlPool.query( card_search_query );
      res.send( JSON.stringify({
        "result": "success",
        "data": out_row,
        "search_type": req.body.search_type
      }));
    } catch(error) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting search."
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
