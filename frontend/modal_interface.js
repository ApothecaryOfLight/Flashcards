/*
==6.0== Modal Interface
*/
function modal_button( button_name ) {
  modal_buttons_storage[button_name]();
}

function launch_modal( isPrompt, inMessage, inButtons ) {
  const modal_handle = document.getElementById("modal_interface_screen_cover");
  modal_handle.style.display = "flex";

  const modal_message = document.getElementById( "modal_interface_message" );
  modal_message.innerHTML = inMessage;

  const modal_prompts = document.getElementById( "modal_interface_prompts" );
  let prompt_dom = "";
  if( isPrompt ) {
    for( prompt_name in isPrompt ) {
      prompt_dom += "<input type=\"text\" id=\"" + prompt_name + "\"" +
        " class=\"prompt_input_field\" autocomplete=\"off\"" +
        " placeholder=\"" + isPrompt[prompt_name] + "\"></input>";
    }
  }
  modal_prompts.innerHTML = prompt_dom;

  let dom = "";
  for( button_name in inButtons ) {
    modal_buttons_storage[button_name] = inButtons[button_name];
    dom += "<button class=\"modal_button\" " +
      "onclick=\"modal_button(\'" + button_name + "\')\">" +
      button_name + "</button>"
  }
  const modal_buttons = document.getElementById( "modal_interface_button_container" );
  modal_buttons.innerHTML = dom;
}

function close_modal() {
  const modal_handle = document.getElementById("modal_interface_screen_cover");
  modal_handle.style.display = "none";
}

function delete_card( inCardID, inSetID ) {
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
        launch_set_editor_interface( inSetID );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
  close_modal();
}

function delete_set( inSetID ) {
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
        launch_search_interface();
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
  close_modal();
}

function prompt_delete_card( inCardID, inSetID ) {
  const options = {
    "Delete Card": delete_card.bind( this, inCardID, inSetID ),
    "Cancel": close_modal
  }

  launch_modal( null, "Are you sure you want to delete this card?", options );
}

function prompt_delete_set( inSetID ) {
  const options = {
    "Delete Set": delete_set.bind( this, inSetID ),
    "Cancel": close_modal
  }

  launch_modal( null, "Are you sure you want to delete this set?", options );
}
