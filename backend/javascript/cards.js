function attach_add_card_route( error_log, app, sqlPool, indexer, sanitizer, fs ) {
  /*Add a new card*/
  app.post('/add_card', async function(req,res) {
    try {
      const new_card_id_query = "SELECT Flashcards.generate_new_id(1) AS new_card_id;";
      const [new_card_id_row,new_card_id_field] = await sqlPool.query( new_card_id_query );
      const new_card_id = new_card_id_row[0].new_card_id;

      if( req.body.question_images.length > 0 ) {
        let new_images_query = "INSERT INTO images_registry (card_id, set_id, global_image_id, image_place, file_location, image_array_location ) VALUES ";
        for( let i=0; i<req.body.question_images.length; i++ ) {
          const new_global_image_id_query = "SELECT Flashcards.generate_new_id(5) AS new_global_image_id;";
          const [new_image_id_row,new_image_id_field] = await sqlPool.query( new_global_image_id_query );
          req.body.question_images[i].global_image_id = new_image_id_row[0].new_global_image_id;
          req.body.question_images[i].file_location = new_card_id + "_" + new_image_id_row[0].new_global_image_id;
          new_images_query += "( " + new_card_id + ", " +
            req.body.set_id + ", " +
            new_image_id_row[0].new_global_image_id + ", " +
            req.body.question_images[i].image_position + ", " +
            "\'" + req.body.question_images[i].file_location + "\', " +
            req.body.question_images[i].image_array_location +
            "), ";


          fs.writeFileSync(
            './images/' + req.body.question_images[i].file_location,
            req.body.question_images[i].image_data,
            error => {
              console.log("error");
              console.error( error );
              error_log.log_error(
                sqlPool,
                "cards.js::attach_add_card_route():: Saving Images Loop",
                req.ip,
                error
              );
            }
          )
        }
        new_images_query = new_images_query.substring( 0, new_images_query.length-2 );
        new_images_query += ";";
        const [add_image_row, add_image_field] = await sqlPool.query( new_images_query );
      }


      const new_card_query = "INSERT INTO cards (card_id,question,answer,set_id) " +
        "VALUES ( " + new_card_id + ", " +
        "\'" + sanitizer.process_input(JSON.stringify(req.body.question)) + "\', " +
        "\'" + sanitizer.process_input(req.body.answer) + "\', " +
        req.body.set_id + ");"
      const [add_card_row,add_card_field] = await sqlPool.query( new_card_query );

      indexer.index_search_data(
        error_log,
        sanitizer,
        new_card_id,
        null,
        req.body.question + " " + req.body.answer,
        true,
        sqlPool
      );
      indexer.index_search_data(
        error_log,
        sanitizer,
        new_card_id,
        req.body.tags,
        null,
        true,
        sqlPool
      );

      res.send( JSON.stringify({
        "result": "success"
      }));
    } catch( error ) {
      console.error( error );
      error_log.log_error(
        sqlPool,
        "cards.js::attach_add_card_route()",
        req.ip,
        error
      );

      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to create new card."
      }));
    }
  });
}
exports.attach_add_card_route = attach_add_card_route;

function attach_update_card_route( error_log, app, sqlPool, indexer, sanitizer, fs ) {
  /*Update card*/
  app.post( '/update_card', async function(req,res) {
    try {
      //Get a list of images already attached to the card, if any.
      const get_images_list = "SELECT global_image_id, file_location " +
        "FROM images_registry " +
        "WHERE card_id =  " + req.body.card_id;
      const [existing_images_row, existing_images_field] = await sqlPool.query( get_images_list );

      if( existing_images_row.length > 0 ) {
        let remove_images_query = "DELETE FROM images_registry WHERE file_location IN (\'"
        existing_images_row.forEach( (image_record) => {
          remove_images_query += image_record.file_location + "\',\'";
          fs.unlinkSync( './images/' + image_record.file_location );
        });
        remove_images_query = remove_images_query.substring( 0, remove_images_query.length - 2 ) + ");";
        const [remove_image_row,remove_image_field] = await sqlPool.query( remove_images_query );

        //Add any images that have been uploaded this time.
        let new_images_query = "INSERT INTO images_registry (card_id, set_id, global_image_id, image_place, file_location, image_array_location ) VALUES ";
        for( let i=0; i<req.body.question_images.length; i++ ) {
          const new_global_image_id_query = "SELECT Flashcards.generate_new_id(5) AS new_global_image_id;";
          const [new_image_id_row,new_image_id_field] = await sqlPool.query( new_global_image_id_query );
          req.body.question_images[i].global_image_id = new_image_id_row[0].new_global_image_id;
          req.body.question_images[i].file_location = req.body.card_id + "_" + new_image_id_row[0].new_global_image_id;
          new_images_query += "( " + req.body.card_id + ", " +
            req.body.set_id + ", " +
            new_image_id_row[0].new_global_image_id + ", " +
            req.body.question_images[i].image_position + ", " +
            "\'" + req.body.question_images[i].file_location + "\', " +
            req.body.question_images[i].image_array_location +
            "), ";

          fs.writeFileSync(
            './images/' + req.body.question_images[i].file_location,
            req.body.question_images[i].image_data,
            error => {
              console.log("error");
              console.error( error );
              error_log.log_error(
                sqlPool,
                "cards.js::attach_update_card_route():: Saving Images Loop",
                req.ip,
                error
              );
            }
          )
        }
        new_images_query = new_images_query.substring( 0, new_images_query.length-2 );
        new_images_query += ";";
        const [add_image_row, add_image_field] = await sqlPool.query( new_images_query );
      }

      const update_card_query = "UPDATE cards SET " +
        "question = " + "\'" + sanitizer.process_input(JSON.stringify(req.body.question)) + "\', " +
        "answer = " + "\'" + sanitizer.process_input(req.body.answer) + "\'" +
        "WHERE set_id = " + req.body.set_id +
        " AND card_id = " + req.body.card_id + ";";
      const [update_card_row,update_card_field] = await sqlPool.query( update_card_query );

      indexer.index_search_data(
        error_log,
        sanitizer,
        req.body.card_id,
        null,
        req.body.question + " " + req.body.answer,
        true,
        sqlPool
      );
      indexer.index_search_data(
        error_log,
        sanitizer,
        req.body.card_id,
        req.body.tags,
        null,
        true,
        sqlPool
      );

      res.send( JSON.stringify({
        "result": "success"
      }));
    } catch( error ) {
      console.error( error );
      error_log.log_error(
        sqlPool,
        "cards.js::attach_update_card_route()",
        req.ip,
        error
      );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to update card."
      }));
    }
  });
}
exports.attach_update_card_route = attach_update_card_route;

function attach_delete_card_route( error_log, app, sqlPool, fs ) {
    /*Delete Card*/
  app.post('/delete_card/:card_id', async function(req,res) {
    try {
      //Get a list of images already attached to the card, if any, and delete them.
      const get_images_list = "SELECT global_image_id, file_location " +
        "FROM images_registry " +
        "WHERE card_id =  " + req.params.card_id;
      const [existing_images_row, existing_images_field] = await sqlPool.query( get_images_list );

      if( existing_images_row.length > 0 ) {
        let remove_images_query = "DELETE FROM images_registry WHERE file_location IN (\'"
        existing_images_row.forEach( (image_record) => {
          remove_images_query += image_record.file_location + "\',\'";
          fs.unlinkSync( './images/' + image_record.file_location );
        });
        remove_images_query = remove_images_query.substring( 0, remove_images_query.length - 2 ) + ");";
        const [remove_image_row,remove_image_field] = await sqlPool.query( remove_images_query );
      }

      const delete_card_query = "DELETE FROM cards WHERE card_id = " + req.params.card_id + ";";
      const [delete_row,delete_field] = await sqlPool.query( delete_card_query );

      const retire_card_id = "INSERT INTO sequence_retired " +
        "(sequence_id,retired_id) VALUES (1, " +
        req.params.card_id + " );";
      const [retire_card_id_row,retire_card_id_field] =
        await sqlPool.query( retire_card_id );

      res.send( JSON.stringify( { result: "success" } ) );
    } catch( error ) {
      console.error( error );
      error_log.log_error(
        sqlPool,
        "cards.js::attach_delete_card_route()",
        req.ip,
        error
      );

      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to delete card."
      }));
    }
  });
}
exports.attach_delete_card_route = attach_delete_card_route;

function atttach_get_card_card_id_route( error_log, app, sqlPool, fs ) {
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

      //3) Get a list of images attached to the card, if any.
      const images_query = "SELECT image_place, file_location, image_array_location " +
        "FROM images_registry " +
        "WHERE card_id = " + req.params.card_id + ";";
      const [images_row,images_field] = await sqlPool.query( images_query );

      card_row[0].images = [];
      images_row.forEach( (image_row) => {
        card_row[0].images[ image_row.image_array_location ] = fs.readFileSync(
          './images/' + image_row.file_location,
          {
            encoding: 'utf8',
            flag: 'r'
          },
          error => {
            console.log("error");
            console.error( error );
            error_log.log_error(
              sqlPool,
              "cards.js::atttach_get_card_card_id_route():: Loading Images Loop",
              req.ip,
              error
            );
          }
        );
      });

      //3) Combine results.
      const card_obj = {
        result: "success",
        card: card_row[0],
        tags: topics_row
      }

      //4) Send data
      res.send( JSON.stringify( card_obj ) );
    } catch( error ) {
      console.error( error );
      error_log.log_error(
        sqlPool,
        "cards.js::attach_get_card_card_id_route()",
        req.ip,
        error
      );

      res.send( JSON.stringify({
        "result": "error",
        "error_message": "Unspecified error attempting to retrieve card."
      }));
    }
  });
}
exports.atttach_get_card_card_id_route = atttach_get_card_card_id_route;


function attach_card_result_route( error_log, app, sqlPool ) {
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
      error_log.log_error(
        sqlPool,
        "cards.js::attach_card_result_route()",
        req.ip,
        error
      );

      res.send( JSON.stringify({
        "result": "error"
      }));
    }
  });
}
exports.attach_card_result_route = attach_card_result_route;