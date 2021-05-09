/*
INDEX
==1.0== Globals
==2.0== Runset Interface
==3.0== Card Editor Interface
==4.0== Set Editor Interface
==5.0== Search Interface
==6.0== Modal Interface
==7.0== Login/Logout Code
==8.0== Interface Switching Code
*/

/*
==1.0== Globals
*/
//TODO: Get rid of all globals.
const card_tags = [];
const set_data = {};
const set_editor_tags = [];
let list_type = "set";
const search_terms = [];
let modal_buttons_storage = {};
let curr_interface = "";
let isLogged = false;
const logged_obj = {
  isLogged: false,
  username_hash: ""
}
const split_buttons = [];
const merge_buttons = [];
const go_to_set_buttons = [];

window.addEventListener( 'load', (loaded_event) => {
  launch_search_interface();
  attach_login();
});



/*
==2.0== Runset Interface
*/
function launch_runset_interface( inSetID ) {
  const get_cardlist = new Request(
    ip + 'get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        runset( json.cards );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function runset( inSetData ) {
  let card_sets_obj = {
    curr_set : 0,
    sets : []
  };
  card_sets_obj.sets[ card_sets_obj.curr_set ] = {
    cards: inSetData,
    curr_card: 0,
    side: 0,
    prev_cards: []
  }
  prepare_cards( card_sets_obj.sets[ card_sets_obj.curr_set ].cards );
  next_card( card_sets_obj );
  runset_render_qa( card_sets_obj );
  runset_render_split_sets( card_sets_obj );
  set_interface( "runset", card_sets_obj );
}

function prepare_cards( cards ) {
  for( index in cards ) {
    cards[index].correct = 0;
  }
}

function remove_empty_subset( card_sets_obj, target ) {
  //1) If not sets remain, terminate the recursive chain.

  //2) Remove the empty subset.
  card_sets_obj.sets.splice(
    Number(target),
    1
  );

  //3) Reset the current set to 0.
  card_sets_obj.curr_set = Math.max( Number(target)-1, 0 );

  runset_render_split_sets( card_sets_obj );
}

function next_card( card_sets_obj ) {
  //1) If current subset is empty, switch to another subset.
  if( card_sets_obj.sets[ card_sets_obj.curr_set ].cards.length == 0 ) {
    remove_empty_subset(
      card_sets_obj,
      card_sets_obj.curr_set
    );
  }

  //2) If there are no more subsets, return to search interface.
  if( card_sets_obj.sets.length == 0 ) {
    launch_search_interface();
    return;
  }

  //3) Create a reference to the current subset.
  const current_card_set = card_sets_obj.sets[ card_sets_obj.curr_set ];

//TODO: Switch previous cards over to IDs instead of index place.

  //4) Push the last card into the record of previous cards.
  current_card_set.prev_cards.push( current_card_set.curr_card );

  //5) Keep the record of past cards half as large as the set of cards.
  while( current_card_set.prev_cards.length > current_card_set.cards.length/2 ) {
    current_card_set.prev_cards.shift();
  }

  //5) Randomly generate the index of the next card.
  const num_cards = current_card_set.cards.length;
  let next_card_number = Math.floor( Math.random() * num_cards );

  //6) Guarantee that the next card hasn't appeared recently.
  if( current_card_set.cards.length > 1 ) {
    while( current_card_set.prev_cards.includes(next_card_number) ) {
      next_card_number = Math.floor( Math.random() * num_cards );
    }
  }

  //7) Set the next card, flip the card to the question side, render it.
  current_card_set.curr_card = next_card_number;
  current_card_set.side = 0;
  runset_render_qa( card_sets_obj );
}
function runset_interface_go_back( cards_obj ) {
  launch_search_interface();
}
function get_datestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  let month = now.getUTCMonth() + 1;
  if( month < 10 ) {
    month = "0" + month;
  }
  let day = now.getUTCDate();
  if( day < 10 ) {
    day = "0" + day;
  }

  const now_string =
    year + "-" +
    month + "-" +
    day;

  return now_string;
}
function send_card_result( user_hash, card_id, result ) {
  const result_object = {
    userhash: user_hash,
    card_id: card_id,
    result: result,
    date_stamp: get_datestamp()
  }
  const result_request = new Request(
    ip + 'card_result',
    {
      method: 'POST',
      body: JSON.stringify(result_object),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( result_request )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
      } else if( json.result == "error" ) {
        launch_modal( null, "Weird error.", { "Close": close_modal } );
      }
    });
}
function runset_interface_missed( card_sets_obj ) {
  const curr_subset_ref = card_sets_obj.sets[ card_sets_obj.curr_set ];
  curr_subset_ref.cards[ curr_subset_ref.curr_card ].correct--;
  if( logged_obj.isLogged == true ) {
    send_card_result(
      logged_obj.username_hash,
      curr_subset_ref.cards[ curr_subset_ref.curr_card ].card_id,
      -1
    );
  }
  next_card( card_sets_obj );
}
function runset_interface_correct( card_sets_obj ) {
  const curr_subset_ref = card_sets_obj.sets[ card_sets_obj.curr_set ];
  curr_subset_ref.cards[curr_subset_ref.curr_card].correct++;
  if( logged_obj.isLogged == true ) {
    send_card_result(
      logged_obj.username_hash,
      curr_subset_ref.cards[curr_subset_ref.curr_card].card_id,
      1
   );
  }
  if( curr_subset_ref.cards[curr_subset_ref.curr_card].correct >= 5 ) {
    curr_subset_ref.cards.splice( curr_subset_ref.curr_card, 1 );
    runset_render_split_sets( card_sets_obj );
  }
  next_card( card_sets_obj );
}
function runset_interface_flip_card( card_sets_obj ) {
  const curr_subset_ref = card_sets_obj.sets[ card_sets_obj.curr_set ];
  if( curr_subset_ref.side == 0 ) {
    curr_subset_ref.side = 1;
  } else {
    curr_subset_ref.side = 0;
  }
  runset_render_qa( card_sets_obj );
}
function runset_interface_split_set( card_sets_obj, index ) {
  //1) Get currently selected setset.
  const sel_set = card_sets_obj.sets[ Number(index) ];
  sel_set.prev_cards = [];

  //2) Insert new subset after current subset.
  card_sets_obj.sets.splice(
    Number(index)+1,
    0,
    {
      curr_card: 0,
      side: 0,
      prev_cards: [],
      cards: []
    }
  );

  //3) Put half of the cards in the current set into the next.
  const next_set = card_sets_obj.sets[ Number(index)+1 ];
  const half_number_of_cards = sel_set.cards.length/2;
  for( i=0; i<half_number_of_cards; i++ ) {
    //3a) Randomly select card to shift between sets.
    const remaining_cards = sel_set.cards.length;
    const remove_card_pos = Math.floor( Math.random() * remaining_cards );

    //3b) Copy that card into the new set.
    next_set.cards[ next_set.cards.length ] = JSON.parse(
      JSON.stringify(
        sel_set.cards[ remove_card_pos ]
      )
    );

    //3c) Remove the card from the original set.
    sel_set.cards.splice( remove_card_pos, 1 );
  }

  //4) Render split sets.
  runset_render_split_sets( card_sets_obj );

  //5) Go to the next card.
  next_card( card_sets_obj );
}
function runset_interface_merge_set( card_sets_obj, index ) {
  //1) Get references to the sets to merge.
  const first_set = card_sets_obj.sets[ Number(index) ];
  const second_set = card_sets_obj.sets[ Number(index)+1 ];
  const second_set_size = second_set.cards.length;

  //2) Deep copy the cards from the second set to the first.
  for( i=0; i<second_set_size; i++ ) {
    first_set.cards[ first_set.cards.length ] = JSON.parse(
      JSON.stringify(
        second_set.cards[i]
      )
    );
  }

  //3) Delete the second set.
  remove_empty_subset(
    card_sets_obj,
    Number(index)+1
  );
}
function go_to_set( card_sets_obj, index ) {
  card_sets_obj.curr_set = index;
  next_card( card_sets_obj );
}

function proc_txt_runset( inText ) {
  let outText = inText.replaceAll( "\n", "<br>" );
  return outText;
}

function runset_render_index_card() {
  const blue_lines_container = document.getElementById("index_card_blue_line_container");
  let dom = "";
  for( i=0; i<36; i++ ) {
    dom += "<div class=\"index_card_blue_line\"></div>";
  }
  blue_lines_container.innerHTML = "";
  blue_lines_container.innerHTML = dom;
}

function runset_render_qa( card_sets_obj ) {
  //1) Draw the lined index card.
  runset_render_index_card();

  //2) Get a reference to the current set.
  const curr_set = card_sets_obj.sets[ card_sets_obj.curr_set ];

  //3) Get the text field DOM element.
  const qa_field = document.getElementById("runset_interface_qa_text");

  //4) If the set is empty, don't attempt to render a card.
  if( !curr_set.cards[ curr_set.curr_card ] ) {
    qa_field.innerHTML = "";
    return;
  }

  //5) Render either the question or the answer.
  if( curr_set.side == 0 ) {
    const dom = "<span onclick=\"switchSide( 0 )\">" +
      proc_txt_runset( curr_set.cards[ curr_set.curr_card ].question ) +
      "</span>";
    qa_field.innerHTML = dom;
  } else if( curr_set.side == 1 ) {
    const dom = "<span onclick=\"switchSide( 0 )\">" +
      proc_txt_runset( curr_set.cards[ curr_set.curr_card ].answer ) +
      "</span>";
    qa_field.innerHTML = dom;
  }
}

function runset_render_split_sets( card_sets_obj ) {
  //1) Get DOM element reference to split set button container.
  const split_buttons_container =
    document.getElementById("runset_interface_split_set_buttons");

  //2) Compose HTMl.
  let html_string = "";
  for( index in card_sets_obj.sets ) {
    const bound_split_func = runset_interface_split_set.bind(
      null,
      card_sets_obj,
      index
    );
    split_buttons[index] = bound_split_func;

    const bound_go_to_set_func = go_to_set.bind(
      null,
      card_sets_obj,
      index
    );
    go_to_set_buttons[index] = bound_go_to_set_func;

    html_string +=
      "<div class=\'runset_interface_split_set_button_group\'> " +
      "<div " +
      "onclick=\"split_buttons[" + index + "]()\" " +
      ">" +
      "<span class=\"button material-icons md-32\">swap_horiz</span>" +
      card_sets_obj.sets[index].cards.length +
      "</div>" +
      "<div " +
      "onclick=\"go_to_set_buttons[" + index + "]()\">Use" +
      "</div></div>";
    if( index < card_sets_obj.sets.length-1 ) {
      const bound_merge_func = runset_interface_merge_set.bind(
        null,
        card_sets_obj,
        index
      );
      merge_buttons[index] = bound_merge_func;
      html_string +=
        "<div " +
        "onclick=\"merge_buttons[" + index + "]()\" " +
        ">" +
        "<span class=\"button material-icons md-32\">swap_vert</span></div>";
    }
  }
  split_buttons_container.innerHTML = html_string;
}



/*
==3.0== Card editor interface
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




/*
==4.0== Set Editor Interface
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
  launch_search_interface();
}
function set_editor_interface_add_tag_button( inSetID ) {
  //1) Get tag
  const tag_field = document.getElementById("set_editor_interface_tags_field");
  let tag_text = tag_field.value;
  if( tag_text == "" ) { return; }
  tag_text = tag_text.replace( /\s/g, "&nbsp;" );

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
  inTag = inTag.replace( /\s/g, "&nbsp;" );
  for( index in set_editor_tags ) {
    if( set_editor_tags[index] == inTag ) {
      set_editor_tags.splice( index, 1 );
    }
  }
  set_editor_interface_render_tags( inSetID );
  set_editor_interface_update_tags( inSetID );
}



/*
==5.0== Search interface
*/
function launch_search_interface() {
  set_interface( "search" );
  set_logged_elements();
  search_interface_run_search();
  
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

function search_interface_run_search() {
  //1) If there are no serach terms, use default search or set_editor
//TODO: Write default set_editor
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
    search_type: list_type
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
        render_set_editor( json );
      } else if( json.search_type == "set" ) {
        renderSetList( json.data );
      }
    } else if( json.result == "error" ) {
      const options = {
        "Close" : close_modal
      }
      launch_modal( null, json.error_message, options );
    }
  });
}

function render_set_editor( inSearch_set_editor ) {
  const cards = inSearch_set_editor.data;
  const search_dom_obj = document.getElementById("search_interface_set_list");
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
        "username_hash": user
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
      renderSetList( obj );
    });
}

function getCardList() {
  const getCardListObj = new Request(
    ip + 'cardlist',
    { method: 'GET' }
  );
  fetch( getCardListObj )
    .then( obj => obj.json())
    .then( obj => {
      render_set_editor( obj );
    });
}

function renderSetList( inSetListObj ) {
  renderSetListPagination( Math.ceil( inSetListObj.page_count ) );
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

function search_interface_page_selection( pageNum ) {
  getSetList( pageNum );
}

function renderSetListPagination( inPages ) {
  const container =
    document.getElementById("search_interface_pagination_container" );
  let dom = "";

  for( counter=0; counter<Number(inPages); counter++ ) {
    dom += "<div class=\'setlist_interface_page_button\' " +
      "onclick=\'getSetList(" + counter + ")'\'" +
      ">" +
      counter +
      "</div>";
  }
  container.innerHTML = dom;
}

function playSet( inSetID ) {
  launch_runset_interface( inSetID );
}

function getSet( inSetID ) {
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



/*
==7.0== Logging in/out code
*/
function login( inUsernameHash ) {
  logged_obj.isLogged = true;
  logged_obj.username_hash = inUsernameHash;

  close_modal();
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  login_element.style.display = "none";
  logout_element.style.display = "flex";
  //)Relaunch interface.
  if( curr_interface == "search" ) {
    launch_search_interface();
  }
}
function attempt_create_account() {
  //1) Get username and password
  const username_field = document.getElementById("username_field");
  const password_field = document.getElementById("password_field");
  const inUsername = md5(username_field.value);
  const inPassword = md5(password_field.value);

  //2) Send login data to server.
  const attempt_create_account_req = new Request(
    ip + 'create_account',
    {
      method: 'POST',
      body: JSON.stringify({
        "username": inUsername,
        "password": inPassword
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( attempt_create_account_req )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "approve" ) {
        //2) If approved, login.
        login( json.username_hash );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      } else {
        //3) If refused, prompt failure message, fallback into login prompt.
        prompt_failed_login( json.issue );
      }
    });

  //)Relaunch interface
}
function logout() {
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  logout_element.style.display = "none";
  login_element.style.display = "flex";
  //)Relaunch interface.
  logged_obj.isLogged = false;
  if( curr_interface == "search" ) {
    launch_search_interface();
  }
}
function attempt_login() {
  //1) Get username and password
  const username_field = document.getElementById("username_field");
  const password_field = document.getElementById("password_field");
  const inUsername = md5(username_field.value);
  const inPassword = md5(password_field.value);

  //2) Send login data to server.
  const attempt_login = new Request(
    ip + 'login',
    {
      method: 'POST',
      body: JSON.stringify({
        "username": inUsername,
        "password": inPassword
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( attempt_login )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "approve" ) {
        //3) If approved, login.
        login( json.username_hash );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      } else {
        prompt_failed_login( json.reason );
      }
    });

  //3) If refused, prompt failure message, fallback into login prompt.
}
function prompt_failed_login( inFailureReason ) {
  const options = {
    "Okay" : prompt_login
  };
  launch_modal( null, inFailureReason, options );
}
function prompt_login() {
  //1) Launch login prompt.
  const prompts = {
    "username_field" : "Enter Username Here",
    "password_field" : "Enter Password Here"
  };
  const options = {
    "Cancel": close_modal,
    "Login" : attempt_login,
    "Create Account" : attempt_create_account
  }
  launch_modal( prompts, "Log In", options );
}
function attach_login() {
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  //const logged_name = document.getElementById("logged_in_name");
  logout_element.style.display = "none";
  login_element.addEventListener( 'click', (click_event) => {
    prompt_login();
  });
  logout_element.addEventListener( 'click', (click_evnet) => {
    logout();
  });
}



/*
==8.0== Interface switching code.
*/
const interfaces = [
  "search", "set_editor", "card_editor", "runset"
];

const functions = {
  "search" : {
    "set_name_create": search_interface_set_create,
    "add_search_tag_button": add_search_term,
    "switch_list_type": switch_list_type, 
    "create_temp_set_button": create_temp_set_button
  },
  "set_editor" : {
    "new": set_editor_interface_new_button,
    "go_back": set_editor_interface_go_back,
    "add_tag_button": set_editor_interface_add_tag_button
  },
  "card_editor": {
    "set_card": card_editor_interface_set_card,
    "go_back": card_editor_interface_go_back,
    "add_tag_button": card_editor_interface_add_tag_button
  },
  "runset": {
    "go_back": runset_interface_go_back,
    "missed": runset_interface_missed,
    "correct": runset_interface_correct,
    "flip_card": runset_interface_flip_card/*,
    "split_set": runset_interface_split_set*/
  }
};

const bound_functions = {
  "search" : {
    "set_name_create": [],
    "add_search_tag_button": [],
    "switch_list_type": [],
    "create_temp_set_button": []
  },
  "set_editor" : {
    "new": [],
    "go_back": [],
    "add_tag_button": []
  },
  "card_editor": {
    "set_card": [],
    "go_back": [],
    "add_tag_button": []
  },
  "runset": {
    "go_back": [],
    "missed": [],
    "correct": [],
    "flip_card": []/*,
    "split_set": []*/
  }
}

function attach_functions( interface, value ) {
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    if( value ) {
      let func_ref = functions[interface][button_name].bind(null,value);
      button_ref.addEventListener( 'click', func_ref );
      bound_functions[interface][button_name].push( func_ref );
    } else {
      button_ref.addEventListener( 'click', functions[interface][button_name] );
    }
  };
}

function detach_functions( interface ) {
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    button_ref.removeEventListener( 'click', functions[interface][button_name] );
    if( bound_functions[interface][button_name] ) {
      bound_functions[interface][button_name].forEach( func => {
        button_ref.removeEventListener( 'click', func );
      });
    }
  };
}

function set_interface( interface, value ) {
  curr_interface = interface;
  const body = document.body;
  interfaces.forEach( interface_base_name => {
    const interface_name = interface_base_name + "_interface";
    const interface_handle = document.getElementById( interface_name );
    if( interface == interface_base_name ) {
      if( interface_base_name == "search" ) {
        interface_handle.style.display = "grid";
        body.style['overflow-y'] = "auto";
      } else {
        interface_handle.style.display = "flex";
        body.style['overflow-y'] = "hidden";
      }
      attach_functions( interface, value );
    } else {
      interface_handle.style.display = "none";
      detach_functions( interface_base_name );
    }
  });
}
