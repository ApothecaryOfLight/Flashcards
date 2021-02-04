const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const mysql = require('mysql2');

const sqlPool = mysql.createPoolPromise({
  host: 'localhost',
  user: 'Flashcards_User',
  password: 'Flashcards_Password',
  database: 'Flashcards',
  connectionLimit: 45
});

sqlPool.getConnection()
  .then( conn => {
    console.log( "Connected!" );
    launchRoutes();
  });

function launchRoutes() {
  app.get('/setlist', async function(req,res) {
    const [row,field] = await sqlPool.query( "SELECT name FROM sets;" );


    console.log( row );
    let set_array = [];
    row.forEach( element => {
      console.log( element.name );
      set_array.push( element.name );
    });
    const setlist = JSON.stringify( set_array );
    res.send( setlist );
  });

  app.post('/request', function(req,res) {
    console.dir( req );
    console.log( "reqqy" );
    res.send('yuuuup');
  });

  app.listen(3000);
}
