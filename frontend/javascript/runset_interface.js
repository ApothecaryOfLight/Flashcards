/*
Function to launch the runset interface.

Runset interface is a question mode, which prompts the user with each card,
displaying the question. The user can flip the card over to see the answer.

Additionally the user can split a set into smaller sets, select which set to
use, and combine split sets.
*/
function launch_runset_interface( interface_state ) {
  //Compose a message asking the server for a set of cards.
  const get_cardlist = new Request(
    ip + 'get_cardlist/' + interface_state.runset_interface_state.set_id
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, begin the runset.
        runset( interface_state, json.cards, json.set_images );
      } else if( json.result == "error" ) {
        //Upon failure, display an error to the user.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Function to execute a runset.

inSetData: List of the cards in the set.
*/
function runset( interface_state, inSetData, inImages ) {
  //Create an object to track set information.
  let card_sets_obj = {
    curr_set : 0,
    sets : [],
    set_images: inImages
  };
  interface_state.runset_interface_state.card_sets_obj.curr_set = 0;
  interface_state.runset_interface_state.card_sets_obj.set_images = inImages;

  //Create an object inside the cardset object to track this run.
  interface_state.runset_interface_state.card_sets_obj.sets[ card_sets_obj.curr_set ] = {
    cards: inSetData,
    curr_card: 0,
    side: 0,
    prev_cards: []
  };

  //Initialize the cards, setting the number of correct guesses to 0 for each.
  prepare_cards( interface_state.runset_interface_state.card_sets_obj.sets[ card_sets_obj.curr_set ].cards );

  //Display the first card.
  next_card( interface_state.runset_interface_state.card_sets_obj );

  //Display the question.
  runset_render_qa( interface_state.runset_interface_state.card_sets_obj );

  //Display the card set menu.
  runset_render_side_menu( interface_state.runset_interface_state.card_sets_obj );

  //Set the interface to the runset interface.
  set_interface( "runset", interface_state );
}


/*
Function to initialize cards by setting the correct number of guesses to 0.
*/
function prepare_cards( cards ) {
  //Iterate through each card.
  for( index in cards ) {
    //Set the number of correct guesses to 0.
    cards[index].correct = 0;
  }
}


/*
Function to remove an empty subset once all the cards in it have been
successfully guessed a certain number of times.

card_sets_obj: Object containing information about this run.

target: Subset to remove.
*/
function remove_empty_subset( card_sets_obj, target ) {
  //Remove the empty subset.
  card_sets_obj.sets.splice(
    Number(target),
    1
  );

  //Reset the current set to 0.
  card_sets_obj.curr_set = Math.max( Number(target)-1, 0 );

  //Render the side menu with the updated data.
  runset_render_side_menu( card_sets_obj );
}


/*
Function to display the next card.

card_sets_obj: Object containing information about this run.
*/
function next_card( card_sets_obj ) {
  //If current subset is empty, switch to another subset.
  if( card_sets_obj.sets[ card_sets_obj.curr_set ].cards.length == 0 ) {
    remove_empty_subset(
      card_sets_obj,
      card_sets_obj.curr_set
    );
  }

  //If there are no more subsets, return to search interface.
  if( card_sets_obj.sets.length == 0 ) {
    launch_search_interface( false );
    return;
  }

  //Create a reference to the current subset.
  const current_card_set = card_sets_obj.sets[ card_sets_obj.curr_set ];

  //Push the last card into the record of previous cards.
  current_card_set.prev_cards.push( current_card_set.curr_card );

  //Keep the record of past cards half as large as the set of cards.
  while( current_card_set.prev_cards.length > current_card_set.cards.length/2 ) {
    current_card_set.prev_cards.shift();
  }

  //Randomly generate the index of the next card.
  const num_cards = current_card_set.cards.length;
  let next_card_number = Math.floor( Math.random() * num_cards );

  //Guarantee that the next card hasn't appeared recently.
  if( current_card_set.cards.length > 1 ) {
    while( current_card_set.prev_cards.includes(next_card_number) ) {
      next_card_number = Math.floor( Math.random() * num_cards );
    }
  }

  //Set the next card, flip the card to the question side, render it.
  current_card_set.curr_card = next_card_number;
  current_card_set.side = 0;
  runset_render_qa( card_sets_obj );
}


/*
Function to call upon clicking the button to go back to the main interface.
*/
function runset_interface_go_back( interface_state ) {
  launch_search_interface( interface_state );
}


/*
Function to return a timestamp.
*/
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


/*
Function to notify the server about an incorrect or correct guess.

user_hash: User's username hash.

card_id: Unique identifier of card that has a result to record.

result: Whether the card was guessed correctly or not.
*/
function send_card_result( user_hash, card_id, result ) {
  //Create the message to send to the server.
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

  //Send the message to the server.
  fetch( result_request )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "error" ) {
        //Upon error, notify the user.
        launch_modal( null, "Weird error.", { "Close": close_modal } );
      }
    });
}


/*
Function to call upon an incorrect guess.
*/
function runset_interface_missed( interface_state ) {
  //Get references
  const card_sets_obj = interface_state.runset_interface_state.card_sets_obj;
  const curr_subset_ref = card_sets_obj.sets[ card_sets_obj.curr_set ];

  //Decrement the number of correct guesses.
  curr_subset_ref.cards[ curr_subset_ref.curr_card ].correct--;

  //If the user is logged in, send the result of the guess to the server.
  if( interface_state.isLogged == true ) {
    send_card_result(
      interface_state.username_hash,
      curr_subset_ref.cards[ curr_subset_ref.curr_card ].card_id,
      -1
    );
  }

  //Display the next card.
  next_card( card_sets_obj );
}


/*
Function to be called upon a correct guess.
*/
function runset_interface_correct( interface_state ) {
  const card_sets_obj = interface_state.runset_interface_state.card_sets_obj;

  //Increment the number of correct guesses for this card.
  const curr_subset_ref = card_sets_obj.sets[ card_sets_obj.curr_set ];
  curr_subset_ref.cards[curr_subset_ref.curr_card].correct++;

  //If the user is logged in, notify the server of the result of the guess.
  if( interface_state.isLogged == true ) {
    send_card_result(
      interface_state.username_hash,
      curr_subset_ref.cards[curr_subset_ref.curr_card].card_id,
      1
   );
  }

  //If the card has been guessed correctly more than it has been guessed wrong,
  //by a margin of 5, remove the card from this run.
  if( curr_subset_ref.cards[curr_subset_ref.curr_card].correct >= 5 ) {
    //Remove the card.
    curr_subset_ref.cards.splice( curr_subset_ref.curr_card, 1 );

    //Update the side menu.
    runset_render_side_menu( card_sets_obj );
  }

  //Display the next card.
  next_card( card_sets_obj );
}


/*
Function to toggle between question and answer of a card.
*/
function runset_interface_flip_card( interface_state ) {
  const card_sets_obj = interface_state.runset_interface_state.card_sets_obj;

  //Get the card.
  const curr_subset_ref = card_sets_obj.sets[ card_sets_obj.curr_set ];

  //Toggle between the two sides.
  if( curr_subset_ref.side == 0 ) {
    curr_subset_ref.side = 1;
  } else {
    curr_subset_ref.side = 0;
  }

  //Rerender the interface.
  runset_render_qa( card_sets_obj );
}


/*
Function to split a set or subset into two subsets.

card_sets_obj: Object containing information about this current run.

index: Position of the set to be split.
*/
function runset_interface_split_set( card_sets_obj, index ) {
  //Get currently selected setset.
  const sel_set = card_sets_obj.sets[ Number(index) ];
  sel_set.prev_cards = [];

  //Insert new subset after current subset.
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

  //Put half of the cards in the current set into the next.
  const next_set = card_sets_obj.sets[ Number(index)+1 ];
  const half_number_of_cards = sel_set.cards.length/2;
  for( i=0; i<half_number_of_cards; i++ ) {
    //Randomly select card to shift between sets.
    const remaining_cards = sel_set.cards.length;
    const remove_card_pos = Math.floor( Math.random() * remaining_cards );

    //Copy that card into the new set.
    next_set.cards[ next_set.cards.length ] = JSON.parse(
      JSON.stringify(
        sel_set.cards[ remove_card_pos ]
      )
    );

    //Remove the card from the original set.
    sel_set.cards.splice( remove_card_pos, 1 );
  }

  //Render split sets.
  runset_render_side_menu( card_sets_obj );

  //Go to the next card.
  next_card( card_sets_obj );
}


/*
Function to combine two subsets into one subset or set.

card_sets_obj: Object containing information about this current run.

index: Position of first set/subset to merge.
*/
function runset_interface_merge_set( card_sets_obj, index ) {
  //Get references to the sets to merge.
  const first_set = card_sets_obj.sets[ Number(index) ];
  const second_set = card_sets_obj.sets[ Number(index)+1 ];
  const second_set_size = second_set.cards.length;

  //Deep copy the cards from the second set to the first.
  for( i=0; i<second_set_size; i++ ) {
    first_set.cards[ first_set.cards.length ] = JSON.parse(
      JSON.stringify(
        second_set.cards[i]
      )
    );
  }

  //Delete the second set.
  remove_empty_subset(
    card_sets_obj,
    Number(index)+1
  );

  next_card( card_sets_obj );
}


/*
Switch to another subset.

card_sets_obj: Object containing information about this current run.

index: Position of subset to switch to.
*/
function go_to_set( card_sets_obj, index ) {
  //Set the current subset to the target subset.
  card_sets_obj.curr_set = index;

  //Render the next card.
  next_card( card_sets_obj );
}


/*
Function to convert newline characters into HTML linebreaks.

inText: Text from server to make HTML compatible.
*/
function proc_txt_runset( inText ) {
  //Regex the newline characters into HTML linebreaks.
  let outText = inText.replaceAll( "\n", "<br>" );

  //Return the regex processed line.
  return outText;
}


/*
Function to create HTML elements that will create the familiar layout of a standard
index card.
*/
function runset_render_index_card() {
  //Get the containiner that will hold the blue lines.
  const blue_lines_container = document.getElementById("index_card_blue_line_container");

  //Compose the blue lines.
  for( i=0; i<36; i++ ) {
    const index_card_blue_line = document.createElement("div");
    index_card_blue_line.classList = "index_card_blue_line";
    blue_lines_container.appendChild( index_card_blue_line );
  }
}


function proc_txt_question_runset_interface( inText, inImages, QuestionContainer, inCardID ) {
  //3) Turn JSONified text string into a JSON object.
  const objectifiedText = JSON.parse( inText );

  //4) Iterate through every value in the object and append it to the question container.
  objectifiedText.forEach( (object) => {
    if( object.type == "text" ) {
      QuestionContainer.innerHTML = object.content;
    } else if( object.type == "image" ) {
      const image_container = document.createElement("img");
      image_container.src = inImages[inCardID][object.image_array_location];
      image_container.classList = "runset_interface_picture_question";
      QuestionContainer.appendChild( image_container );
    }
  });
}


/*
Render the card, whether it is in question or answer mode.

card_sets_obj: Object containing information about this current run.
*/
function runset_render_qa( card_sets_obj ) {

  //Get a reference to the current set.
  const curr_set = card_sets_obj.sets[ card_sets_obj.curr_set ];

  //Get the text field DOM element.
  const q_field = document.getElementById("runset_interface_q_text");
  const a_field = document.getElementById("runset_interface_a_text");

  //Remove any children of q_field.
  while( q_field.firstChild ) {
    q_field.firstChild.remove();
  }

  //If the set is empty, don't attempt to render a card.
  if( !curr_set.cards[ curr_set.curr_card ] ) {
    a_field.innerHTML = "";
    return;
  }

  const flashcard_line_container = document.getElementById("index_card_background");

  //Render either the question or the answer.
  if( curr_set.side == 0 ) {
    flashcard_line_container.style["display"] = "none";
    proc_txt_question_runset_interface(
      curr_set.cards[ curr_set.curr_card ].question,
      card_sets_obj.set_images,
      q_field,
      curr_set.cards[ curr_set.curr_card ].card_id
    );
    a_field.style["display"] = "none";
    q_field.style["display"] = "flex";
  } else if( curr_set.side == 1 ) {
    //Draw the lined index card.
    flashcard_line_container.style["display"] = "block";
    runset_render_index_card();
    a_field.innerHTML = proc_txt_runset( curr_set.cards[ curr_set.curr_card ].answer );
    a_field.style["display"] = "block";
    q_field.style["display"] = "none";
  }
}


/*
Render the side menu, listing all available subsets and buttons.

card_sets_obj: Object containing information about this current run.
*/
function runset_render_side_menu( card_sets_obj ) {
  //Get DOM element reference to split set button container.
  const split_buttons_container = document.getElementById("runset_interface_split_set_buttons");

  while( split_buttons_container.firstChild ) {
    split_buttons_container.firstChild.remove();
  }

  //Iterate through each subset.
  for( index in card_sets_obj.sets ) {
    const split_set_button_group = document.createElement("div");
    split_set_button_group.classList = "runset_interface_split_set_button_group";
    split_set_button_group.innerText = card_sets_obj.sets[index].cards.length;

    const split_set_button_clickable = document.createElement("div");
    split_set_button_clickable.onclick = runset_interface_split_set.bind(
      null,
      card_sets_obj,
      index
    );
    split_set_button_group.appendChild( split_set_button_clickable );

    const split_set_button_icon = document.createElement("span");
    split_set_button_icon.classList = "button material-icons md-32";
    split_set_button_icon.innerText = "swap_horiz";
    split_set_button_clickable.appendChild( split_set_button_icon );

    const split_set_use = document.createElement("div");
    split_set_use.onclick = go_to_set.bind(
      null,
      card_sets_obj,
      index
    );;
    split_set_use.innerText = "Use";
    split_set_button_group.appendChild( split_set_use );

    split_buttons_container.appendChild( split_set_button_group );

    if( index < card_sets_obj.sets.length-1 ) {
      const split_set_merge_button = document.createElement("div");
      split_set_merge_button.onclick = runset_interface_merge_set.bind(
        null,
        card_sets_obj,
        index
      );
      
      const split_set_merge_icon = document.createElement("span");
      split_set_merge_icon.classList = "button material-icons md-32";
      split_set_merge_icon.innerText = "swap_vert";

      split_set_merge_button.appendChild( split_set_merge_icon );
      split_buttons_container.appendChild( split_set_merge_button );
    }
  }
}