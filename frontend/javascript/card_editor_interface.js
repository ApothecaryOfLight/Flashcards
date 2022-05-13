/*Card Editor Interface*/


/*
Launch the interface used for editing cards.

inCardID: The unique identifier of the card to edit.

inSetID: The unique identifier of the set to which the card belongs.

isNew: Boolean indicating whether the card has just been created or already exists.

inPrevInt: Previous interface displayed. Used to return to that interface after
exiting the card editor interface.
*/
function launch_card_editor_interface( inCardID, inSetID, isNew, inPrevInt ) {
  //1) Set the current interface and variables.
  set_interface(
    "card_editor",
    {
      set_id:inSetID,
      card_id:inCardID,
      previous_interface: inPrevInt
    }
  );

  //2) Empty the card tags and repopulate them.
  card_tags.splice(0);
  card_editor_interface_render_tags();

  //3) Check to see if the card already exists.
  if( isNew == false ) {
    //4a) If the card exsists, get the card data.
    get_card( inCardID );

    //5) Get the card update button.
    const set_card =
      document.getElementById("card_editor_interface_set_card");

    //6) Create a bound function with the card's identifying data.
    const func_ref =
      card_editor_interface_update_card.bind( this, inSetID, inCardID );

    //7) Remove the existing bound function, if it exists.
    if( bound_functions["card_editor"]["set_card"] ) {
      bound_functions["card_editor"]["set_card"].forEach( (func)=> {
        set_card.removeEventListener( 'click', func );
      });
    }
    bound_functions["card_editor"]["set_card"] = [];

    //8) Add the new bound function as a click event listener.
    set_card.addEventListener( 'click', func_ref );
    bound_functions["card_editor"]["set_card"].push( func_ref );
  } else {
    //3b) If the card doesn't exist, don't bother.
    const question_text = document.getElementById("card_editor_interface_q_text");
    const answer_text = document.getElementById("card_editor_interface_a_text");
    question_text.value = "";
    answer_text.value = "";
  }
}


/*
Process card text data sent from the server, using regex to replace HTML characters
with ASCII characters.
*/
function proc_txt_card_editor_interface( inText ) {
  //1) Replace unicode apostrophe with normal apostrophe.
  let outText = inText.replaceAll( "&#39", "\'" );
  return outText;
}


/*
This function is used to get the content of a card from the server.

inCardID: The unique identifier of the card to fetch from the server.
*/
function get_card( inCardID ) {
  //Create a request to get a card.
  const get_card = new Request(
    ip + 'get_card/' + inCardID
  );

  //Ask the server for the card.
  fetch( get_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Get references to the text fields for the question and the answer.
        const question_text = document.getElementById("card_editor_interface_q_text");
        const answer_text = document.getElementById("card_editor_interface_a_text");

        //Upon success, set the question and answer text values to the card data.
        question_text.value = proc_txt_card_editor_interface( json.card.question );
        answer_text.value = proc_txt_card_editor_interface( json.card.answer );

        for( index in json.tags ) {
          card_tags.push( json.tags[index].name );
        }
        card_editor_interface_render_tags();
      } else if( json.result == "error" ) {
        //Upon failure, notify the user of an error.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
This function is used to update an existing card from the card editor interface.

inSetID: Unique indetifier of the set to which the card belongs.

inCardID: Unique identifier of the card to update.
*/
function card_editor_interface_update_card( inSetID, inCardID ) {
  //Get refernces to the question and answer text fields of the card.
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");

  //Get the values of the question and answer text fields.
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;

  //Compose the message to send to the server.
  const body_content = JSON.stringify({
    "set_id": inSetID,
    "card_id": inCardID,
    "question": question_text,
    "answer": answer_text,
    "tags": card_tags
  });

  //Send the request to update the card to the server.
  const update_card = new Request(
    ip + 'update_card',
    {
      method: 'POST',
      body: body_content,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( update_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, blank the text values.
        card_q_handle.value = "";
        card_a_handle.value = "";

        //Return to the set editor interface.
        launch_set_editor_interface( inSetID );
      } else if( json.result == "error" ) {
        //Upon failure, notify the user of an error.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Function to be called upon creating a new card in the card editor interface.

inCardData: Object containing the unique identifiers of the card and set.
*/
function card_editor_interface_set_card( inCardData ) {
  //Get references to the question and answer text fields.
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");

  //Get the text value stored in the question and answer text fields.
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;

  //Compose the message to send to the sever.
  const body_content = JSON.stringify({
    "question": question_text,
    "answer": answer_text,
    "set_id": inCardData.set_id,
    "card_id": inCardData.card_id,
    "tags": card_tags
  });

  //Send the request to the server.
  const new_card = new Request(
    ip + 'add_card',
    {
      method: 'POST',
      body: body_content,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( new_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, blank the text fields and return to the set editor interface.
        card_q_handle.value = "";
        card_a_handle.value = "";
        launch_set_editor_interface( inCardData.set_id, true );
      } else if( json.result == "error" ) {
        //Upon failure, notify the user of an error.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Function to return to the previous interface.
*/
function card_editor_interface_go_back( inCardData ) {
  //Get references to the question and answer text fields.
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");

  //Blank the text value of the question and answer text fields.
  card_q_handle.value = "";
  card_a_handle.value = "";

  //Return to the interface the user was in before the card editor interface.
  if( inCardData.previous_interface == "set_editor" ) {
    launch_set_editor_interface( inCardData.set_id );
  } else if( inCardData.previous_interface == "search" ) {
    launch_search_interface();
  }
}


/*
Function to be used to add a subject tag to a card.

inCardData: Object containing the unique identifiers of the card and set.
*/
function card_editor_interface_add_tag_button( inCardData ) {
  //1) Get tag
  const tag_field = document.getElementById("card_editor_interface_tags_field");
  let tag_text = tag_field.value;
  if( tag_text == "" ) { return; }
  tag_text = tag_text.replace( /\s/g, "&nbsp;" );

  //2) Ensure that search term doesn't already exist.
  for( index in card_tags ) {
    if( card_tags[index] == tag_text ) {
      return;
    }
  }

  //3) Add search term to search_terms
  card_tags.push( tag_text );

  //4) Render updated search terms.
  card_editor_interface_render_tags();

  //5) Blank out search term.
  tag_field.value = "";
}


/*
Function to convert card topic tags into HTML elements.
*/
function card_editor_interface_render_tags() {
  let dom = "";
  //Iterate through each card tag.
  for( index in card_tags ) {
    //Create an element for this tag, concatenate it onto the dom string.
    dom += "<div class=\"card_editor_interface_tag_container\">" +
      card_tags[index] +
      "<div class=\"card_editor_interface_tag_delete_button\"" +
      " onclick=delete_card_tag(\'" + card_tags[index] + "\');" +
      ">X</div>" +
      "</div>";
  }

  //Get a reference to the tags container.
  const tag_container = document.getElementById("card_editor_interface_tags_list");

  //Assign the dom string to the container.
  tag_container.innerHTML = dom;
}


/*
Function to delete a card search tag.

inTag: The tag being deleted.
*/
function delete_card_tag( inTag ) {
  inTag = inTag.replace( /\s/g, "&nbsp;" );

  //Iterate through the card tags.
  for( index in card_tags ) {
    if( card_tags[index] == inTag ) {
      //Remove the tag from the array.
      card_tags.splice( index, 1 );
    }
  }

  //Render the array that has the targeted tag removed.
  card_editor_interface_render_tags();
}
