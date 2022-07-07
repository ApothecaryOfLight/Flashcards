"use strict"

/*
This is a recursive function that processes a JavaScript object into a block of text
to be displayed to the user.
data_object: The JavaScript object to be parsed into text.
depth: A Number value indicating the current depth of the Object traversal.
*/
function object_to_text( data_object, depth ) {
  //First, use a nullish coalescer operator to set depth to 0 if this it the start
  //of the recursive function.
  depth = depth ?? 0;

  if( Array.isArray(data_object) ) { //If the value is an Array, return the Array.
    return "[ " + data_object + " ] ";
  } else if( typeof( data_object ) == "object" ) { //If the value is an Object, then:
    //Begin the notation with an open curly bracket.
    let string = "{\n";

    //Iterate over every item in the Object.
    for( const key in data_object ) {
      //Add indentation based on the depth of this particular value.
      for( let i=0; i<=depth; i++ ) {
        string += "____";
      }

      //Call this function, handing it this Object and the current depth plus 1.
      //Upon the return of this function, concatenate that returned text onto
      //the output string.
      string += key + ": " + object_to_text( data_object[key], depth+1 ) + "\n";
    }

    //Add indentation based on the depth of this particular value.
    for( let i=0; i<depth; i++ ) {
      string += "____";
    }

    //Add a close curly bracket denoting the end of the object, and return the string.
    return string + "}";
  } else if( typeof( data_object ) == "string" ) { //If it's a string:
    //Simply return it, but with quotation marks to denote that it's a string.
    return "\"" + data_object + "\""
  } else { //Otherwise:
    //Just return the value. This will catch Numbers, for example.
    return data_object;
  }
}


/*
This function will create an expandable/collapsible table row.
*/
function compose_collapsible_object( data_object ) {
    //Create the table row.
    const collapsible_row = document.createElement("tr");
    //Assign this row a CSS class and default display status.
    collapsible_row.className = "log_details_row";
    collapsible_row.style["display"] = "none";

    //Create a table row.
    const collapsible_column = document.createElement("td");
    //Configure the row to cover most of the table, to display large objects correctly
    //without disrupting the size of existing columns.
    collapsible_column.colSpan = 4;

    //Create the div container of the object itself.
    const collapsible_container = document.createElement("div");
    //Assign the div a CSS class.
    collapsible_container.className = "log_details_container";
    //Assign the div the text String that is returned from parsing the Object.
    collapsible_container.innerText = object_to_text( data_object );

    //Append the div to the column.
    collapsible_column.appendChild( collapsible_container );
    //Append the column to the row.
    collapsible_row.appendChild( collapsible_column );

    //Return an object containing the created row, as well as a reference to the
    //div itself. The reference to the div will be used for expanding/collapsing
    //the element, while the collapsible_row will be used to insert the row into
    //the DOM.
    return {
      whole_object: collapsible_row,
      log_details_conatiner: collapsible_container
    };
}


/*
This function will create a button to expand an expandable/collapsible row.
details_error_container: The div that contains the text to be shown or hidden.
*/
function compose_show_details_button( details_error_container ) {
  //Create the button.

  const expand_details_button = document.createElement("button");
  //Assign the button a plus sign as its text content.
  expand_details_button.innerText = "+";

  //Add a click event listener.
  expand_details_button.addEventListener( 'click', (event) => {
    //Set the row to be displayed.
    details_error_container.parentElement.parentElement.style["display"] = "table-row";

    //Set the display height to the object's normal height, if it hadn't been hidden.
    //The CSS transition property will take care of the animation from there.
    details_error_container.style["max-height"] = details_error_container.scrollHeight + "px";

    //Replace this button with its opposite: a hide details button.
    event.srcElement.replaceWith( compose_hide_details_button(details_error_container) );
  });
  return expand_details_button;
}


/*
This function will be called upon the completion of the CSS transition's animation.
This will complete the process by hiding the element, and then removing the listeners.
*/
function end_transition( details_error_container ) {
  //Hide the element.
  details_error_container.parentElement.parentElement.style["display"] = "none";

  //Copy the node and replace it with the clone. This will effectively delete any listeners.
  const clone_node = details_error_container.cloneNode(true);
  details_error_container.replaceWith( clone_node );

  //Replace the hide details button with its inverse: a show details button.
  this.replaceWith( compose_show_details_button(clone_node) );
}


/*
This function returns a button to hide the expanable/collapsible element.
details_error_container: The element to be hidden.
*/
function compose_hide_details_button( details_error_container ) {
  //Create a button.
  const collapse_details_button = document.createElement("button");

  //Assign the button a minus sign, indicating that it closes the expandable element.
  collapse_details_button.innerText = "-";

  //Add a click event listener.
  collapse_details_button.addEventListener( 'click', (event) => {
    //Add a transitionend event listener to the element, and bind a function that will
    //end the transition, binding the button as the "this" context that end_transition
    //function will be given, and binding the element to be hidden as the function's
    //first parameter.
    details_error_container.addEventListener(
      "transitionend",
      end_transition.bind( collapse_details_button, details_error_container )
    );

    //Trigger the CSS transition property by setting the maximum height of the element
    //to be hidden to 0.
    details_error_container.style["max-height"] = 0;
  });
  return collapse_details_button;
}


/*
This is the meat of the compose error log functionality. It takes the error log as its
argument, and returns an element containing the entire error log formatted as an HTML
table, with expandable/collapsible hidden rows for the details Objects.
*/
function compose_error_log( error_log_obj ) {
  //Create a document fragment that will act as a DOM element within which we will
  //create our table.
  const error_log = document.createDocumentFragment();

  //Create the table element itself, assign it the appropriate CSS class, and append
  //it to the document fragment.
  const table = document.createElement("table");
  table.className = 'table_body';
  error_log.appendChild(table);

  //Create the table heading element and append it to the table.
  const table_title = document.createElement("thread");
  table.appendChild( table_title );

  //Create the table heading row and cell.
  const table_title_row = document.createElement("tr");
  const table_header = document.createElement("th");
  //Set the table heading text to error log.
  table_header.innerText = "Error Log";
  //Make the table heading span the whole table.
  table_header.colspan = 4;
  //Append the table heading cell to the table heading row.
  table_title_row.appendChild( table_header );
  //Append the table heading row to the table heading.
  table_title.appendChild( table_title_row );

  //Create the table body itself, and attach it to the table.
  const table_body = document.createElement("tbody");
  table.appendChild( table_body );

  //Iterate through every error in the error log.
  for( const error_key in error_log_obj ) {
    //Get a reference to this error.
    const error_obj = error_log_obj[error_key];

    //Create the row for this error.
    const error_container = document.createElement("tr");
    error_container.className = "table_row";

    //Create a cell for the timestamp, put the timestamp in it as text, and append it
    //to the row.
    const error_timestamp = document.createElement("td");
    error_timestamp.className = 'table_cell';
    error_timestamp.innerText = format_datetime( new Date(error_obj.timestamp) );
    error_container.appendChild( error_timestamp );

    //Create a cell for the error source, put the source in it as text, and append it
    //to the row.
    const error_source = document.createElement("td");
    error_source.className = 'table_cell';
    error_source.innerText = error_obj.source;
    error_container.appendChild( error_source );

    //Create a cell for the error IP, put the IP in it as text, and append it
    //to the row.
    const error_ip = document.createElement("td");
    error_ip.className = 'table_cell';
    error_ip.innerText = error_obj.ip;
    error_container.appendChild( error_ip );

    //Create a cell for the expand/collapse button, whether or not we'll need
    //one for this row.
    const error_details_button_row = document.createElement("td");

    //Check to see if there is a details object to use.
    if( typeof( error_obj.details ) != "undefined" ) {
      //Create the expandable/collapsible element itself.
      //This will return the element of the row, as well as a reference to the div that
      //will actually be expanded or collapsed.
      const collapsible_object = compose_collapsible_object( JSON.parse(reverse_process_text(error_obj.details)) );

      //Create an element to contain the expandable/collapsable row.
      const details_error_container = collapsible_object.whole_object;
      details_error_container.className = "";

      //Append the show (expand) button to the last cell in this row.
      error_details_button_row.appendChild(
        compose_show_details_button(collapsible_object.log_details_conatiner)
      );

      //Append the elements comprising the expandable/collapsible row to their
      //intended respective parents and ultiamtely the table body itself.
      error_container.appendChild( error_details_button_row );
      table_body.appendChild( error_container );
      table_body.appendChild( details_error_container );
    } else {
      //There is no details object to worry about. Append an empty cell to end the row.
      error_container.appendChild( error_details_button_row );
      table_body.appendChild( error_container );
    }
  }
  return error_log;
}