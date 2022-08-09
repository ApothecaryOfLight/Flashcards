async function index_search_data( error_log, sanitizer, id, topics, text, isCard, sqlPool ) {
    try {
      if( Array.isArray(text) && isCard ) {
        let texts = "";
        text.forEach( (object) => {
          if( object.type == "text" ) {
            texts += object.content;
          }
        });
        text = texts.replace( /\s+/g, ' ' );
      }
      
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
          in_terms.push(  sanitizer.process_input( topics[index] ) );
        }
        table += "topics ";
      }
  
      //2b) If text
      if( text ) {
        in_terms = text.split(" ");
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
        let insert_query = "INSERT INTO " + table + insert_fields;
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
      error_log.log_error(
        sqlPool,
        "indexer.js::index_search_data()",
        "User",
        error_obj
      );

      console.error( error_obj );
    }
  }
  exports.index_search_data = index_search_data;

async function attach_route_rebuild_search_index( error_log, app, sqlPool, sanitizer ) {
  app.get('/rebuild_search_index', async function(req,res) {
    try {
      const truncate_search_table = "TRUNCATE search_table;";
      const [truncate_rows,truncate_fields] = await sqlPool.query( truncate_search_table );

      const get_cardlist = "SELECT card_id FROM cards;";
      const [all_card_ids_rows,all_card_ids_fields] = await sqlPool.query( get_cardlist );
      all_card_ids_rows.forEach( async (card) => {
        const get_cardtext_query = "SELECT answer, question, card_id, set_id " +
          "FROM cards " +
          "WHERE cards.card_id = " + card.card_id + ";";
        const [card_text_rows,card_text_fields] = await sqlPool.query( get_cardtext_query );
        card_text_rows.forEach( async (card_text) => {
          try {
            const card_question_object = JSON.parse(card_text.question);
            let card_question_text = "";
            let card_search_terms = [];
            card_question_object.forEach( (question_object) => {
              if( question_object.type == "text" ) {
                card_question_text += question_object.content.toLowerCase() + " " + card_text.answer;
                card_search_terms = card_question_text.split(" ");
              }
            })
            let insertion_query = "INSERT INTO search_table (name, card_id, set_id) VALUES ";
            card_search_terms.forEach( (term) => {
              insertion_query += "( \'" + term + "\', " + card_text.card_id + ", " + card_text.set_id + "), "
            });
            insertion_query = insertion_query.slice(
              0,
              insertion_query.length - 2
            );
            insertion_query += ";"
            const [insertion_rows,insertion_fields] = await sqlPool.query( insertion_query );
          } catch( error ) {
            console.log( card_text.question );
            console.error( error );
          }
        });
      });
      res.send( JSON.stringify({
        response: "Success!",
        content: all_card_ids_rows
      }) );
    } catch(error_obj) {
      error_log.log_error(
        sqlPool,
        "indexer.js::rebuild_search_index()",
        "User",
        error_obj
      );
    }
  });
}
exports.attach_route_rebuild_search_index = attach_route_rebuild_search_index;