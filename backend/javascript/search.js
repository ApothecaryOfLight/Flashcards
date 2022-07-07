function attach_searchlist_route( error_log, app, sqlPool ) {
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
          "SELECT SUM(page_count) as page_count FROM (" +
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
          ")" +
          ") as tmp_table;";
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
      error_log.log_error(
        sqlPool,
        "search.js::attach_searchlist_route()",
        req.ip,
        error
      );

      console.log( error );
      res.send( JSON.stringify({
        "result": "error",
        "error_message": error.toString()
      }));
    }
  });
}
exports.attach_searchlist_route = attach_searchlist_route;