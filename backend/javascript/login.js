function attach_login_route( error_log, app, sqlPool ) {
  /*Login*/
  app.post('/login', async function(req,res ) {
    try {
      const login_query = "SELECT password_hash FROM users WHERE " +
        "username_hash = \'" + req.body.username + "\';"
      const [login_row,login_field] = await sqlPool.query( login_query );
      const password_hash = String.fromCharCode.apply(null, login_row[0].password_hash);
      if( password_hash == req.body.password ) {
        res.send( JSON.stringify({
          "result": "approve",
          "username_hash": req.body.username
        }));
      } else {
        res.send( JSON.stringify({
          "result": "refused",
          "reason": "Credentials failed to authenticate!",
        }));
      }
    } catch( error ) {
      console.log( error );
      res.send( JSON.stringify({
        "result": "refused",
        "reason": "Unspecified."
      }));
    }
  });
}
exports.attach_login_route = attach_login_route;

function attach_create_account_route( error_log, app, sqlPool ) {
    /*Create Account*/
    app.post('/create_account', async function(req,res) {
      try {
        const create_acct_query = "INSERT INTO users " +
          "( username_hash, password_hash )" +
          " VALUES ( \'" + req.body.username + "\', \'" + req.body.password + "\');";
        const [create_acct_row, create_acct_field] =
          await sqlPool.query( create_acct_query );
        res.send( JSON.stringify({
          "result": "approve",
          "username_hash": req.body.username
        }));
      } catch( error ) {
        console.log( error );
        res.send( JSON.stringify({
          "result": "error",
          "error_message": "Unspecified error attempting to create account."
        }));
      }
    });
}
exports.attach_create_account_route = attach_create_account_route;