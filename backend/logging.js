const file_system = require('fs');

let logging_file;
function init_log() {
  console.log( "Initializing error log." );
  try {
    //1) If logs directory doesn't exist, create it.
    if( !file_system.existsSync( "./logs" ) ) {
      file_system.mkdirSync( "./logs" );
    }

    //2) Get timestamp to give log a unique(ish) name.
    const date = new Date();
    let date_string = date.toString();
    date_string = date_string.substr( 0, date_string.length-38 );
    date_string = date_string.replace( /\s/g, '_' );
    logging_file = "logs/" + date_string;

    //3) Create the log and write the first line to file.
    file_system.writeFile( logging_file, "Initializing log.\n<br>",
      function(err) {
        if( err ) {
          throw err;
        }
      }
    );
  } catch( error ) {
    //On error log to screen, because this was an error in creating the logs!
    console.group();
    console.log( "Filesystem error!" );
    console.error( error );
    console.groupEnd();
  }
  console.log( "Error log initialized." );
}
function log( type, msg, conn ) {
  try{
    const time_stamp = new Date();
    let date_string = time_stamp.toString();
    date_string = date_string.substr( 0, date_string.length-38 );
    date_string = date_string.replace( /\s/g, '_' );
    let log_message = date_string + "::" + type;
    if( conn ) {
      log_message += "@" + conn.socket.remoteAddress;
    }
    log_message += "::" + msg + "\n<br>";
    file_system.appendFile( logging_file, log_message, function(error) {
      if( error ) {
        throw error;
      }
    });
  } catch( error ) {
    //On error log to screen, because this was an error in writing to the logs!
    console.group();
    console.log( "Filesystem error!" );
    console.error( error );
    console.groupEnd();
  }
}

//export { init_log, log }
exports.init_log = init_log;
exports.log = log;
