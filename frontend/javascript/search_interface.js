/*
Function to launch the search interface.

This is the primary intreface through which you can see all sets or all cards.
*/
function launch_search_interface( interface_state ) {
  //Set the interface to the search interface.
  set_interface( "search", interface_state );

  //Show or hide login/logout buttons as is appropraite.
  set_logged_elements( interface_state );

  get_subject_tags( interface_state, 1 );

  search_interface_run_search( interface_state );
}


function add_search_term( interface_state, search_term ) {
  const search_term_container = document.getElementById("search_tag_container");
  const search_tag_unit = document.createElement("div");
  search_tag_unit.classList = "search_tag_unit";
  search_tag_unit.innerHTML = search_term;

  const search_tag_delete = document.createElement("div");
  search_tag_delete.classList = "search_tag_delete";
  search_tag_delete.onclick = delete_search_term.bind( null, interface_state, search_term );
  search_tag_delete.innerText = "X";

  search_tag_unit.appendChild( search_tag_delete );

  search_term_container.appendChild( search_tag_unit );
}


/*
Add a search term to the search.
*/
function add_search_term_button( interface_state ) {
  //Get search term
  const search_bar = document.getElementById("search_interface_set_name");
  let search_bar_text = search_bar.value;
  search_bar.value = "";
  if( search_bar_text == "" ) { return; }
  search_bar_text = regexp_text(search_bar_text);

  //Ensure that search term doesn't already exist.
  let iterator = document.getElementById("search_tag_container").firstChild;
  while( iterator ) {
    if( iterator.firstChild.data == search_bar_text ) {
      return;
    }
    iterator = iterator.nextSibling;
  }

  //Add search term to search_terms
  add_search_term( interface_state, search_bar_text );

  //Send updated search term list
  search_interface_run_search( interface_state );
}


function add_search_term_on_enter( interface_state, keypress_event ) {
  if( keypress_event.key == "Enter" ) {
    add_search_term_button( interface_state );
  }
}


/*
Function to swtich between listing sets or instead listing cards.
*/
function switch_list_type( interface_state ) {
  //Get a reference to the switch button.
  const button = document.getElementById("search_interface_switch_list_type");

  interface_state.search_interface_state.scrollY = 0;
  if( interface_state.search_interface_state.search_type == "card" ) {
    interface_state.search_interface_state.search_type = "set";
    interface_state.search_interface_state.curr_page = "0";
    button.textContent = "List Cards";
  } else if( interface_state.search_interface_state.search_type == "set" ) {
    interface_state.search_interface_state.search_type = "card";
    interface_state.search_interface_state.curr_page = "0";
    button.textContent = "List Sets";
  }

  //Run a search with the new list type.
  search_interface_run_search( interface_state );
}


/*
Run a search.
*/
function search_interface_run_search( interface_state ) {
  search_terms = [];
  let iterator = document.getElementById("search_tag_container").firstChild;
  while( iterator ) {
    search_terms.push( iterator.firstChild.data );
    iterator = iterator.nextSibling;
  }
  if( interface_state.search_interface_state.search_type == "set" ) {
    if( search_terms.length == 0 && interface_state.search_interface_state.subject_level == 1 ) {
      //Run set search without search terms.
      getSetList( interface_state );
      return;
    }
  } else if( interface_state.search_interface_state.search_type == "card" ) {
    if( search_terms.length == 0 && interface_state.search_interface_state.subject_level == 1 ) {
      //Run card search without search terms.
      getCardList( interface_state );
      return;
    }
  }

  //Compose the search message.
  const search_request_object = JSON.stringify({
    topics: search_terms,
    search_type: interface_state.search_interface_state.search_type,
    page_num: (interface_state.search_interface_state.curr_page ?? 0),
    subject_level: interface_state.search_interface_state.subject_level,
    subject_parent_id: interface_state.search_interface_state.subject_parent_id
  });

  //Send search
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

  //On result, render the sets/cards
  fetch( search_request )
    .then( json => json.json() )
    .then( json => {
    if( json.result == "success" ) {
      if( json.search_type == "card" ) {
        render_search_cards({
          data:json.set_rows,
          "page_count": json.page_count,
          "search_type": json.search_type
        },
        interface_state );
      } else if( json.search_type == "set" ) {
        render_search_sets({
          "set_rows": json.set_rows,
          "page_count": json.page_count,
          "search_type": json.search_type
        },
        interface_state );
      }
    } else if( json.result == "error" ) {
      const options = {
        "Close" : close_modal
      }
      launch_modal( null, json.error_message, options );
    }
  });
}


/*
Function to dynamically generate the available page buttons for pagination.

inPages: Number of pages available.

inCurrPage: Page the user is currently on.
*/
function process_page_buttons( inPages, inCurrPage ) {
  const page_buttons = [];
  if( inPages < 9 ) {
    for( let i=1; i<=inPages; i++ ) {
      page_buttons.push( i );
    }
  } else if( inPages >= 9 ) {
    if( inCurrPage < 4 ) {
      page_buttons.push( 1, 2, 3, 4 );
      page_buttons.push( Math.floor( inPages/2 ) );
      page_buttons.push( inPages-1, inPages );
    } else if( (inPages-inCurrPage) < 4 ) {
      page_buttons.push( 1, 2 );
      page_buttons.push( Math.floor( inPages/2 ) );
      page_buttons.push( inPages-3, inPages-2, inPages-1, inPages );
    } else {
      page_buttons.push( 1, 2 );
      page_buttons.push( inCurrPage-2, inCurrPage-1, inCurrPage );
      page_buttons.push( inCurrPage+1, inCurrPage+2 );
      page_buttons.push( inPages-1, inPages );
    }
  }
  return page_buttons;
}

function proc_txt_question_search_interface( inText ) {
  //1) Turn JSONified text string into a JSON object.
  const objectifiedText = JSON.parse( inText );

  //2) Iterate through every value in the object and append it to the string to return.
  let returned_text = "";
  objectifiedText.forEach( (object) => {
    if( object.type == "text" ) {
      returned_text += object.content;
    } else if( object.type == "image" ) {
      returned_text += "Image Question.";
    }
  });

  return returned_text;
}


/*
Render the cards that are the result of a serach.

inSearch_set_editor: Object containing the search result details.
*/
function render_search_cards( inSearch_set_editor, interface_state ) {
  //Render the page buttons.
  render_search_cards_pagination(
    Math.ceil( inSearch_set_editor.page_count ),
    interface_state
  );

  //Get a reference to the cards that resulted from the search.
  const cards = inSearch_set_editor.data;

  //Get a reference to the container that will be used to display the result.
  const search_dom_obj = document.getElementById("search_interface_set_list");
  while( search_dom_obj.firstChild ) {
    search_dom_obj.firstChild.remove();
  }

  //Iterate through each card and convert the JSON object data into HTML elements.
  cards.forEach( card => {
    const creator_username = String.fromCharCode.apply( null, card.set_creator.data );

    const search_item = document.createElement("div");
    search_item.classList = "search_item";

    if( interface_state.isLogged && interface_state.username_hash == creator_username ) {
      const edit_button = document.createElement("div");
      edit_button.classList = "button search_item_edit_button";
      edit_button.addEventListener( "click", (click) => {
        interface_state.search_interface_state.scrollY = window.scrollY;
        interface_state.card_editor_interface_state.prev_interface = "search";
        interface_state.card_editor_interface_state.card_id = card.card_id;
        interface_state.card_editor_interface_state.set_id = card.set_id;
        interface_state.card_editor_interface_state.isNew = false;
        launch_card_editor_interface( interface_state );
      });
      edit_button.innerText = "Edit";
      search_item.appendChild( edit_button );
    }
    const search_item_text_container = document.createElement("div");
    search_item_text_container.classList = "search_item_text_container";

    const search_item_question = document.createElement("span");
    search_item_question.classList = "search_item_text";
    search_item_question.innerHTML = "Q)" + proc_txt_question_search_interface(card.question);

    const search_item_answer = document.createElement("span");
    search_item_answer.classList = "search_item_text";
    search_item_answer.innerHTML = "A)" + card.answer;

    search_item_text_container.appendChild( search_item_question );
    search_item_text_container.appendChild( search_item_answer );
    search_item.appendChild( search_item_text_container );

    search_dom_obj.appendChild( search_item );
  });

  
  window.scrollTo({top:interface_state.search_interface_state.scrollY,behavior:"smooth"});
  
  //Render the 'lines,' as they would appear on a piece of lined paper.
  draw_paper();
}


/*
Render the pagination buttons for a card list search result.

inPages: Total number of pages in the search result.

search_type: Value determining whether the search result is sets or cards.
*/
function render_search_cards_pagination( inPages, interface_state ) {
  //Create an object containing information about the desired page buttons.
  const pages_obj = process_page_buttons( inPages, interface_state.search_interface_state.curr_page ?? 1 );

  //Get a reference to the page button container.
  const container = document.getElementById("search_interface_pagination_container" );

  while( container.firstChild ) {
    container.firstChild.remove();
  }
  
  //Interate through each page and create an HTML button element for it.
  for( page_key in pages_obj ) {
    const real_page_number = Number( pages_obj[page_key]-1 );
    const setlist_interface_page_button = document.createElement("div");
    setlist_interface_page_button.classList = "setlist_interface_page_button";
    if( Number(pages_obj[page_key]-1) == Number(interface_state.search_interface_state.curr_page) ) {
      setlist_interface_page_button.classList += " setlist_interface_current_page_button";
    }
    setlist_interface_page_button.addEventListener("click", (event) => {
      interface_state.search_interface_state.curr_page = real_page_number;
      interface_state.search_interface_state.scrollY = 0;
      search_interface_run_search( interface_state );
    });
    setlist_interface_page_button.innerText = pages_obj[page_key];
    container.appendChild( setlist_interface_page_button );
  }
}


/*
Delete a search term from the search.

inTerm: Term to remove from the search.
*/
function delete_search_term( interface_state, inTerm ) {
  //Iterate through each tag.
  let iterator = document.getElementById("search_tag_container").firstChild;
  while( iterator ) {
    if( iterator.firstChild.data == inTerm ) {
      iterator.remove();
    }
    iterator = iterator.nextSibling;
  }

  //Run a new search based based on the remaining tags.
  search_interface_run_search( interface_state );
}


/*
Function to be called upon the creation of a temporary set.
*/
function create_temp_set_button( interface_state ) {
  //Store a placeholder for the username.
  let user = "unlogged";
  if( interface_state.isLogged == true ) {
    //If the user is logged in, use their correct username.
    user = interface_state.username_hash;
  }

  //Create a request to send to the server for the temporary set.
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
        //Upon success, display the temporary set.
        runset( json.cards );
      } else if( json.result == "error" ) {
        //Upon failure, notify the user.
        launch_modal( null, json.error_message, { "Close": close_modal } );
      }
    });
}


/*
Function to draw lines that mimic a tradition 8 1/2x11 piece of lined paper.

Will draw as many lines as there is space to fill with them.
*/
function draw_paper() {
  //1) Get a reference to the area where we need to draw the lines.
  const list_area = document.getElementById("search_interface_set_list");

  //2) Get the properties of the to-be-lined area after CSS has been applied.
  const list_area_properties = window.getComputedStyle(search_interface_set_list);

  //3) Get the height of the to-be-lined area.
  list_area_height_px = list_area_properties.getPropertyValue('height');

  //4) Remove the trailing "px" so we can calculate with it.
  const list_area_height = list_area_height_px.substring( 0, list_area_height_px.length-2 );

  //5) Create an example element, set it's height to 1 line.
  const em_test_div = document.createElement("div");
  em_test_div.style.height = "2em";

  //6) Attach it to the document so the height will be set according to CSS.
  search_interface_set_list.appendChild( em_test_div );

  //7) Get the height value of a single line.
  const em_height = em_test_div.offsetHeight;

  //8) Remove the example element so it doesn't clutter the screen.
  em_test_div.remove();

  //9) Calculate how many lines we need to draw.
  const number_of_lines_needed = list_area_height / em_height;

  //10) Get a reference to the lines container.
  const blue_lines_container = document.getElementById("blue_line_container");

  //11) Ensure that any existing lines are removed.
  while( blue_lines_container.firstChild ) {
    blue_lines_container.firstChild.remove();
  }

  //12) Create as many lines as are needed.
  for( i=0; i<number_of_lines_needed+1; i++ ) {
    const new_line = document.createElement("div");
    new_line.classList = "blue_line";
    blue_lines_container.appendChild( new_line );
  }
}


/*
Function to display or hide the login/logout elements as is appropriate.
*/
function set_logged_elements( interface_state ) {
  //Get a reference to the create set button, which should only be visible to
  //logged in users.
  const create_set_button = document.getElementById("search_interface_set_name_create");

  //Based on whether the user is logged in or not, hide or display the
  //create set button.
  if( interface_state.isLogged == false ) {
    create_set_button.style.display = "none";
  } else if( interface_state.isLogged == true ) {
    create_set_button.style.display = "inline-block";
  }
}


/*
Get a list of available card sets.

inPage: Current page the user is on.
*/
function getSetList( interface_state ) {
  //Create a request for a list of card sets.
  const getSetListObj = new Request(
    ip + 'setlist/' + (interface_state.search_interface_state.curr_page ?? 0),
    { method: 'GET' }
  );
  fetch( getSetListObj )
    .then( obj => obj.json())
    .then( obj => {
      //Display the list.
      render_search_sets( obj, interface_state );
    });
}


/*
Get a list of available card sets.

inPage: Current page the user is on.
*/
function getCardList( interface_state ) {
  //Create a request for a list of cards.
  const getCardListObj = new Request(
    ip + 'cardlist/' + (interface_state.search_interface_state.curr_page ?? 0),
    { method: 'GET' }
  );
  fetch( getCardListObj )
    .then( obj => obj.json())
    .then( obj => {
      //Display the list.
      render_search_cards( obj, interface_state );
    });
}


/*
Function to render the cardsets that result from a search.

inSetListObj: Object containing the search sets.
*/
function render_search_sets( inSetListObj, interface_state ) {
  //Render the page buttons.
  render_search_sets_pagination(
    Math.ceil( inSetListObj.page_count ),
    interface_state
  );

  //Get a reference to the  sets.
  const setList = inSetListObj.set_rows;

  //Get a reference to the DOM element that will contain the set list.
  const search_dom_obj = document.getElementById("search_interface_set_list");

  //Iterate through each set, transforming the JSON data into HTML elements.
  //let dom_string = "";
  while( search_dom_obj.firstChild ) {
    search_dom_obj.firstChild.remove();
  }

  setList.forEach( set => {
    const set_username_hash = String.fromCharCode.apply(null, set.set_creator.data );
    const search_item = document.createElement("div");
    search_item.classList = "search_item";
    if( interface_state.isLogged && interface_state.username_hash == set_username_hash ) {
      const search_item_edit_button = document.createElement("div");
      search_item_edit_button.classList = "button search_item_edit_button";
      search_item_edit_button.onclick = getSet.bind( null, interface_state, set.set_id );
      search_item_edit_button.innerText = "Edit";
      search_item.appendChild( search_item_edit_button );
    }

    const button_item_text_container = document.createElement("div");
    button_item_text_container.classList = "button search_item_text_container";
    button_item_text_container.onclick = playSet.bind( null, interface_state, set.set_id );

    const search_item_text = document.createElement("span");
    search_item_text.classList = "search_item_text";
    search_item_text.innerText = set.name;
    button_item_text_container.appendChild( search_item_text );

    search_item.appendChild( button_item_text_container );

    if( interface_state.isLogged && interface_state.username_hash == set_username_hash ) {
      const set_delete_button = document.createElement("div");
      set_delete_button.classList = "button search_item_delete_button";
      set_delete_button.onclick = prompt_delete_set.bind( null, set.set_id );
      set_delete_button.innerText = "Delete";
      search_item.appendChild( set_delete_button );
    }

    search_dom_obj.appendChild( search_item );
  });
  
  draw_paper();

  window.scrollTo({top:interface_state.search_interface_state.scrollY,behavior:"smooth"});
}


/*
Render the page buttons for a search set result.

inPages: Total list of pages.
*/
function render_search_sets_pagination( inPages, interface_state ) {
  //Create an object containing the necessary page buttons.
  const pages_obj = process_page_buttons( inPages, interface_state.search_interface_state.curr_page );

  //Get a reference to the page button container.
  const container = document.getElementById("search_interface_pagination_container" );
  while( container.firstChild ) {
    container.firstChild.remove();
  }

  //Iterate through each page button object, transforming each into an HTML button.
  for( page_key in pages_obj ) {
    const real_page_number = Number( pages_obj[page_key] - 1 );
    const setlist_interface_page_button = document.createElement("div");
    setlist_interface_page_button.classList = "setlist_interface_page_button";
    if( Number(pages_obj[page_key]-1) == Number(interface_state.search_interface_state.curr_page??0) ) {
      setlist_interface_page_button.classList += " setlist_interface_current_page_button";
    }
    setlist_interface_page_button.innerText = pages_obj[page_key];
    container.appendChild( setlist_interface_page_button );
    setlist_interface_page_button.addEventListener( "click", (event) => {
      interface_state.search_interface_state.curr_page = real_page_number;
      interface_state.search_interface_state.scrollY = 0;
      search_interface_run_search( interface_state );
    });
  }
}


/*
Function to launch a runset.

inSetID: Unique identifier of the set of cards.
*/
function playSet( interface_state, inSetID ) {
  //Remember the scroll position.
  interface_state.search_interface_state.scrollY = window.scrollY;

  interface_state.runset_interface_state.set_id = inSetID;

  //Launch the runset interface.
  launch_runset_interface( interface_state );
}


/*
Get a cardset to edit it.

inSetID: Unique identifier of the set of cards.
*/
function getSet( interface_state, inSetID ) {
  //Remember the scroll position.
  interface_state.search_interface_state.scrollY = window.scrollY;

  interface_state.set_editor_interface_state.set_id = inSetID;

  //Launch the set editor interface.
  launch_set_editor_interface( interface_state );
}


/*
Function to be called when the button to create a new set of cards is clicked.
*/
function search_interface_set_create( interface_state ) {
  //Get the new set name from the input text bar.
  const setname_input = document.getElementById( 'search_interface_set_name' );
  const new_set_name = setname_input.value;

  //So long as it has a name, create the new set.
  if( new_set_name != "" ) {
    create_set( interface_state, new_set_name );
  }
}


/*
Function to create a new set of cards.

set_name: Name of the new set.
*/
function create_set( interface_state, set_name ) {
  //Create the request to send to the server to ask for the new set to be created.
  const new_set = new Request(
    ip + 'new_set',
    {
      method: 'POST',
      body: JSON.stringify({
        "set_name":set_name,
        "username_hash": interface_state.username_hash
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
        //Upon success, launch the set editor for this new set.
        interface_state.set_editor_interface.set_id = json.set_id;
        launch_set_editor_interface( interface_state, false );
      } else if( json.result == "error" ) {
        //Otherwise, on error, notify the user.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}