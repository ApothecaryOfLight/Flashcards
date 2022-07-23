/*
Function to launch the set editor interface.

inSetID: Unique identifier of the set to display.

go_to_end: Boolean indicating whether the editor should be scrolled to the top,
in the event of starting to edit the set, or to the bottom, in the event that the
set is already being edited and a new card has just been added, for example.
*/
function launch_set_editor_interface( inSetID, go_to_end ) {
  //Set the interface to the set editor.
  set_interface( "set_editor", inSetID );

  //Get a reference to the set editor set name.
  const set_name_element = document.getElementById("set_editor_interface_set_name");

  //Render the search topic tags of the set.
  set_editor_interface_render_tags( inSetID );

  //Get the cardlist from the server.
  const get_cardlist = new Request(
    ip + 'get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, set the HTML set name element to the name of the set.
        set_name_element.innerHTML = json.set_name.name;
        
        //Populate the interface with the cards.
        set_editor_interface_populate_list( inSetID, json.cards, json.set_images );
        
        //Render the search topics.
        set_editor_interface_render_tags( json.topics, inSetID );

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
function set_editor_interface_populate_list( inSetID, inCards, inImages ) {
  //Get a reference to the card list container.
  const set_editor_interface_card_list = document.getElementById("set_editor_interface_card_list" );

  while( set_editor_interface_card_list.firstChild ) {
    set_editor_interface_card_list.firstChild.remove();
  }

  //Transform the JSON data into HTML elements for each card.
  let dom = "";
  inCards.forEach( card => {
    const card_row_container = document.createElement("div");
    card_row_container.classList = "card_row_container";

    const card_element_container = document.createElement("div");
    card_element_container.classList = "card_element";
    card_element_container.onclick = launch_card_editor_interface.bind(
      null,
      card.card_id,
      inSetID,
      false,
      'set_editor'
    );

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
      inSetID
    );
    delete_button.textContent = "X";

    card_row_container.appendChild(card_element_container);
    card_row_container.appendChild( delete_button );
    set_editor_interface_card_list.appendChild( card_row_container );
  });
}


/*
Function to create a new card.

inSetID: Unique identifier of the card set.
*/
function set_editor_interface_new_button( inSetID ) {
  //Launch the card editor inteface to create a new card in the set.
  launch_card_editor_interface( null, inSetID, true, "set_editor" );
}


/*
Function to return to the search interface.
*/
function set_editor_interface_go_back() {
  launch_search_interface( false );
}

function set_editor_interface_add_tag( inTag, inSetID ) {
  const tags_container = document.getElementById("set_editor_interface_tags_list");

  const tag_container = document.createElement("div");
  tag_container.classList = "set_editor_interface_tag_container";
  tag_container.innerText = inTag;

  const tag_delete_button = document.createElement("div");
  tag_delete_button.classList = "set_editor_interface_tag_delete_button";
  tag_delete_button.onclick = delete_set_editor_tag.bind( null, inTag, inSetID );
  tag_delete_button.innerText = "X";

  tag_container.appendChild( tag_delete_button );
  tags_container.appendChild( tag_container );
}

/*
Function to add a search topic tag to this set.

inSetID: Unique identifier of this card set.
*/
function set_editor_interface_add_tag_button( inSetID ) {
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
  set_editor_interface_add_tag( tag_text, inSetID );

  //Send updated tags to server.
  set_editor_interface_update_tags( inSetID );
}


/*
Function to update the search topic tags of a set.

inSetID: Unique identifier of the set.
*/
function set_editor_interface_update_tags( inSetID ) {
  //Iterate through each tag and preform regex on it to make it server compatible.
  const set_editor_tags = [];
  let iterator = document.getElementById("set_editor_interface_tags_list").firstChild;
  while( iterator ) {
    set_editor_tags.push( iterator.firstChild.data );
    iterator = iterator.nextSibling;
  }

  //Compose the message to send to the server.
  const body_content = JSON.stringify({
    "set_id": inSetID,
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
function set_editor_interface_render_tags( inTags, inSetID ) {
  const tags_container = document.getElementById("set_editor_interface_tags_list");
  while( tags_container.firstChild ) {
    tags_container.firstChild.remove();
  }
  for( index in inTags ) {
    set_editor_interface_add_tag( inTags[index].name, inSetID );
  }
}


/*
Function to delete a search topic tag for this set.

inTag: Tag to delete.

inSetID: Unique identifier of the set from which the tag should be deleted.
*/
function delete_set_editor_tag( inTag, inSetID ) {
  //Iterate through each tag.
  let iterator = document.getElementById("set_editor_interface_tags_list").firstChild;
  while( iterator ) {
    if( iterator.firstChild.data == inTag ) {
      iterator.remove();
      set_editor_interface_update_tags( inSetID );
      return;
    }
    iterator = iterator.nextSibling;
  }
}