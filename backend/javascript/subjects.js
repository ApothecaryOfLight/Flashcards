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

async function attach_get_subjects_by_level( error_log, app, sqlPool ) {
    app.get( '/get_subjects_by_level/:level/:parent_id', async function (req,res) {
        try {
            let get_subjects_query = "SELECT " +
                "name, " +
                req.params.level + "_level_subject_id as id " +
                "FROM " + req.params.level + "_level_subjects ";
            if( req.params.parent_id != -1 ) {
                const parent_level = Number(req.params.level) - 1;
                get_subjects_query += "WHERE " +
                    "member_of_" + parent_level + "_level_subject_id = " +
                    req.params.parent_id;
            }
            get_subjects_query += ";"
            const [rows,fields] = await sqlPool.query( get_subjects_query );

            const response_object = {
                search_tags: rows
            };

            res.send( JSON.stringify(response_object) );
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_get_subjects_by_level()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error getting subjects by level."
            }));
        }
    });
}
exports.attach_get_subjects_by_level = attach_get_subjects_by_level;

async function attach_get_subjects_above( error_log, app, sqlPool ) {
    app.get( '/get_subjects_above/:level/:child_id', async function (req,res) {
        try {
            let get_subjects_query = "SELECT " +
                req.params.level + "_level_subjects.name, " +
                req.params.level + "_level_subject_id as id " +
                "FROM " + req.params.level + "_level_subjects";
            if( req.params.level > 1 ) {
                const parent_level = Number(req.params.level) - 1;
                get_subjects_query += " WHERE " +
                    "member_of_" + parent_level + "_level_subject_id = (" +
                    "SELECT " +
                    req.params.level + "_level_subjects." +
                    "member_of_" + parent_level + "_level_subject_id " +
                    "FROM " + req.params.level + "_level_subjects " +
                    "WHERE " + req.params.level + "_level_subjects." +
                    req.params.level + "_level_subject_id = " +
                    req.params.child_id + ")";
            }
            get_subjects_query += ";"
            const [rows,fields] = await sqlPool.query( get_subjects_query );

            const response_object = {
                search_tags: rows
            };

            res.send( JSON.stringify(response_object) );
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_get_subjects_above()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error getting subjects above."
            }));
        }
    });
}
exports.attach_get_subjects_above = attach_get_subjects_above;


async function attach_get_subjects_by_set( error_log, app, sqlPool ) {
    app.get( '/get_subjects_by_set/:set_id', async function (req,res) {
        try {
            const get_curr_subjects_query = "SELECT " +
                "subject_set_listing.set_id, " +
                "1_level_subjects.1_level_subject_id as 1_id, " +
                "2_level_subjects.2_level_subject_id as 2_id, " +
                "3_level_subjects.3_level_subject_id as 3_id, " +
                "4_level_subjects.4_level_subject_id as 4_id " +
                "FROM subject_set_listing " +
                "LEFT JOIN 1_level_subjects " +
                "ON subject_set_listing.1_level_subject_id = 1_level_subjects.1_level_subject_id " +
                "LEFT JOIN 2_level_subjects " +
                "ON subject_set_listing.2_level_subject_id = 2_level_subjects.2_level_subject_id " +
                "LEFT JOIN 3_level_subjects " +
                "ON subject_set_listing.3_level_subject_id = 3_level_subjects.3_level_subject_id " +
                "LEFT JOIN 4_level_subjects " +
                "ON subject_set_listing.4_level_subject_id = 4_level_subjects.4_level_subject_id " +
                "WHERE subject_set_listing.set_id = " + req.params.set_id + ";";
            const [curr_set_rows,fields] = await sqlPool.query( get_curr_subjects_query );

            const get_available_subjects_1_query = "SELECT " +
                "1_level_subjects.name, " +
                "1_level_subjects.1_level_subject_id as id " +
                "FROM 1_level_subjects;";
            const [subjects_1_rows,fields_1] = await sqlPool.query( get_available_subjects_1_query );

            const get_available_subjects_2_query = "SELECT " +
                "2_level_subjects.name, " +
                "2_level_subjects.2_level_subject_id as id, " +
                "2_level_subjects.member_of_1_level_subject_id as parent_id " +
                "FROM 2_level_subjects;";
            const [subjects_2_rows,fields_2] = await sqlPool.query( get_available_subjects_2_query );
            
            const get_available_subjects_3_query = "SELECT " +
                "3_level_subjects.name, " +
                "3_level_subjects.3_level_subject_id as id, " +
                "3_level_subjects.member_of_2_level_subject_id as parent_id " +
                "FROM 3_level_subjects;";
            const [subjects_3_rows,fields_3] = await sqlPool.query( get_available_subjects_3_query );
            
            const get_available_subjects_4_query = "SELECT " +
                "4_level_subjects.name, " +
                "4_level_subjects.4_level_subject_id as id, " +
                "4_level_subjects.member_of_3_level_subject_id as parent_id " +
                "FROM 4_level_subjects;";
            const [subjects_4_rows,fields_4] = await sqlPool.query( get_available_subjects_4_query );

            const response_object = {
                set_subjects: curr_set_rows,
                all_subjects: [
                    subjects_1_rows,
                    subjects_2_rows,
                    subjects_3_rows,
                    subjects_4_rows
                ]
            };
            res.send( JSON.stringify( response_object ) );
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_get_subjects_by_set()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error getting subjects above."
            }));
        }
    });
}
exports.attach_get_subjects_by_set = attach_get_subjects_by_set;

async function attach_update_subjects( error_log, app, sqlPool ) {
    app.get( '/update_subjects/:set_id/:level_1/:level_2/:level_3/:level_4', async function (req,res) {
        try {
            const are_set_subjects_indexed_query = "SELECT set_id " +
                "FROM subject_set_listing WHERE set_id = " + req.params.set_id + ";";
            const [exists_row,exists_field] = await sqlPool.query( are_set_subjects_indexed_query );

            if( exists_row.length > 0 ) {
                const update_query = "UPDATE subject_set_listing " +
                    "SET 1_level_subject_id = " + req.params.level_1 + ", " +
                    "2_level_subject_id = " + req.params.level_2 + ", " +
                    "3_level_subject_id = " + req.params.level_3 + ", " +
                    "4_level_subject_id = " + req.params.level_4 + " " +
                    "WHERE set_id = " + req.params.set_id + ";";
                const [row,field] = await sqlPool.query( update_query );
            } else {
                const insert_query = "INSERT INTO subject_set_listing " +
                    "(set_id, 1_level_subject_id, 2_level_subject_id, " +
                    "3_level_subject_id, 4_level_subject_id) " +
                    "VALUES (" + req.params.set_id + "," + req.params.level_1 + "," +
                    req.params.level_2 + "," + req.params.level_3 + "," +
                    req.params.level_4 + ");";
                const [row,field] = await sqlPool.query( insert_query );
            }

            res.send( JSON.stringify({
                status: "Success!"
            }) );
        } catch( error ) {
            error_log.log_error(
              sqlPool,
              "subjects.js::attach_update_subjects()",
              req.ip,
              error
            );
  
            res.send( JSON.stringify({
              "result": "failure",
              "error_message": "Error getting subjects above."
            }));
        }
    });
}
exports.attach_update_subjects = attach_update_subjects;