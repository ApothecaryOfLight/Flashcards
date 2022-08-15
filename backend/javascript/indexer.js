async function index_search_data( error_log, sqlPool, sanitizer, card_id, set_id, question, answer ) {
  try {
    if( answer == null ) {
      answer = "";
    }
    const card_question_object = JSON.parse(question);
    let card_question_text = "";
    let card_search_terms = [];
    card_question_object.forEach( (question_object) => {
      if( question_object.type == "text" ) {
        card_question_text += question_object.content.toLowerCase() + " " + answer;
        card_search_terms = card_question_text.split(" ");
      }
    });
    if( card_id ) {
      let insertion_query = "INSERT INTO search_table (name, card_id, set_id) VALUES ";
      card_search_terms.forEach( (term) => {
        insertion_query += "( \'" + term + "\', " + card_id + ", " + set_id + "), "
      });
      insertion_query = insertion_query.slice(
        0,
        insertion_query.length - 2
      );
      insertion_query += ";"
      const [insertion_rows,insertion_fields] = await sqlPool.query( insertion_query );
    } else {
      let insertion_query = "INSERT INTO search_table (name, set_id) VALUES ";
      card_search_terms.forEach( (term) => {
        insertion_query += "( \'" + term + "\', " + set_id + "), "
      });
      insertion_query = insertion_query.slice(
        0,
        insertion_query.length - 2
      );
      insertion_query += ";"
      const [insertion_rows,insertion_fields] = await sqlPool.query( insertion_query );
    }
  } catch( error_obj ) {
    console.error( error_obj );
    error_log.log_error(
      sqlPool,
      "indexer.js::index_search_data()",
      "User",
      error_obj
    );
  }
}
exports.index_search_data = index_search_data;

async function attach_route_rebuild_search_index( error_log, app, sqlPool, sanitizer ) {
  app.get('/rebuild_search_index', async function(req,res) {
    try {
      //1) Delete the contents of the search table.
      const truncate_search_table = "TRUNCATE search_table;";
      const [truncate_rows,truncate_fields] = await sqlPool.query( truncate_search_table );

      //2) Repopulate the search table with the data from all cards.
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
          } catch( error_obj ) {
            console.error( error_obj );
            error_log.log_error(
              sqlPool,
              "indexer.js::rebuild_search_index()",
              "User",
              error_obj
            );
          }
        });
      });

      //2) Repopulate the search table with data from all set names.
      const get_set_names = "SELECT name, set_id FROM sets;";
      const [set_name_rows,set_name_fields] = await sqlPool.query( get_set_names );
      set_name_rows.forEach( (set) => {
        try {
          const search_terms = set.name.toLowerCase().split(" ");
          try{
            search_terms.forEach( async (term) => {
              const index_set_name_query = "INSERT INTO search_table (name, set_id) VALUES (" +
                "\'" + term + "\'" + "," + set.set_id + ");";
              const [insert_row,insert_field] = await sqlPool.query( index_set_name_query );
            });
          } catch( error_obj ) {
            error_log.log_error(
              sqlPool,
              "indexer.js::rebuild_search_index():: Iterating through each set name.",
              "User",
              error_obj
            );
          }
        } catch( error_obj ) {
          error_log.log_error(
            sqlPool,
            "indexer.js::rebuild_search_index():: Rebuilding index from set names.",
            "User",
            error_obj
          );
        }
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