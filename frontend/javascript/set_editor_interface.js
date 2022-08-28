/*
Function to launch the set editor interface.
*/
function launch_set_editor_interface( interface_state, go_to_end ) {
  //Set the interface to the set editor.
  set_interface( "set_editor", interface_state );

  set_editor_interface_get_subjects( interface_state );

  //Get a reference to the set editor set name.
  const set_name_element = document.getElementById("set_editor_interface_set_name");

  //Get the cardlist from the server.
  const get_cardlist = new Request(
    ip + 'get_cardlist/' + interface_state.set_editor_interface_state.set_id
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, set the HTML set name element to the name of the set.
        set_name_element.innerHTML = json.set_name.name;
        
        //Populate the interface with the cards.
        set_editor_interface_populate_list( interface_state, json.cards, json.set_images );
        
        //Render the search topics.
        set_editor_interface_render_tags( json.topics, interface_state );

        //If already being edited, scroll to bottom of set.
        if( go_to_end ) {
          set_editor_interface_scroll_to_bottom();
        }
      } else if( json.result == "error" ) {
        //Upon error, notify user.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Function to scroll to bottom of set editor interface.

To be called when the user has already been editing the set. For example, upon adding
a new card and returning to this interface, the new card will be at the bottom of the
set, and so the interface should be scrolled to that newest card.
*/
function set_editor_interface_scroll_to_bottom() {
  const set_editor_scr = document.getElementById("set_editor_interface_card_list");
  set_editor_scr.scrollTo( 0, set_editor_scr.scrollHeight );
}


function proc_txt_question_set_editor_interface( inText, inImages, QuestionContainer, inCardID ) {
  const objectifiedText = JSON.parse( inText );

  //4) Iterate through every value in the object and append it to the question container.
  objectifiedText.forEach( (object) => {
    if( object.type == "text" ) {
      const div_container = document.createElement("div");
      div_container.innerHTML = object.content;
      QuestionContainer.appendChild( div_container );
    } else if( object.type == "image" ) {
      const image_container = document.createElement("img");
      image_container.src = inImages[inCardID][object.image_array_location];
      image_container.classList = "card_editor_interface_picture_question";
      QuestionContainer.appendChild( image_container );
    }
  });
}


/*
Populate the list of cards.

inSetID: Unique identifier of the card set.

inCards: List of the cards in the set.
*/
function set_editor_interface_populate_list( interface_state, inCards, inImages ) {
  //Get a reference to the card list container.
  const set_editor_interface_card_list = document.getElementById("set_editor_interface_card_list" );

  while( set_editor_interface_card_list.firstChild ) {
    set_editor_interface_card_list.firstChild.remove();
  }

  //Transform the JSON data into HTML elements for each card.
  inCards.forEach( card => {
    const card_row_container = document.createElement("div");
    card_row_container.classList = "card_row_container";

    const card_element_container = document.createElement("div");
    card_element_container.classList = "card_element";
    card_element_container.addEventListener( 'click', (click_event) => {
      interface_state.card_editor_interface_state.card_id = card.card_id;
      interface_state.card_editor_interface_state.set_id = interface_state.set_editor_interface_state.set_id;
      interface_state.card_editor_interface_state.isNew = false;
      interface_state.card_editor_interface_state.prev_interface = "set_editor";
      launch_card_editor_interface( interface_state );
    });

    const card_element_q = document.createElement("div");
    card_element_q.classList = "card_element_q";
    proc_txt_question_set_editor_interface( card.question, inImages, card_element_q, card.card_id );
    card_element_container.appendChild( card_element_q );

    const card_element_a = document.createElement("div");
    card_element_a.classList = "card_element_a";
    card_element_a.innerHTML = card.answer;
    card_element_container.appendChild( card_element_a );

    const delete_button = document.createElement("button");
    delete_button.classList = "card_element_delete_button";
    delete_button.onclick = prompt_delete_card.bind(
      null,
      card.card_id,
      card.set_id
    );
    delete_button.textContent = "X";

    card_row_container.appendChild(card_element_container);
    card_row_container.appendChild( delete_button );
    set_editor_interface_card_list.appendChild( card_row_container );
  });
}


/*
Function to create a new card.
*/
function set_editor_interface_new_button( interface_state ) {
  //Launch the card editor inteface to create a new card in the set.
  interface_state.card_editor_interface_state.set_id = interface_state.set_editor_interface_state.set_id;
  interface_state.card_editor_interface_state.prev_interface = "set_editor";
  interface_state.card_editor_interface_state.isNew = true;
  launch_card_editor_interface( interface_state );
}


/*
Function to return to the search interface.
*/
function set_editor_interface_go_back( interface_state ) {
  launch_search_interface( interface_state );
}


function set_editor_interface_add_tag( inTag, interface_state ) {
  const tags_container = document.getElementById("set_editor_interface_tags_list");

  const tag_container = document.createElement("div");
  tag_container.classList = "set_editor_interface_tag_container";
  tag_container.innerText = inTag;

  const tag_delete_button = document.createElement("div");
  tag_delete_button.classList = "set_editor_interface_tag_delete_button";
  tag_delete_button.onclick = delete_set_editor_tag.bind(
    null,
    inTag,
    interface_state.set_editor_interface_state.set_id
  );
  tag_delete_button.innerText = "X";

  tag_container.appendChild( tag_delete_button );
  tags_container.appendChild( tag_container );
}


/*
Function to add a search topic tag to this set.
*/
function set_editor_interface_add_tag_button( interface_state ) {
  //Get tag
  const tag_field = document.getElementById("set_editor_interface_tags_field");
  let tag_text = tag_field.value;
  tag_field.value = "";
  if( tag_text == "" ) { return; }

  //Ensure that tag doesn't already exist.
  let iterator = document.getElementById("set_editor_interface_tags_list").firstChild;
  while( iterator ) {
    if( iterator.firstChild.data == tag_text ) {
      return;
    }
    iterator = iterator.nextSibling;
  }

  //Add the tag to the interface
  set_editor_interface_add_tag( tag_text, interface_state );

  //Send updated tags to server.
  set_editor_interface_update_tags( interface_state );
}


function set_editor_interface_add_tag_on_enter_keypress( interface_state, keypress_event ) {
  if( keypress_event.key == "Enter" ) {
    set_editor_interface_add_tag_button( interface_state );
  }
}

/*
Function to update the search topic tags of a set.
*/
function set_editor_interface_update_tags( interface_state ) {
  //Iterate through each tag and preform regex on it to make it server compatible.
  const set_editor_tags = [];
  let iterator = document.getElementById("set_editor_interface_tags_list").firstChild;
  while( iterator ) {
    set_editor_tags.push( {type:"text",content:iterator.firstChild.data} );
    iterator = iterator.nextSibling;
  }

  //Compose the message to send to the server.
  const body_content = JSON.stringify({
    "set_id": interface_state.set_editor_interface_state.set_id,
    "tags": set_editor_tags
  });
  const update_set = new Request(
    ip + 'update_set',
    {
      method: 'POST',
      body: body_content,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  //Send the message to the server.
  fetch( update_set )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "error" ) {
        //Upon error, notify the user.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });

}


/*
Render the search topic tags of the set.

inSetID: Unique identifier of this set of cards.
*/
function set_editor_interface_render_tags( inTags, interface_state ) {
  const tags_container = document.getElementById("set_editor_interface_tags_list");
  while( tags_container.firstChild ) {
    tags_container.firstChild.remove();
  }
  for( index in inTags ) {
    set_editor_interface_add_tag( inTags[index].name, interface_state );
  }
}


/*
Function to delete a search topic tag for this set.

inTag: Tag to delete.

inSetID: Unique identifier of the set from which the tag should be deleted.
*/
function delete_set_editor_tag( inTag, interface_state ) {
  //Iterate through each tag.
  let iterator = document.getElementById("set_editor_interface_tags_list").firstChild;
  while( iterator ) {
    if( iterator.firstChild.data == inTag ) {
      iterator.remove();
      set_editor_interface_update_tags( interface_state );
      return;
    }
    iterator = iterator.nextSibling;
  }
}