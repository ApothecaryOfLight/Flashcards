function attach_temporary_set_route( app, sqlPool ) {
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
            "SELECT " +
            "cards.card_id, cards.question, cards.answer, " +
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
    
            temp_set_query += "WHERE (" +
              cardset_search_topics_predicate.substr(6) + " OR " +
              cardset_search_text_predicate.substr(6) + " OR " +
              card_search_topics_predicate.substr(6) + " OR " +
              card_search_text_predicate.substr(6) + ") ";
          }
    
          if( req.body.username_hash != "unlogged" ) {
            temp_set_query += "AND ( card_record.username_hash = " +
              "\'" + req.body.username_hash + "\' " +
              "OR card_record.username_hash IS NULL ) ";
          }
    
          temp_set_query += "GROUP BY card_id " +
            "ORDER BY " +
            "COALESCE( SUM(card_record.result), -100 ) " +
            " -(Latest/100) ASC " +
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
}
exports.attach_temporary_set_route = attach_temporary_set_route;