/*
Search interface
*/
function launch_search_interface( doSearch ) {
  set_interface( "search" );
  set_logged_elements();
  if( doSearch ) {
    search_interface_run_search();
  } else {
    window.scrollTo({top:scrollY,behavior:"auto"});
  }
}

function add_search_term() {
  //1) Get search term
  const search_bar = document.getElementById("search_interface_set_name");
  let search_bar_text = search_bar.value;
  if( search_bar_text == "" ) { return; }
  search_bar_text = search_bar_text.replace( /\s/g, "&nbsp;" );

  //2) Ensure that search term doesn't already exist.
  for( index in search_terms ) {
    if( search_terms[index] == search_bar_text ) {
      return;
    }
  }

  //3) Add search term to search_terms
  search_terms.push( search_bar_text );

  //4) Render updated search terms.
  render_search_terms();

  //5) Blank out search term.
  search_bar.value = "";

  //6) Send updated search term list
  search_interface_run_search();
}

function switch_list_type() {
  const button = document.getElementById("search_interface_switch_list_type");
  if( list_type == "card" ) {
    button.textContent = "List Cards";
    list_type = "set";
  } else if( list_type == "set" ) {
    button.textContent = "List Sets";
    list_type = "card";
  }
  search_interface_run_search();
}

function search_interface_run_search( inPage ) {
  //1) If there are no serach terms, use default search or set_editor
  if( search_terms.length == 0 ) {
    if( list_type == "set" ) {
      getSetList();
      return;
    } else if( list_type == "card" ) {
      getCardList();
      return;
    }
  }

  //2) Compose the message.
  const search_request_object = JSON.stringify({
    topics: search_terms,
    search_type: list_type,
    page_num: (inPage ?? 0)
  });

  //3) Send search
  const search_request = new Request(
    ip + 'searchlist',
    {
      method: 'POST',
      body: search_request_object,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  //4) On result, render the sets/cards
  fetch( search_request )
    .then( json => json.json() )
    .then( json => {
    if( json.result == "success" ) {
      if( json.search_type == "card" ) {
        render_search_cards({
          data:json.set_rows,
          "page_count": json.page_count,
          "search_type": json.search_type
        });
      } else if( json.search_type == "set" ) {
        render_search_sets({
          "set_rows": json.set_rows,
          "page_count": json.page_count,
          "search_type": json.search_type
        });
      }
    } else if( json.result == "error" ) {
      const options = {
        "Close" : close_modal
      }
      launch_modal( null, json.error_message, options );
    }
  });
}

function render_search_cards( inSearch_set_editor ) {
  render_search_cards_pagination(
    Math.ceil( inSearch_set_editor.page_count ),
    inSearch_set_editor.search_type
  );

  const cards = inSearch_set_editor.data;
  const search_dom_obj =
    document.getElementById("search_interface_set_list");
  let dom_string = "";
  draw_paper( cards.length );
  let dom = "";
  cards.forEach( card => {
    const creator_username =
      String.fromCharCode.apply( null, card.set_creator.data );
    dom += "<div class=\"search_item\">";
    if( creator_username == logged_obj.username_hash ) {
      if( logged_obj.isLogged == true ) {
        dom += "<div class=\"button search_item_edit_button\" " +
          "onclick=\"getCard(" +
          card.card_id + ", " + card.set_id +
          ")\">Edit</div>";
      }
    }
    dom += "<div class=\"search_item_text_container\">";
    dom += "<span class=\"search_item_text\">";
    dom += "Q) " + card.question;
    dom += "A) " + card.answer;
    dom += "</span></div>";
    dom += "</div>";
  });
  search_dom_obj.innerHTML = dom;
}

function render_search_cards_pagination( inPages, search_type ) {
  const container =
    document.getElementById("search_interface_pagination_container" );
  let dom = "";
  for( counter=0; counter<Number(inPages); counter++ ) {
    dom += "<div class=\'setlist_interface_page_button " +
      "better_buttons\' ";
    if( search_type ) {
      dom += "onclick=\'search_interface_run_search(" +
        counter + "); ";
    } else {
      dom += "onclick=\'getCardList(" + counter + "); ";
    }
    dom += "window.scrollTo({top:0,behavior:\"smooth\"});\' " +
      ">" +
      counter +
      "</div>";
  }
  container.innerHTML = dom;
}

function getCard( inCardID, inSetID ) {
  launch_card_editor_interface( inCardID, inSetID, false, "search" );
}

function delete_search_term( inTerm ) {
  inTerm = inTerm.replace( /\s/g, "&nbsp;" );
  for( index in search_terms ) {
    if( search_terms[index] == inTerm ) {
      search_terms.splice( index, 1 );
    }
  }
  render_search_terms();
  search_interface_run_search();
}

function render_search_terms() {
  let dom = "";
  for( index in search_terms ) {
    dom += "<div class=\"search_tag_unit\">" +
      search_terms[index] +
      "<div class=\"search_tag_delete\"" +
      " onclick=delete_search_term(\'" + search_terms[index] + "\');" +
      ">X</div>" +
      "</div>";
  }
  const search_term_container = document.getElementById("search_tag_container");
  search_term_container.innerHTML = dom;
}

//TODO: Apply search criteria to creation of temp set.
function create_temp_set_button() {
  let user = "unlogged";
  if( logged_obj.isLogged == true ) {
    user = logged_obj.username_hash;
  }
  const get_temp_set = new Request(
    ip + 'temporary_set',
    {
      method: 'POST',
      body: JSON.stringify({
        "username_hash": user,
        "topics": search_terms
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( get_temp_set )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
console.dir( json.cards );
        runset( json.cards );
      } else if( json.result == "error" ) {
        launch_modal( null, json.error_message, { "Close": close_modal } );
      }
    });
}

function draw_paper( inLength ) {
  const blue_lines_container = document.getElementById("blue_line_container");
  let dom = "";
  for( i=0; i<inLength*3; i++ ) {
    dom += "<div class=\"blue_line\"></div>";
  }
  blue_lines_container.innerHTML = "";
  blue_lines_container.innerHTML = dom;
}

function set_logged_elements() {
  const create_set_button =
    document.getElementById("search_interface_set_name_create");
  if( logged_obj.isLogged == false ) {
    create_set_button.style.display = "none";
  } else if( logged_obj.isLogged == true ) {
    create_set_button.style.display = "inline-block";
  }
}

function getSetList( inPage ) {
  const getSetListObj = new Request(
    ip + 'setlist/' + (inPage ?? 0),
    { method: 'GET' }
  );
  fetch( getSetListObj )
    .then( obj => obj.json())
    .then( obj => {
      render_search_sets( obj );
    });
}

function getCardList( inPage ) {
  const getCardListObj = new Request(
    ip + 'cardlist/' + (inPage ?? 0),
    { method: 'GET' }
  );
  fetch( getCardListObj )
    .then( obj => obj.json())
    .then( obj => {
      render_search_cards( obj );
    });
}

function render_search_sets( inSetListObj ) {
  render_search_sets_pagination(
    Math.ceil( inSetListObj.page_count ),
    inSetListObj.search_type
  );
  const setList = inSetListObj.set_rows;
  const search_dom_obj = document.getElementById("search_interface_set_list");
  let dom_string = "";
  draw_paper( setList.length );
  setList.forEach( set => {
    const set_username_hash = String.fromCharCode.apply(null, set.set_creator.data );
    dom_string += "<div class=\'search_item\'>";
    if( set_username_hash == logged_obj.username_hash ) {
      if( logged_obj.isLogged == true ) {
        dom_string += "<div class=\"button search_item_edit_button\" " +
          "onclick=\"getSet(" + set.set_id + ")\">Edit</div>";
      }
    }
    dom_string += "<div class=\"button search_item_text_container\"" +
      "onclick=\"playSet(" + set.set_id + ")\">" +
      "<span class=\"search_item_text\">" +
      set.name + "</span>" + "</div>";
    //}
    if( set_username_hash == logged_obj.username_hash ) {
      if( logged_obj.isLogged == true ) {
        dom_string += "<div class=\"button search_item_delete_button\" " +
          "onclick=\"prompt_delete_set(" + set.set_id + ")\">Delete</div>";
      }
    }
    dom_string +=  "</div>";
  });
  search_dom_obj.innerHTML = dom_string;
}

function render_search_sets_pagination( inPages, search_type ) {
  const container =
    document.getElementById("search_interface_pagination_container" );
  let dom = "";
  for( counter=0; counter<Number(inPages); counter++ ) {
    dom += "<div class=\'setlist_interface_page_button " +
      "better_buttons\' ";
    if( search_type ) {
      dom += "onclick=\'search_interface_run_search(" +
        counter + "); ";
    } else {
      dom += "onclick=\'getSetList(" + counter + "); ";
    }
    dom += "window.scrollTo({top:0,behavior:\"smooth\"});\' " +
      ">" +
      counter +
      "</div>";
  }
  container.innerHTML = dom;
}

function playSet( inSetID ) {
  scrollY = window.scrollY;
  launch_runset_interface( inSetID );
}

function getSet( inSetID ) {
  scrollY = window.scrollY;
  launch_set_editor_interface( inSetID );
}

function search_interface_set_create() {
  const setname_input = document.getElementById( 'search_interface_set_name' );
  const new_set_name = setname_input.value;
  if( new_set_name != "" ) {
    create_set( new_set_name );
  }
}

function create_set( set_name ) {
  const new_set = new Request(
    ip + 'new_set',
    {
      method: 'POST',
      body: JSON.stringify({
        "set_name":set_name,
        "username_hash": logged_obj.username_hash
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( new_set )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        launch_set_editor_interface( json.set_id );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}
