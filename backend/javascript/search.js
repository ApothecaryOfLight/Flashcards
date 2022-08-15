function attach_searchlist_route( error_log, app, sqlPool ) {
  /*Get a list of either sets or cards for the Serach Interface*/
  app.post( '/searchlist', async function(req,res) {
    try {
      console.log("search!" );
      if( req.body.search_type == "card" ) {
        let subject_predicate = "";
        let search_query = "SELECT SQL_CALC_FOUND_ROWS " +
          "cards.set_id, cards.question, cards.answer, sets.set_creator " +
          "FROM cards " +
          "INNER JOIN sets " +
          "ON cards.set_id = sets.set_id ";
        if( req.body.subject_level > 1 ) {
          const subject_parent_level = req.body.subject_level - 1;
          search_query += "INNER JOIN subject_set_listing " +
            "ON cards.set_id = subject_set_listing.set_id " +
            "INNER JOIN " + subject_parent_level + "_level_subjects " +
            "ON subject_set_listing." + subject_parent_level + "_level_subject_id = " +
            subject_parent_level + "_level_subjects." + subject_parent_level + "_level_subject_id ";
          subject_predicate = subject_parent_level + "_level_subjects." + 
            subject_parent_level + "_level_subject_id = " + req.body.subject_parent_id + " ";
        }
        let search_predicate = "";
        if( req.body.topics.length > 0 ) {
          search_query += "INNER JOIN search_table " +
            "ON cards.card_id = search_table.card_id ";
          search_predicate = "(";
          for( index in req.body.topics ) {
            search_predicate += "search_table.name = \'" + req.body.topics[index] + "\' OR "
          }
          search_predicate = search_predicate.slice(
            0,
            search_predicate.length - 3
          );
          search_predicate += ") ";
        }
        if( req.body.subject_level > 1 || req.body.topics.length > 0 ) {
          search_query += "WHERE ";
          if( req.body.topics.length > 0 ) {
            search_query += search_predicate;
          }
          if( req.body.subject_level > 1 && req.body.topics.length > 0 ) {
            search_query += " AND ";
          }
          if( req.body.subject_level > 1 ) {
            search_query += subject_predicate;
          }
        }

        const page_offset = Number( req.body.page_num ) * 10;
        search_query += "GROUP BY cards.question, cards.answer, cards.set_id, sets.set_creator " +
          "ORDER BY sets.name " +
          "LIMIT 10 OFFSET " + page_offset + "; " +
          "SELECT FOUND_ROWS();"

        const [search_rows,search_fields] = await sqlPool.query( search_query );
        res.send( JSON.stringify({
          "result": "success",
          "set_rows": search_rows[0],
          "page_count": search_rows[1][0]["FOUND_ROWS()"]/10,
          "search_type": req.body.search_type
        }));
      } else if( req.body.search_type == "set" ) {
        let subject_predicate = "";
        let search_query = "SELECT SQL_CALC_FOUND_ROWS " +
          "sets.set_id, sets.name, sets.set_creator " +
          "FROM sets ";
        if( req.body.subject_level > 1 ) {
          const subject_parent_level = req.body.subject_level - 1;
          search_query += "INNER JOIN subject_set_listing " +
            "ON sets.set_id = subject_set_listing.set_id " +
            "INNER JOIN " + subject_parent_level + "_level_subjects " +
            "ON subject_set_listing." + subject_parent_level + "_level_subject_id = " +
            subject_parent_level + "_level_subjects." + subject_parent_level + "_level_subject_id ";
          subject_predicate = subject_parent_level + "_level_subjects." + 
            subject_parent_level + "_level_subject_id = " + req.body.subject_parent_id + " ";
        }
        let search_predicate = "";
        if( req.body.topics.length > 0 ) {
          search_query += "INNER JOIN search_table " +
            "ON sets.set_id = search_table.set_id ";
          search_predicate = "(";
          for( index in req.body.topics ) {
            search_predicate += "search_table.name = \'" + req.body.topics[index] + "\' OR "
          }
          search_predicate = search_predicate.slice(
            0,
            search_predicate.length - 3
          );
          search_predicate += ") ";
        }
        if( req.body.subject_level > 1 || req.body.topics.length > 0 ) {
          search_query += "WHERE ";
          if( req.body.topics.length > 0 ) {
            search_query += search_predicate;
          }
          if( req.body.subject_level > 1 && req.body.topics.length > 0 ) {
            search_query += " AND ";
          }
          if( req.body.subject_level > 1 ) {
            search_query += subject_predicate;
          }
        }

        const page_offset = Number( req.body.page_num ) * 10;
        search_query += "GROUP BY sets.set_id, sets.name, sets.set_creator " +
          "ORDER BY sets.name " +
          "LIMIT 10 OFFSET " + page_offset + "; " +
          "SELECT FOUND_ROWS();"
console.log( search_query );
        const [search_rows,search_fields] = await sqlPool.query( search_query );
        res.send( JSON.stringify({
          "result": "success",
          "set_rows": search_rows[0],
          "page_count": search_rows[1][0]["FOUND_ROWS()"]/10,
          "search_type": req.body.search_type
        }));
      }
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