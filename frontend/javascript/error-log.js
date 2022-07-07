/*
Apply regex to the given string to replace some HTML character codes with their
standard ASCII equivalents.
*/
function reverse_process_text( inText ) {
    let processed_text = inText.replace(
      /&#39;/g,
      "\'"
    );
    processed_text = processed_text.replace(
      /&#34;/g,
      "\""
    );
    processed_text = processed_text.replace(
      /&#92;/g,
      "\\"
    );
    processed_text = processed_text.replace(
      /&#47;/g,
      "\/"
    );
    return processed_text;
}


/*
This function fetches the error log from the server, calls the function that will parse
the information into an HTML table, and appends that to the DOM.
*/
function get_error_log() {
  const get_error_log_request = new Request(
      ip + 'get_error_log'
  );
  fetch( get_error_log_request )
  .then( json => json.json() )
  .then( json => {
    const error_log_container = document.getElementById("error-log-container");
    while( error_log_container.firstChild ) {
      error_log_container.removeChild( error_log_container.firstChild );
    }
    error_log_container.appendChild( compose_error_log( json ) );
  });
}


/*
This function fetches the event log from the server, calls the function that will parse
the information into an HTML table, and appends that to the DOM.
*/
function get_event_log() {
  const get_event_log_request = new Request(
      ip + 'get_event_log'
  );
  fetch( get_event_log_request )
  .then( json => json.json() )
  .then( json => {
    const event_log_container = document.getElementById("event-log-container");
    while( event_log_container.firstChild ) {
      event_log_container.removeChild( event_log_container.firstChild );
    }
    event_log_container.appendChild( compose_event_log( json.event_log ) );
  });
}