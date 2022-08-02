async function attach_get_first_level_subjects( error_log, app, sqlPool ) {
    app.get( '/get_subjects_first/', async function (req,res) {
        try {
            const first_level_query = "SELECT name, first_level_subject_id " +
                "FROM first_level_subjects;"
            const [rows,fields] = await sqlPool.query( first_level_query);

            const response = JSON.stringify({
                first_level_subjects: rows
            });
            res.send( response );
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_get_first_level_subjects()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error looking up first level subjects."
            }));
        }
    });
}
exports.attach_get_first_level_subjects = attach_get_first_level_subjects;

async function attach_get_subjects( error_log, app, sqlPool ) {
    app.get( '/get_subjects/:first/:second/:third', async function (req,res) {
        try {
            const response = {};
            const first_level_query = "SELECT " +
                "first_level_subjects.name as name, " + 
                "first_level_subjects.first_level_subject_id as id " +
                "FROM first_level_subjects;";
            const [first_rows,first_fields] =
                await sqlPool.query( first_level_query);
            response.first_level = first_rows;

            if( req.params.first != -1 ) {
                const second_level_query = "SELECT " +
                    "second_level_subjects.name as name, " +
                    "second_level_subjects.second_level_subject_id as id " +
                    "FROM second_level_subjects " +
                    "INNER JOIN first_level_subjects ON " +
                    "second_level_subjects.member_of_first_level_subject_id = " +
                    "first_level_subjects.first_level_subject_id " +
                    "WHERE first_level_subjects.first_level_subject_id = " +
                    req.params.first + ";"
                    const [second_rows,second_fields] =
                        await sqlPool.query( second_level_query );
                    response.second_level = second_rows;
            } else {
                const second_level_query = "SELECT " +
                    "second_level_subjects.name as name, " +
                    "second_level_subjects.second_level_subject_id as id " +
                    "FROM second_level_subjects " +
                    "INNER JOIN first_level_subjects ON " +
                    "second_level_subjects.member_of_first_level_subject_id = " +
                    "first_level_subjects.first_level_subject_id " +
                    "WHERE first_level_subjects.first_level_subject_id = " +
                    response.first_level[0].id + ";"
                    const [second_rows,second_fields] =
                        await sqlPool.query( second_level_query );
                    response.second_level = second_rows;
            }

            if( req.params.second != -1 ) {
                const third_level_query = "SELECT " +
                    "third_level_subjects.name as name, " +
                    "third_level_subjects.third_level_subject_id as id " +
                    "FROM third_level_subjects " +
                    "INNER JOIN second_level_subjects ON " +
                    "third_level_subjects.member_of_second_level_subject_id = " +
                    "second_level_subjects.second_level_subject_id " +
                    "WHERE second_level_subjects.second_level_subject_id = " +
                    req.params.second + ";"
                    const [third_rows,third_fields] =
                        await sqlPool.query( third_level_query );
                    response.third_level = third_rows;
            } else if( Object.keys(response.second_level).length != 0) {
                const third_level_query = "SELECT " +
                    "third_level_subjects.name as name, " +
                    "third_level_subjects.third_level_subject_id as id " +
                    "FROM third_level_subjects " +
                    "INNER JOIN second_level_subjects ON " +
                    "third_level_subjects.member_of_second_level_subject_id = " +
                    "second_level_subjects.second_level_subject_id " +
                    "WHERE second_level_subjects.second_level_subject_id = " +
                    response.second_level[0].id + ";"
                    const [third_rows,third_fields] =
                        await sqlPool.query( third_level_query );
                    response.third_level = third_rows;
            }

            if( req.params.third != -1 ) {
                const fourth_level_query = "SELECT " +
                    "fourth_level_subjects.name as name, " +
                    "fourth_level_subjects.fourth_level_subject_id as id " +
                    "FROM fourth_level_subjects " +
                    "INNER JOIN third_level_subjects ON " +
                    "fourth_level_subjects.member_of_third_level_subject_id = " +
                    "third_level_subjects.third_level_subject_id " +
                    "WHERE third_level_subjects.third_level_subject_id = " +
                    req.params.third + ";"
                    const [fourth_rows,fourth_fields] =
                        await sqlPool.query( fourth_level_query );
                    response.fourth_level = fourth_rows;
            } else if( Object.keys(response.third_level).length != 0)  {
                const fourth_level_query = "SELECT " +
                    "fourth_level_subjects.name as name, " +
                    "fourth_level_subjects.fourth_level_subject_id as id " +
                    "FROM fourth_level_subjects " +
                    "INNER JOIN third_level_subjects ON " +
                    "fourth_level_subjects.member_of_third_level_subject_id = " +
                    "third_level_subjects.third_level_subject_id " +
                    "WHERE third_level_subjects.third_level_subject_id = " +
                    response.third_level[0].id + ";"
                    const [fourth_rows,fourth_fields] =
                        await sqlPool.query( fourth_level_query );
                    response.fourth_level = fourth_rows;
            }

            const string_response = JSON.stringify(response);
            res.send( string_response );
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_get_subjects()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error looking up subjects."
            }));
        }
    });
}
exports.attach_get_subjects = attach_get_subjects;


async function attach_add_subject( error_log, app, sqlPool ) {
    app.get( '/add_subject/:level/:subject_name/:parent_level/:parent_id', async function (req,res) {
        try {
            const insert_query = "INSERT INTO " +
                req.params.level + "_level_subjects " +
                "(name,member_of_" + req.params.parent_level + "_level_subject_id) " +
                "VALUES (\'" +
                req.params.subject_name + "\'," +
                req.params.parent_id + ");"
            const [rows,fields] = await sqlPool.query( insert_query );
            res.send( JSON.stringify({yay:"yayer"}));
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_get_first_level_subjects()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error looking up first level subjects."
            }));
        }
    });
}
exports.attach_add_subject = attach_add_subject;