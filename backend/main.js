/* Async */
const nonsync = require("async");

/*System Calls VERY INSECURE ONLY FOR EARLY DEV*/
const {exec} = require("child_process");

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
app.use( body_parser.json({limit:'2mb'}) );

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
  let return_string = inTag.replace(
    /^[bd]\.|[^\w][bd]\.|&#39s|[^&\w]/g, " "
  );
  return_string= return_string.replace( /\s/g, "&nbsp;" );
  return return_string;
}

async function index_search_data( id, topics, text, isCard ) {
console.log( "id: " + id );
console.log( "topics: " + topics );
console.log( "text: " + text );
console.log( "idCard: " + isCard );
  try {
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
      in_terms = process_tag(text).split("&nbsp;");
      table += "text ";
    }

    //3) Make sure each value is unique, not empty,
    //     and longer than 1 character.
    const unique_topics = in_terms.filter( (value,index,self) => {
      if( value != "" && value.length > 1 ) {
        return self.indexOf(value) === index;
      }
    });

    //4) Find any topics already indexed for this card/set.
    const topic_query =
      "SELECT name FROM " + table + where_predicate + ";"
    const [existing_topics_rows,existing_topics_fields] =
      await sqlPool.query( topic_query );

    //5) Process the SQL result into a simple array.
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
        insert_query += "(\"" + new_tags[index];
        insert_query += "\", " + id + "), ";
      }
      insert_query = insert_query.slice( 0, insert_query.length-2 );
      insert_query += ";";

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
      const [delete_rows,delete_fields] = await sqlPool.query( delete_query );
    }
  } catch( error_obj ) {
    console.log( error_obj.toString() );
  }
}

async function delete_set( set_id ) {
  try {
    //1) Get list of card ids
    const card_ids_query =
      "SELECT card_id FROM cards WHERE set_id = " + set_id + ";";
    const [card_ids_rows,card_ids_fields] = await sqlPool.query( card_ids_query );

    //2) Compose a string listing the card ids seperated by ORs.
    let list_of_cards = ""
    for( index in card_ids_rows ) {
      list_of_cards += "card_id = " + card_ids_rows[index].card_id + " OR ";
    }
    list_of_cards = list_of_cards.slice( 0, list_of_cards.length-4 );

    //3) Compose deletion query.
    let delete_set_query =
      "START TRANSACTION;\n";
    if( list_of_cards.length > 0 ) {
      delete_set_query += "DELETE FROM card_search_text " +
        "WHERE " + list_of_cards + ";\n" +
        "DELETE FROM card_search_topics " +
        "WHERE " + list_of_cards + ";\n" +
        "DELETE FROM cards " +
        "WHERE " + list_of_cards + ";\n";
    }
    delete_set_query += "DELETE FROM cardset_search_text " +
      "WHERE set_id = " + set_id + ";\n" +
      "DELETE FROM cardset_search_topics " +
      "WHERE set_id = " + set_id + ";\n" +
      "DELETE FROM sets " +
      "WHERE set_id = " + set_id + ";\n" +
      "COMMIT;"
    const [delete_set_row,delete_set_field] =
      await sqlPool.query( delete_set_query );
    return "success";
  } catch( error ) {
    console.error( error );
    return "failure";
  }
}

/*Express Routes*/
function launchRoutes() {
  app.get('/setlist/:page_num', async function(req,res) {
    try {
      const page_count_query = "SELECT " +
        "COUNT(sets.set_id) AS page_count " +
        "FROM sets;"
      const [count_row,count_field] =
        await sqlPool.query( page_count_query );

      const offset = req.params.page_num * 10;
      const setlist_query = "SELECT " +
        "name, set_id, set_creator " +
        "FROM sets " +
        "ORDER BY name " +
        "LIMIT 10 " +
        "OFFSET " + offset +
        ";"

      const [set_rows,field] = await sqlPool.query( setlist_query );
      const setlist = JSON.stringify({
        "set_rows": set_rows,
        "page_count": count_row[0].page_count/10
      });
      res.send( setlist );
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to get set list."
      }));
    }
  });

  app.get('/cardlist/:page_num', async function(req,res) {
    try {
      const page_count_query = "SELECT " +
        "COUNT(cards.card_id) AS page_count " +
        "FROM cards;"
      const [count_row,count_field] =
        await sqlPool.query( page_count_query );

      const offset = req.params.page_num * 10;
      const cardlist_query = "SELECT " +
        "cards.card_id, cards.question, " +
        "cards.answer, cards.set_id, " +
        "sets.set_creator " +
        "FROM cards " +
        "INNER JOIN sets " +
        "ON cards.set_id = sets.set_id " +
        "LIMIT 10 " +
        "OFFSET " + offset +
        ";"

      const [cardlist_rows,cardlist_fields] =
        await sqlPool.query( cardlist_query );
      res.send( JSON.stringify({
        "result": "sucess",
        "data": cardlist_rows,
        "page_count": count_row[0].page_count/10
      }));
    } catch( error ) {
      res.send( JSON.stringify({
        "result": "failure",
        "error_message": "Unspecified error attempting to get card list."
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

      //3) Index search terms (new sets can only have search text).
      index_search_data(
        new_set_id,
        null,
        req.body.set_name,
        false
      );

      //4) Notify client of success.
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

  /*Create Account*/
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

  /*Update set*/
  app.post( '/update_set', async function(req,res) {
//TODO: Include updating set name here.
    try {
      index_search_data(
        req.body.set_id,
        req.body.tags,
        null,
        false
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

  /*Delete Set*/
  app.post('/delete_set/:set_id', async function(req,res) {
    try {
      const result = await delete_set( req.params.set_id );
      if( result == "success" ) {
        res.send( JSON.stringify({
          "result": "success"
        }));
      } else {
        throw "yep";
      }
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to delete set."
      }));
    }
  });

  /*Delete Card*/
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

  /*Get a list of cards for the set editor interface.*/
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

  /*Get card by ID*/
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

  /*Get a list of either sets or cards for the Serach Interface*/
  app.post( '/searchlist', async function(req,res) {
    try {
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

      const page_offset = Number( req.body.page_num*10 );
      //1) Determine whether search is for sets or for cards.
      let card_search_query = "";
      let page_query = "";
      if( req.body.search_type == "card" ) {
        card_search_query =
          "(SELECT cards.card_id, cards.answer, cards.question, " +
          "sets.set_creator, cards.set_id " +
          "FROM cards " +
          "LEFT JOIN card_search_text " +
          "ON cards.card_id = card_search_text.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          "LEFT JOIN cardset_search_text " +
          "ON cards.set_id = cardset_search_text.set_id " +
          card_search_text_predicate +
          " OR " +
          cardset_search_text_predicate.substr(6) +
          "LIMIT 10 OFFSET " + page_offset + ") " +
          "UNION " +

          "(SELECT cards.card_id, cards.answer, cards.question, " +
          "sets.set_creator, cards.set_id " +
          "FROM cards " +
          "LEFT JOIN card_search_topics " +
          "ON cards.card_id = card_search_topics.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          "LEFT JOIN cardset_search_topics " +
          "ON cards.set_id = cardset_search_topics.set_id " +
          card_search_topics_predicate +
          " OR " +
          cardset_search_topics_predicate.substr(6) +
          "LIMIT 10 OFFSET " + page_offset +
          ")";

        page_query =
          "SELECT SUM(tempTable.page_count) as page_count FROM " +
          "((SELECT COUNT(cards.card_id) AS page_count " +
          "FROM cards " +
          "LEFT JOIN card_search_text " +
          "ON cards.card_id = card_search_text.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          "LEFT JOIN cardset_search_text " +
          "ON cards.set_id = cardset_search_text.set_id " +
          card_search_text_predicate +
          " OR " +
          cardset_search_text_predicate.substr(6) +
          ") " +
          "UNION " +

          "(SELECT COUNT(cards.card_id) AS page_count " +
          "FROM cards " +
          "LEFT JOIN card_search_topics " +
          "ON cards.card_id = card_search_topics.card_id " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id " +
          "LEFT JOIN cardset_search_topics " +
          "ON cards.set_id = cardset_search_topics.set_id " +
          card_search_topics_predicate +
          " OR " +
          cardset_search_topics_predicate.substr(6) +
          ")) as tempTable";
      } else if( req.body.search_type == "set" ) {
        card_search_query =
          "(SELECT sets.set_id, sets.name, sets.set_creator " +
          "FROM sets " +
          "INNER JOIN cardset_search_text " +
          "ON sets.set_id = cardset_search_text.set_id " +
          cardset_search_text_predicate +
          "LIMIT 10 OFFSET " + page_offset + ") UNION " +

          "(SELECT sets.set_id, sets.name, sets.set_creator FROM sets " +
          "INNER JOIN cardset_search_topics " +
          "ON sets.set_id = cardset_search_topics.set_id " +
          cardset_search_topics_predicate +
          "ORDER BY sets.name " +
          "LIMIT 10 OFFSET " + page_offset +
          ")";

        page_query =
          "(SELECT COUNT(sets.set_id) AS page_count " +
          "FROM sets " +
          "INNER JOIN cardset_search_text " +
          "ON sets.set_id = cardset_search_text.set_id " +
          cardset_search_text_predicate +
          ") UNION " +

          "(SELECT COUNT(sets.set_id) AS page_count " +
          "FROM sets " +
          "INNER JOIN cardset_search_topics " +
          "ON sets.set_id = cardset_search_topics.set_id " +
          cardset_search_topics_predicate +
          ")";
      }

      const [out_row,out_field] =
        await sqlPool.query( card_search_query );

      const [page_row,page_field] =
        await sqlPool.query( page_query );

      res.send( JSON.stringify({
        "result": "success",
        "set_rows": out_row,
        "page_count": page_row[0].page_count/10,
        "search_type": req.body.search_type
      }));
    } catch(error) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": error.toString()
      }));
    }
  });

/*Generate backup file. VERY INSECURE. Only for early dev.*/
async function generate_db_backup( res ) {
  const dump = await exec(
    "mysqldump --no-tablespaces --user='Flashcards_User' " +
    "--password='Flashcards_Password' " +
//    "--routines " + //Brokered. Suggests mysql.proc, but doesn't exist.
    "--databases Flashcards > backup.sql",
    async (error,stdout,stderr) => {
      if( error ) { console.error( error ); }
      if( stderr ) { console.log( stderr ); }
      console.log( "callbacky" );
      fs.readFile('backup.sql', 'utf8', (error,data) => {
        res.send( JSON.stringify({
          "result": "success",
          "data": data
        }));
      });
    }
  );
  return;
}

  app.get( '/download_backup', async function (req,res) {
    console.log( "downloading backup.." );
    const done = await generate_db_backup(res);
  });

  /*This is about the most insecure thing I can imagine.*/
  /*THIS IS ONLY FOR EARLY DEV. NEVER PUT THIS ON THE ACTUAL INTERNET.*/
  app.post( '/upload_database', async function(req,res) {
    try {
      fs.writeFile( "database_backup.sql", req.body.data, 'utf8', async () => {
        const load = await exec(
          "mysql " +
          "--user='Flashcards_User' " +
          "--password='Flashcards_Password' " +
          " < database_backup.sql",
          async (error,stdout,stderr) => {
            res.send( JSON.stringify({
              "result": "success"
            }));
          }
        );
      });
    } catch( error ) {
      console.error( error );
      res.send( JSON.stringify({
        "result": "error"
      }));
    }
  });

  app.post( '/card_result', async function(req,res) {
    try {
      const result_query = "INSERT INTO card_record " +
        "(username_hash, card_id, datestamp, result) VALUES " +
        "( \"" + req.body.userhash + "\", " +
        req.body.card_id + ", " +
        "\'" + req.body.date_stamp + "\', " +
        req.body.result + ");"
      const [res_row,res_field] = await sqlPool.query( result_query );
      res.send( JSON.stringify({
        "result": "success"
      }));
    } catch(error) {
      console.error( error );
      res.send( JSON.stringify({
        "result": "error"
      }));
    }
  });

  app.post( '/temporary_set', async function(req,res) {
    try {
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

      let temp_set_query =
        "SELECT cards.card_id, cards.question, cards.answer, " +
        "COALESCE( SUM(card_record.result), -100 ) AS Result, " +
        "CAST( (UNIX_TIMESTAMP(CURDATE()) - " +
        "UNIX_TIMESTAMP( MAX(card_record.datestamp) )) AS SIGNED ) as Latest " +
        "FROM cards " +
        "LEFT JOIN card_record " +
        "ON cards.card_id = card_record.card_id ";

      if( req.body.topics.length > 0 ) {
        temp_set_query += "LEFT JOIN cardset_search_text " +
          "ON cards.set_id = cardset_search_text.set_id " +
          "LEFT JOIN cardset_search_topics " +
          "ON cards.set_id = cardset_search_topics.set_id " +
          "LEFT JOIN card_search_text " +
          "ON cards.card_id = card_search_text.card_id " +
          "LEFT JOIN card_search_topics " +
          "ON cards.card_id = card_search_topics.card_id ";

        temp_set_query += cardset_search_topics_predicate + " OR " +
          cardset_search_text_predicate.substr(6) + " OR " +
          card_search_topics_predicate.substr(6) + " OR " +
          card_search_text_predicate.substr(6);
      }

      if( req.body.username_hash != "unlogged" ) {
        temp_set_query += "AND card_record.username_hash = " +
          "\'" + req.body.username_hash + "\' ";
      }

      temp_set_query += "GROUP BY card_id, card_record.result " +
        "ORDER BY Result-(Latest/100) ASC " +
        "LIMIT 25;"

      const [temp_row,temp_field] = await sqlPool.query( temp_set_query );
      res.send( JSON.stringify({
        "result": "success",
        "cards": temp_row
      }));
    } catch( error ) {
      console.error( error );
      res.send( JSON.stringify({
        "result": "error"
      }));
    }
  });

  app.post( '/page_count', async function(req,res) {
    try {
      const page_count_query = "SELECT COUNT(sets.set_id) " +
        "AS count " +
        "FROM sets;";
      const [count_row,count_field] =
        await sqlPool.query( page_count_query );
      res.send( JSON.stringify({
        "result": "success",
        "count": count_row[0].count
      }));
    } catch( error_obj ) {
      console.error( error_obj );
      res.send( JSON.stringify({
        "result": "error",
        "reason": error_obj.toString()
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
 
