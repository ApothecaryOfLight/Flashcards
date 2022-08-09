function attach_setlist_page_num_route( error_log, app, sqlPool ) {
    app.get('/setlist/:page_num', async function(req,res) {
        try {
            const page_count_query = "SELECT " +
                "COUNT(sets.set_id) AS page_count " +
                "FROM sets;"
            const [count_row,count_field] =
            await sqlPool.query( page_count_query );

            const offset = req.params.page_num * 10;
            const setlist_query = "SELECT " +
                "name, set_id, set_creator " +
                "FROM sets " +
                "ORDER BY name " +
                "LIMIT 10 " +
                "OFFSET " + offset +
                ";"

            const [set_rows,field] = await sqlPool.query( setlist_query );
            const setlist = JSON.stringify({
                "set_rows": set_rows,
                "page_count": count_row[0].page_count/10
            });
            res.send( setlist );
        } catch( error ) {
            console.log( error );
            error_log.log_error(
                sqlPool,
                "setlist.js::attach_setlist_page_num_route()",
                req.ip,
                error
            );

            res.send( JSON.stringify({
                "result": "error",
                "error_message": "Unspecified error attempting to get set list."
            }));
        }
    });
}
exports.attach_setlist_page_num_route = attach_setlist_page_num_route;