"use strict"

/*
This is the meat of the compose event log functionality. It takes the event log as its
argument, and returns an element containing the entire event log formatted as an HTML
table, with expandable/collapsible hidden rows for the details Objects.
*/
function compose_event_log( event_log_obj ) {
  //Create a document fragment that will act as a DOM element within which we will
  //create our table.
  const event_log = document.createDocumentFragment();
  
  //Create the table element itself, assign it the appropriate CSS class, and append
  //it to the document fragment.
  const table = document.createElement("table");
  table.classList = "table_body";
  event_log.appendChild(table);

  //Create the table heading element and append it to the table.
  const table_title = document.createElement("thread");
  table.appendChild( table_title );

  //Create the table heading row and cell.
  const table_title_row = document.createElement("tr");
  const table_header = document.createElement("th");
  //Set the table heading text to event log.
  table_header.innerText = "Event Log";
  //Make the table heading span the whole table.
  table_header.colspan = 4;
  //Append the table heading cell to the table heading row.
  table_title_row.appendChild( table_header );
  //Append the table heading row to the table heading.
  table_title.appendChild( table_title_row );

  //Create the table body itself, and attach it to the table.
  const table_body = document.createElement("tbody");
  table_body.classList = "table_body";
  table.appendChild( table_body );

  //Iterate through every event in the event log.
  for( const event_key in event_log_obj ) {
    //Get a reference to this event.
    const event_obj = event_log_obj[event_key];

    //Create the row for this event.
    const event_container = document.createElement("tr");
    event_container.className = 'table_row';

    //Create a cell for the timestamp, put the timestamp in it as text, and append it
    //to the row.
    const event_timestamp = document.createElement("td");
    event_timestamp.className = 'table_cell';
    event_timestamp.innerText = format_datetime( new Date(event_obj.timestamp) );
    event_container.appendChild( event_timestamp );

    //Create a cell for the event source, put the source in it as text, and append it
    //to the row.
    const event_code_source = document.createElement("td");
    event_code_source.className = 'table_cell';
    event_code_source.innerText = event_obj.code_source;
    event_container.appendChild( event_code_source );

    //Create a cell for the event message, put the message in it as text, and append it
    //to the row.
    const event_message = document.createElement("td");
    event_message.className = 'table_cell';
    event_message.innerText = event_obj.message;
    event_container.appendChild( event_message );

    //Create a cell for the event IP, put the IP in it as text, and append it
    //to the row.
    const event_ip = document.createElement("td");
    event_ip.className = 'table_cell';
    event_ip.innerText = event_obj.ip;
    event_container.appendChild( event_ip );

    //Create a cell for the expand/collapse button, whether or not we'll need
    //one for this row.
    const event_details_button_row = document.createElement("td");

    
    //Check to see if there is a details object to use.
    if( typeof( event_obj.details ) != "undefined" ) {
      //If so, parse the text into something the user can easily read.
      const details_event = JSON.parse( reverse_process_text( event_obj.details ) );

      //Create the expandable/collapsible element itself.
      //This will return the element of the row, as well as a reference to the div that
      //will actually be expanded or collapsed.
      const collapsible_object = compose_collapsible_object( details_event );

      //Create an element to contain the expandable/collapsable row.
      const details_event_container = collapsible_object.whole_object;
      details_event_container.className = "";
      
      //Append the show (expand) button to the last cell in this row.
      event_details_button_row.appendChild( compose_show_details_button(collapsible_object.log_details_conatiner) );

      //Append the elements comprising the expandable/collapsible row to their
      //intended respective parents and ultiamtely the table body itself.
      event_container.appendChild( event_details_button_row );
      table_body.appendChild( event_container );
      table_body.appendChild( details_event_container );
    } else {
      //There is no details object to worry about. Append an empty cell to end the row.
      event_container.appendChild( event_details_button_row );
      table_body.appendChild( event_container );
    }
  }
  return event_log;
}