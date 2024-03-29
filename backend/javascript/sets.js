async function delete_set( error_log, set_id, sqlPool ) {
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
        error_log.log_error(
          sqlPool,
          "sets.js::delete_set()",
          req.ip,
          error
        );

        console.error( error );
        return "failure";
    }
}
exports.delete_set = delete_set;

function attach_new_set_route( error_log, app, sqlPool, indexer, sanitizer ) {
  /*Add a new set of cards*/
  app.post('/new_set', async function(req,res) {
    try {
      //1) Get new set ID
      let new_set_id_query = "SELECT Flashcards.generate_new_id( 0 ) as new_id;";
      const [new_id_row,new_id_field] = await sqlPool.query( new_set_id_query );
      const new_set_id = new_id_row[0].new_id;

      //2) Insert new set name.
      let insert_query = "INSERT INTO sets (name,set_id,set_creator) VALUES " +
        "( \'" + sanitizer.process_input(req.body.set_name) + "\', " +
        new_set_id + ", " +
        "\'" + req.body.username_hash + "\'" +
        " );";
      const [new_set_row,new_set_field] = await sqlPool.query( insert_query );

      //3) Add subjects, if present.
      if( req.body.subjects ) {
        const set_subject_values = "INSERT INTO subject_set_listing " +
          "(set_id, 1_level_subject_id, 2_level_subject_id, " +
          "3_level_subject_id, 4_level_subject_id) " +
          "VALUES (" + new_set_id + "," + req.body.subjects.levels[0] + "," +
          req.body.subjects.levels[1] + "," +
          req.body.subjects.levels[2] + "," +
          req.body.subjects.levels[3] + ");";
          const [subj_row,subj_field] = await sqlPool.query( set_subject_values );
      }

      //4) Index search terms (new sets can only have search text).
      indexer.index_search_data(
        error_log,
        sqlPool,
        sanitizer,
        null,
        new_set_id,
        JSON.stringify([{type:"text",content:req.body.set_name}]),
        null
      );

      //4) Notify client of success.
      res.send( JSON.stringify({
        "result": "success",
        "set_name": req.body.set_name,
        "set_id": new_set_id
      }));
    } catch( error ) {
      error_log.log_error(
        sqlPool,
        "sets.js::attach_new_set_route()",
        req.ip,
        error
      );

      console.error( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to create new set."
      }));
    }
  });
}
exports.attach_new_set_route = attach_new_set_route;

function attach_update_sets_route( error_log, app, indexer, sanitizer, sqlPool ) {
    /*Update set*/
    app.post( '/update_set', async function(req,res) {
      try {
        console.log( req.body.tags );
        indexer.index_search_data(
          error_log,
          sqlPool,
          sanitizer,
          null,
          req.body.set_id,
          JSON.stringify(req.body.tags),
          null
        );
  
        res.send( JSON.stringify({
          "result": "success"
        }));
      } catch( error ) {
        error_log.log_error(
          sqlPool,
          "sets.js::attach_update_sets_route()",
          req.ip,
          error
        );

        console.error( error );
        res.send( JSON.stringify({
          "result": "error",
          "error_message": "Unspecified error attempting to update card."
        }));
      }
    });
}
exports.attach_update_sets_route = attach_update_sets_route;

function attach_delete_set_route( error_log, app, sqlPool ) {
  /*Delete Set*/
  app.post('/delete_set/:set_id', async function(req,res) {
    try {
      const result = await delete_set( error_log, req.params.set_id, sqlPool );
      if( result == "success" ) {
        res.send( JSON.stringify({
          "result": "success"
        }));
      } else {
        throw "yep";
      }
    } catch( error ) {
      error_log.log_error(
        sqlPool,
        "sets.js::attach_delete_set_route()",
        req.ip,
        error
      );

      console.error( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to delete set."
      }));
    }
  });
}
exports.attach_delete_set_route = attach_delete_set_route;