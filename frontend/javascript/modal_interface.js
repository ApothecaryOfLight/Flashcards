/*
Function to connect a modal button press to the appropriate function.
*/
function modal_button( button_name ) {
  modal_buttons_storage[button_name]();
  close_modal();
}


/*
Function to launch a modal popup.
*/
function launch_modal( isPrompt, inMessage, inButtons ) {
  //Get a reference to the modal.
  const modal_handle = document.getElementById("modal_interface_screen_cover");

  //Display the modal.
  modal_handle.style.display = "flex";

  //Get a reference to the modal message element and set its text value.
  const modal_message = document.getElementById( "modal_interface_message" );
  modal_message.innerHTML = inMessage;

  //If this modal has prompts, then:
  if( isPrompt ) {
    //Get a reference to the modal interface prompts.
    const modal_prompts = document.getElementById( "modal_interface_prompts" );

    //Compose a string to dispaly the prompts.
    let prompt_dom = "";
    for( prompt_name in isPrompt ) {
      prompt_dom += "<input type=\"text\" id=\"" + prompt_name + "\"" +
        " class=\"prompt_input_field\" autocomplete=\"off\"" +
        " placeholder=\"" + isPrompt[prompt_name] + "\"></input>";
    }

    //Assign the prompts to the DOM.
    modal_prompts.innerHTML = prompt_dom;
  }

  //Compose the buttons for the modal.
  let dom = "";
  for( button_name in inButtons ) {
    modal_buttons_storage[button_name] = inButtons[button_name];
    dom += "<button class=\"modal_button\" " +
      "onclick=\"modal_button(\'" + button_name + "\')\">" +
      button_name + "</button>"
  }

  //Get a reference to the button container in the modal.
  const modal_buttons = document.getElementById( "modal_interface_button_container" );

  //Set the contents of the button container in the modal to the desired buttons.
  modal_buttons.innerHTML = dom;
}


/*
Function to close the modal.
*/
function close_modal() {
  //Get a reference to the modal.
  const modal_handle = document.getElementById("modal_interface_screen_cover");

  //Hide the modal.
  modal_handle.style.display = "none";

  
  const modal_prompts = document.getElementById( "modal_interface_prompts" );
  while( modal_prompts.firstChild ) {
    modal_prompts.firstChild.remove();
  }

  const modal_buttons = document.getElementById( "modal_interface_button_container" );
  while( modal_buttons.firstChild ) {
    modal_buttons.firstChild.remove();
  }
}


/*
Function to delete a card.

inCardID: Unique identifier of the card to delete.

inSetID: Unique indentifier of the card's set.

NB: This function is in this file because it is only called through a modal.
*/
function delete_card( inCardID, inSetID ) {
  //Compose the message to the server of the card to delete.
  const delete_card = new Request(
    ip + 'delete_card/' + inCardID,
    {
      method: 'POST'
    }
  );
  fetch( delete_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, go to the set editor, displaying this set.
        launch_set_editor_interface( inSetID );
      } else if( json.result == "error" ) {
        //Upon failure, display error to user.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
  //Close the modal.
  close_modal();
}


/*
Function to delete a set.

inSetID: Unique identifier of the set to delete.

NB: This function is in this file because it is only called through a modal.
*/
function delete_set( inSetID ) {
  //Compose the message to the server requesting a set deletion.
  const delete_set_req = new Request(
    ip + 'delete_set/' + inSetID,
    {
      method: 'POST'
    }
  );
  fetch( delete_set_req )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, return to the search interface.
        launch_search_interface( true );
      } else if( json.result == "error" ) {
        //Upon failure, display an error to the user.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
  close_modal();
}


/*
Function to launch a modal prompting the user to confirm that they want to delete
a card.
*/
function prompt_delete_card( inCardID, inSetID ) {
  const options = {
    "Delete Card": delete_card.bind( this, inCardID, inSetID ),
    "Cancel": close_modal
  }

  launch_modal( null, "Are you sure you want to delete this card?", options );
}

/*
Function to launch a modal prompting the user to confirm that they want to delete
a set.
*/
function prompt_delete_set( inSetID ) {
  const options = {
    "Delete Set": delete_set.bind( this, inSetID ),
    "Cancel": close_modal
  }

  launch_modal( null, "Are you sure you want to delete this set?", options );
}
