/*Card Editor Interface*/

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

//TODO: Handle this through the interface management code.
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
  }
}

function proc_txt_card_editor_interface( inText ) {
  //1) Replace unicode apostrophe with normal apostrophe.
  let outText = inText.replaceAll( "&#39", "\'" );
  return outText;
}

function get_card( inCardID ) {
  const get_card = new Request(
    ip + 'get_card/' + inCardID
  );
  const question_text = document.getElementById("card_editor_interface_q_text");
  const answer_text = document.getElementById("card_editor_interface_a_text");
  fetch( get_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        question_text.value = proc_txt_card_editor_interface( json.card.question );
        answer_text.value = proc_txt_card_editor_interface( json.card.answer );

        for( index in json.tags ) {
          card_tags.push( json.tags[index].name );
        }
        card_editor_interface_render_tags();
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function card_editor_interface_update_card( inSetID, inCardID ) {
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;

  const body_content = JSON.stringify({
    "set_id": inSetID,
    "card_id": inCardID,
    "question": question_text,
    "answer": answer_text,
    "tags": card_tags
  });

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
        card_q_handle.value = "";
        card_a_handle.value = "";
        launch_set_editor_interface( inSetID );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function card_editor_interface_set_card( inCardData ) {
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;
  const body_content = JSON.stringify({
    "question": question_text,
    "answer": answer_text,
    "set_id": inCardData.set_id,
    "card_id": inCardData.card_id,
    "tags": card_tags
  });
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
        card_q_handle.value = "";
        card_a_handle.value = "";
        launch_set_editor_interface( inCardData.set_id, true );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function card_editor_interface_go_back( inCardData ) {
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");
  card_q_handle.value = "";
  card_a_handle.value = "";
  if( inCardData.previous_interface == "set_editor" ) {
    launch_set_editor_interface( inCardData.set_id );
  } else if( inCardData.previous_interface == "search" ) {
    launch_search_interface();
  }
}

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

function card_editor_interface_update_tags( inCardData ) {
  const message = JSON.stringify({
    "event": "update_tags",
    "set_id": inCardData.set_id,
    "card_id": inCardData.card_id,
    "data": card_tags
  });
}

function card_editor_interface_render_tags() {
  let dom = "";
  for( index in card_tags ) {
    dom += "<div class=\"card_editor_interface_tag_container\">" +
      card_tags[index] +
      "<div class=\"card_editor_interface_tag_delete_button\"" +
      " onclick=delete_card_tag(\'" + card_tags[index] + "\');" +
      ">X</div>" +
      "</div>";
  }
  const tag_container = document.getElementById("card_editor_interface_tags_list");
  tag_container.innerHTML = dom;
}

function delete_card_tag( inTag ) {
  inTag = inTag.replace( /\s/g, "&nbsp;" );
  for( index in card_tags ) {
    if( card_tags[index] == inTag ) {
      card_tags.splice( index, 1 );
    }
  }
  card_editor_interface_render_tags();
}
