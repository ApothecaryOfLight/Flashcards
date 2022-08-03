async function attach_get_subjects( error_log, app, sqlPool ) {
    app.get( '/get_subjects/:first/:second/:third', async function (req,res) {
        try {
            const response = {};
            const first_level_query = "SELECT " +
                "1_level_subjects.name as name, " + 
                "1_level_subjects.1_level_subject_id as id " +
                "FROM 1_level_subjects;";
            const [first_rows,first_fields] =
                await sqlPool.query( first_level_query);
            response.level_1 = first_rows;

            if( req.params.first != -1 ) {
                const second_level_query = "SELECT " +
                    "2_level_subjects.name as name, " +
                    "2_level_subjects.2_level_subject_id as id " +
                    "FROM 2_level_subjects " +
                    "INNER JOIN 1_level_subjects ON " +
                    "2_level_subjects.member_of_1_level_subject_id = " +
                    "1_level_subjects.1_level_subject_id " +
                    "WHERE 1_level_subjects.1_level_subject_id = " +
                    req.params.first + ";"
                    const [second_rows,second_fields] =
                        await sqlPool.query( second_level_query );
                    response.level_2 = second_rows;
            } else {
                const second_level_query = "SELECT " +
                    "2_level_subjects.name as name, " +
                    "2_level_subjects.2_level_subject_id as id " +
                    "FROM 2_level_subjects " +
                    "INNER JOIN 1_level_subjects ON " +
                    "2_level_subjects.member_of_1_level_subject_id = " +
                    "1_level_subjects.1_level_subject_id " +
                    "WHERE 1_level_subjects.1_level_subject_id = " +
                    response.level_1[0].id + ";"
                    const [second_rows,second_fields] =
                        await sqlPool.query( second_level_query );
                    response.level_2 = second_rows;
            }

            if( req.params.second != -1 ) {
                const third_level_query = "SELECT " +
                    "3_level_subjects.name as name, " +
                    "3_level_subjects.3_level_subject_id as id " +
                    "FROM 3_level_subjects " +
                    "INNER JOIN 2_level_subjects ON " +
                    "3_level_subjects.member_of_2_level_subject_id = " +
                    "2_level_subjects.2_level_subject_id " +
                    "WHERE 2_level_subjects.2_level_subject_id = " +
                    req.params.second + ";"
                    const [third_rows,third_fields] =
                        await sqlPool.query( third_level_query );
                    response.level_3 = third_rows;
            } else if( Object.keys(response.level_2).length != 0) {
                const third_level_query = "SELECT " +
                    "3_level_subjects.name as name, " +
                    "3_level_subjects.3_level_subject_id as id " +
                    "FROM 3_level_subjects " +
                    "INNER JOIN 2_level_subjects ON " +
                    "3_level_subjects.member_of_2_level_subject_id = " +
                    "2_level_subjects.2_level_subject_id " +
                    "WHERE 2_level_subjects.2_level_subject_id = " +
                    response.level_2[0].id + ";"
                    const [third_rows,third_fields] =
                        await sqlPool.query( third_level_query );
                    response.level_3 = third_rows;
            }

            if( req.params.third != -1 ) {
                const fourth_level_query = "SELECT " +
                    "4_level_subjects.name as name, " +
                    "4_level_subjects.4_level_subject_id as id " +
                    "FROM 4_level_subjects " +
                    "INNER JOIN 3_level_subjects ON " +
                    "4_level_subjects.member_of_3_level_subject_id = " +
                    "3_level_subjects.3_level_subject_id " +
                    "WHERE 3_level_subjects.3_level_subject_id = " +
                    req.params.third + ";"
                    const [fourth_rows,fourth_fields] =
                        await sqlPool.query( fourth_level_query );
                    response.level_4 = fourth_rows;
            } else if( Object.keys(response.level_3).length != 0)  {
                const fourth_level_query = "SELECT " +
                    "4_level_subjects.name as name, " +
                    "4_level_subjects.4_level_subject_id as id " +
                    "FROM 4_level_subjects " +
                    "INNER JOIN 3_level_subjects ON " +
                    "4_level_subjects.member_of_3_level_subject_id = " +
                    "3_level_subjects.3_level_subject_id " +
                    "WHERE 3_level_subjects.3_level_subject_id = " +
                    response.level_3[0].id + ";"
                    const [fourth_rows,fourth_fields] =
                        await sqlPool.query( fourth_level_query );
                    response.level_4 = fourth_rows;
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
    app.get( '/add_subject/:level/:subject_name/:parent_id', async function (req,res) {
        try {
            const parent_level = Number(req.params.level) - 1;
            const insert_query = "INSERT INTO " +
                req.params.level + "_level_subjects " +
                "(name,member_of_" + parent_level + "_level_subject_id) " +
                "VALUES (\'" +
                req.params.subject_name + "\'," +
                req.params.parent_id + ");"
            const [rows,fields] = await sqlPool.query( insert_query );
            res.send( JSON.stringify({yay:"yayer"}));
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_add_subject()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error adding subject."
            }));
        }
    });
}
exports.attach_add_subject = attach_add_subject;

async function attach_delete_subject( error_log, app, sqlPool ) {
    app.get( '/delete_subject/:level/:subject_id', async function (req,res) {
        try {
            const delete_query = "DELETE FROM " +
                req.params.level + "_level_subjects " +
                "WHERE " + req.params.level + "_level_subject_id = " +
                req.params.subject_id + ";"
            const [rows,fields] = await sqlPool.query( delete_query );
            res.send( JSON.stringify({yay:"yayer"}));
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_delete_subject()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error deleting subject."
            }));
        }
    });
}
exports.attach_delete_subject = attach_delete_subject;