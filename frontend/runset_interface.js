/*
Runset Interface
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
