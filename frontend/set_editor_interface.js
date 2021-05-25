/*
Set Editor Interface
*/
function launch_set_editor_interface( inSetID, go_to_end ) {
  set_interface( "set_editor", inSetID );
  set_data.set_id = inSetID; //TODO: Attach this to interface
  const set_name_element = document.getElementById("set_editor_interface_set_name");
  set_editor_tags.splice(0);
  set_editor_interface_render_tags( inSetID );
//TODO: Populate set_editor_tags
  const get_cardlist = new Request(
    ip + 'get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        set_name_element.innerHTML = json.set_name.name;
        set_editor_interface_populate_list( inSetID, json.cards );
        for( index in json.topics ) {
          set_editor_tags.push( json.topics[index].name );
        }
        set_editor_interface_render_tags( inSetID );

        if( go_to_end ) {
          set_editor_interface_scroll_to_bottom();
        }
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function set_editor_interface_scroll_to_bottom() {
  const set_editor_scr = document.getElementById("set_editor_interface_card_list");
  set_editor_scr.scrollTo( 0, set_editor_scr.scrollHeight );
}

function set_editor_interface_populate_list( inSetID, inCards ) {
  const set_editor_interface_card_list = document.getElementById("set_editor_interface_card_list" );
  let dom = "";
  inCards.forEach( card => {
    dom +=
      "<div class=\"card_element\"> " +
      "<div class=\"card_element_q\" " +
      "onclick=\"launch_card_editor_interface(" +
      card.card_id + ", " +
      inSetID + ", " +
      "false ," +
      "\'set_editor\', " +
      ")\"" +
      ">" + card.question + "</div>" +
      "<div class=\"card_element_a\" " +
      "onclick=\"launch_card_editor_interface(" +
      card.card_id + ", " +
      inSetID + ", " +
      "false, " +
      "\'set_editor\', " +
      ")\"" +
      ">" + card.answer + "</div>" +
      "<button class=\"card_element_delete_button\" " +
      "onclick=\"prompt_delete_card(" +
      card.card_id + ", " +
      inSetID + ")\">X</button>" +
      "</div>";
  });
  set_editor_interface_card_list.innerHTML = dom;
}

function set_editor_interface_new_button( inSetID ) {
  launch_card_editor_interface( null, inSetID, true, "set_editor" );
}

function set_editor_interface_go_back() {
  launch_search_interface( false );
}

function set_editor_interface_add_tag_button( inSetID ) {
  //1) Get tag
  const tag_field =
    document.getElementById("set_editor_interface_tags_field");
  let tag_text = tag_field.value;
  if( tag_text == "" ) { return; }

  //2) Ensure that search term doesn't already exist.
  for( index in set_editor_tags ) {
    if( set_editor_tags[index] == tag_text ) {
      return;
    }
  }

  //3) Add search term to search_terms
  set_editor_tags.push( tag_text );

  //4) Render updated search terms.
  set_editor_interface_render_tags( inSetID );
  set_editor_interface_update_tags( inSetID );

  //5) Blank out search term.
  tag_field.value = "";
}

function set_editor_interface_update_tags( inSetID ) {
//TODO: Allow for set to be renamed
  for( index in set_editor_tags ) {
    set_editor_tags[index] =
      set_editor_tags[index].replace(
        /&nbsp;/g,
        " "
      );
  }

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
  fetch( update_set )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });

}

function set_editor_interface_render_tags( inSetID ) {
  let dom = "";

  for( index in set_editor_tags ) {
    set_editor_tags[index] =
      set_editor_tags[index].replace(
        /&nbsp;/g,
        " "
      );

    dom += "<div class=\"set_editor_interface_tag_container\">" +
      set_editor_tags[index] +
      "<div class=\"set_editor_interface_tag_delete_button\"" +
      " onclick=\"delete_set_editor_tag(\'" +
      set_editor_tags[index] + "\', " + inSetID + ");\"" +
      ">X</div>" +
      "</div>";
  }
  const tag_container = document.getElementById("set_editor_interface_tags_list");
  tag_container.innerHTML = dom;
}

function delete_set_editor_tag( inTag, inSetID ) {
  for( index in set_editor_tags ) {
    if( set_editor_tags[index] == inTag ) {
      set_editor_tags.splice( index, 1 );
    }
  }
  set_editor_interface_render_tags( inSetID );
  set_editor_interface_update_tags( inSetID );
}


