function attach_cardlist_page_num_route( error_log, app, sqlPool ) {
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
          error_log.log_error(
            sqlPool,
            "cardlist.js::attach_cardlist_page_num_route()",
            req.ip,
            error
          );

          res.send( JSON.stringify({
            "result": "failure",
            "error_message": "Unspecified error attempting to get card list."
          }));
        }
      });
}
exports.attach_cardlist_page_num_route = attach_cardlist_page_num_route;

function attach_get_cardlist_setid_route( error_log, app, sqlPool, fs ) {
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

        //Get a list of images for each card
        const images_query = "SELECT card_id, image_place, file_location, image_array_location " +
          "FROM images_registry " +
          "WHERE set_id = " + req.params.set_id + ";";
        const [images_row,images_field] = await sqlPool.query( images_query );

  
        const set_images = {};
        images_row.forEach( (image_row) => {
          if( set_images[image_row.card_id] == undefined ) {
            set_images[image_row.card_id] = [];
          }
          set_images[ image_row.card_id ][ image_row.image_array_location ] = fs.readFileSync(
            './images/' + image_row.file_location,
            {
              encoding: 'utf8',
              flag: 'r'
            },
            error => {
              error_log.log_error(
                sqlPool,
                "cardlist.js::attach_get_cardlist_setid_route():: Loading Images Loop",
                req.ip,
                error
              );
              console.log("error");
              console.error( error );
            }
          );
        });

  
        const get_cardlist_topics = "SELECT name FROM cardset_search_topics " +
          "WHERE set_id = " + req.params.set_id + ";";
        const [topics_rows,topics_fields] =
          await sqlPool.query( get_cardlist_topics );
  
        const cardlist_obj = {
          result: "success",
          set_name: set_name_row[0],
          cards: cardlist_row,
          topics: topics_rows,
          set_images: set_images
        };
  
        res.send( JSON.stringify( cardlist_obj ) );
      } catch( error ) {
        error_log.log_error(
          sqlPool,
          "cardlist.js::attach_get_cardlist_setid_route()",
          req.ip,
          error
        );

        console.log( error );
        res.send( JSON.stringify({
          "result": "error",
          "error_message": "Unspecified error attempting to retrieve cardlist."
        }));
      }
    });
}
exports.attach_get_cardlist_setid_route = attach_get_cardlist_setid_route;