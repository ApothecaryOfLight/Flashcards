async function index_search_data( sanitizer, id, topics, text, isCard ) {
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
          in_terms.push(  sanitizer.process_tag( topics[index], "" ) );
        }
        table += "topics ";
      }
  
      //2b) If text
      if( text ) {
        in_terms = sanitizer.process_tag(text).split("&nbsp;");
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
  exports.index_search_data = index_search_data;