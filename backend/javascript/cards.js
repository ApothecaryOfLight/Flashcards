const indexer = require('./indexer.js');

function attach_add_card_route( app, sqlPool ) {
  /*Add a new card*/
  app.post('/add_card', async function(req,res) {
    try {
      const new_card_id_query = "SELECT Flashcards.generate_new_id(1) AS new_card_id;";
      const [new_card_id_row,new_card_id_field] = await sqlPool.query( new_card_id_query );
      const new_card_id = new_card_id_row[0].new_card_id;

      const new_card_query = "INSERT INTO cards (card_id,question,answer,set_id) " +
        "VALUES ( " + new_card_id + ", " +
        "\'" + sanitizer.process_input(req.body.question) + "\', " +
        "\'" + sanitizer.process_input(req.body.answer) + "\', " +
        req.body.set_id + ");"
      const [add_card_row,add_card_field] = await sqlPool.query( new_card_query );

      indexer.index_search_data(
        new_card_id,
        null,
        req.body.question + " " + req.body.answer,
        true
      );
      indexer.index_search_data(
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
}
exports.attach_add_card_route = attach_add_card_route;

function attach_update_card_route( app, sqlPool ) {
      /*Update card*/
  app.post( '/update_card', async function(req,res) {
    try {
      const update_card_query = "UPDATE cards SET " +
        "question = " + "\'" + sanitizer.process_input(req.body.question) + "\', " +
        "answer = " + "\'" + sanitizer.process_input(req.body.answer) + "\'" +
        "WHERE set_id = " + req.body.set_id +
        " AND card_id = " + req.body.card_id + ";";
      const [update_card_row,update_card_field] = await sqlPool.query( update_card_query );

      indexer.index_search_data(
        req.body.card_id,
        null,
        req.body.question + " " + req.body.answer,
        true
      );
      indexer.index_search_data(
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
}
exports.attach_update_card_route = attach_update_card_route;

function attach_delete_card_route( app, sqlPool ) {
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
}
exports.attach_delete_card_route = attach_delete_card_route;

function atttach_get_card_card_id_route( app, sqlPool ) {
  /*Get card by ID*/
  app.get('/get_card/:card_id', async function(req,res) {
    try {
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
}
exports.atttach_get_card_card_id_route = atttach_get_card_card_id_route;


function attach_card_result_route( app, sqlPool ) {
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
}
exports.attach_card_result_route = attach_card_result_route;