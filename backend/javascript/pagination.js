function attach_page_count_route( error_log, app, sqlPool ) {
    app.post( '/page_count', async function(req,res) {
        try {
          const page_count_query = "SELECT COUNT(sets.set_id) " +
            "AS count " +
            "FROM sets;";
          const [count_row,count_field] =
            await sqlPool.query( page_count_query );
          res.send( JSON.stringify({
            "result": "success",
            "count": count_row[0].count
          }));
        } catch( error_obj ) {
          error_log.log_error(
            sqlPool,
            "pagination.js::attach_page_count_route()",
            req.ip,
            error
          );

          console.error( error_obj );
          res.send( JSON.stringify({
            "result": "error",
            "reason": error_obj.toString()
          }));
        }
      });
}
exports.attach_page_count_route = attach_page_count_route;