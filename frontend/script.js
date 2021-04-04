const ip = 'http://52.11.132.13:3000/';

window.addEventListener( 'load', (loaded_event) => {
  launch_setlist_interface();
  attach_login();
});

/*
Runset Interface
*/
function launch_runset_interface( inSetID ) {
  let card_set_obj = {
    curr_card: 0,
    side: 0,
    prev_cards: []
  };
  set_interface( "runset", card_set_obj );

  const get_cardlist = new Request(
    ip + 'get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        console.dir( json.cards );
        card_set_obj.cards = json.cards;
        next_card( card_set_obj );
        runset_render_qa( card_set_obj );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function next_card( cards_obj ) {
  //1) Push the last card into the record of previous cards.
  cards_obj.prev_cards.push( cards_obj.curr_card );

  //2) Keep the record of past cards half as large as the set of cards.
  if( cards_obj.prev_cards.length > cards_obj.cards.length/2 ) {
    cards_obj.prev_cards.shift();
  }

  //3) Generate the next card.
  const num_cards = cards_obj.cards.length;
  let next_card_number = Math.floor( Math.random() * num_cards );

  //4) Guarantee that the next card hasn't appeared recently.
  while( cards_obj.prev_cards.some( (card_number) => {
    return (card_number == next_card_number);
  }) == true ) {
    next_card_number = Math.floor( Math.random() * num_cards );
  }

  //5) Set the next card, set the card to the question side, render it.
  cards_obj.curr_card = next_card_number;
  cards_obj.side = 0;
  runset_render_qa( cards_obj );
}
function runset_interface_go_back( cards_obj ) {
  launch_setlist_interface();
}
function runset_interface_missed( cards_obj ) {
  next_card( cards_obj );
}
function runset_interface_correct( cards_obj ) {
  next_card( cards_obj );
}
function runset_interface_flip_card( cards_obj ) {
  if( cards_obj.side == 0 ) {
    cards_obj.side = 1;
  } else {
    cards_obj.side = 0;
  }
  runset_render_qa( cards_obj );
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

function runset_render_qa( card_set_obj ) {
  runset_render_index_card();
  const qa_field = document.getElementById("runset_interface_qa_text");
  if( !card_set_obj.cards[card_set_obj.curr_card] ) {
    qa_field.innerHTML = "";
    return;
  }
  if( card_set_obj.side == 0 ) {
    const dom = "<span onclick=\"switchSide( 0 )\">" +
      proc_txt_runset( card_set_obj.cards[card_set_obj.curr_card].question ) +
      "</span>";
    qa_field.innerHTML = dom;
  } else if( card_set_obj.side == 1 ) {
    const dom = "<span onclick=\"switchSide( 0 )\">" +
      proc_txt_runset( card_set_obj.cards[card_set_obj.curr_card].answer ) +
      "</span>";
    qa_field.innerHTML = dom;
  }
}



/*
Card interface
*/
function launch_card_interface( inCardID, inSetID, isNew ) {
  set_interface( "card", inSetID );

  if( isNew == false ) {
    get_card( inCardID );
    const set_card = document.getElementById("card_interface_set_card");
    const func_ref = card_interface_update_card.bind( this, inSetID, inCardID );

    if( bound_functions["card"]["set_card"] ) {
      bound_functions["card"]["set_card"].forEach( (func)=> {
        set_card.removeEventListener( 'click', func );
      });
    }
    bound_functions["card"]["set_card"] = [];

    set_card.addEventListener( 'click', func_ref );
    bound_functions["card"]["set_card"].push( func_ref );
  } else {
  }
}

function proc_txt_card_interface( inText ) {
  //1) Replace unicode apostrophe with apostrophe.
  let outText = inText.replaceAll( "&#39", "\'" );
  return outText;
}

function get_card( inCardID ) {
  const get_card = new Request(
    ip + 'get_card/' + inCardID
  );
  const question_text = document.getElementById("card_interface_q_text");
  const answer_text = document.getElementById("card_interface_a_text");
  fetch( get_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        question_text.value = proc_txt_card_interface( json.card.question );
        answer_text.value = proc_txt_card_interface( json.card.answer );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function card_interface_update_card( inSetID, inCardID ) {
  const card_q_handle = document.getElementById("card_interface_q_text");
  const card_a_handle = document.getElementById("card_interface_a_text");
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;

  const update_card = new Request(
    ip + 'update_card',
    {
      method: 'POST',
      body: JSON.stringify({
        "set_id": inSetID,
        "card_id": inCardID,
        "question": question_text,
        "answer": answer_text
      }),
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
        launch_cardlist_interface( inSetID );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function card_interface_set_card( inSetID ) {
  const card_q_handle = document.getElementById("card_interface_q_text");
  const card_a_handle = document.getElementById("card_interface_a_text");
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;
  const json_obj = {
    "question": question_text,
    "answer": answer_text,
    "set_id": inSetID
  };

  const new_card = new Request(
    ip + 'add_card',
    {
      method: 'POST',
      body: JSON.stringify({
        "set_id": inSetID,
        "question": question_text,
        "answer": answer_text
      }),
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
        launch_cardlist_interface( inSetID, true );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}

function card_interface_go_back( inSetID ) {
  const card_q_handle = document.getElementById("card_interface_q_text");
  const card_a_handle = document.getElementById("card_interface_a_text");
  card_q_handle.value = "";
  card_a_handle.value = "";
  launch_cardlist_interface( inSetID );
}

/*
Cardlist interface
*/
function launch_cardlist_interface( inSetID, go_to_end ) {
  set_interface( "cardlist", inSetID );
  const set_name_element = document.getElementById("cardlist_interface_set_name");

  const get_cardlist = new Request(
    ip + 'get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        set_name_element.innerHTML = json.set_name.name;
        cardlist_interface_populate_list( inSetID, json.cards );
        if( go_to_end ) {
          cardlist_interface_scroll_to_bottom();
        }
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}
function cardlist_interface_scroll_to_bottom() {
  const cardlist_scr = document.getElementById("cardlist_interface_card_list");
  cardlist_scr.scrollTo( 0, cardlist_scr.scrollHeight );
}
function cardlist_interface_populate_list( inSetID, inCards ) {
  const cardlist_interface_card_list = document.getElementById("cardlist_interface_card_list" );
  let dom = "";
  inCards.forEach( card => {
    dom +=
      "<div class=\"card_element\"> " +
/*      "<span class=\"card_button\" " +
      "onclick=\"launch_card_interface(" + card.card_id + ", " + inSetID + ", false)\">" +*/
      "<div class=\"card_element_q\" " +
      "onclick=\"launch_card_interface(" + card.card_id + ", " + inSetID + ", false)\"" +
      ">" + card.question + "</div>" +
      "<div class=\"card_element_a\" " +
      "onclick=\"launch_card_interface(" + card.card_id + ", " + inSetID + ", false)\"" +
      ">" + card.answer + "</div>" +
/*      "</span>" +*/
      "<button class=\"card_element_delete_button\" " +
      "onclick=\"prompt_delete_card(" + card.card_id + ", " + inSetID + ")\">X</button>" +
      "</div>";
  });
  cardlist_interface_card_list.innerHTML = dom;
}

function cardlist_interface_new_button( inSetID ) {
  launch_card_interface( null, inSetID, true );
}
function cardlist_interface_go_back() {
  launch_setlist_interface();
}


/*
Setlist interface
*/
function launch_setlist_interface() {
  set_interface( "setlist" );
  set_logged_elements();
  getSetList();
}

const search_terms = [];

function add_search_term() {
  //1) Get search term
  const search_bar = document.getElementById("setlist_interface_set_name");
  const search_bar_text = search_bar.value;
  console.log( search_bar_text );
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
}

function delete_search_term( inTerm ) {
  console.log( inTerm );
  for( index in search_terms ) {
    if( search_terms[index] == inTerm ) {
      search_terms.splice( index, 1 );
    }
  }
  render_search_terms();
}

function render_search_terms() {
  let dom = "";
  for( index in search_terms ) {
    console.log( search_terms[index] );
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

function create_temporary_set() {

}

function switch_list_type() {

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
    document.getElementById("setlist_interface_set_name_create");
  if( logged_obj.isLogged == false ) {
    create_set_button.style.display = "none";
  } else if( logged_obj.isLogged == true ) {
    create_set_button.style.display = "flex";
  }
}

function getSetList() {
  const test = new Request(
    ip + 'setlist',
    { method: 'GET' }
  );
  fetch( test )
    .then( obj => obj.json())
    .then( obj => {
      renderSetList( obj );
    });
}

function renderSetList( setList ) {
  const setlist_dom_obj = document.getElementById("setlist_interface_set_list");
  let dom_string = "";
  draw_paper( setList.length );
  setList.forEach( set => {
    const set_username_hash = String.fromCharCode.apply(null, set.set_creator.data );
    dom_string += "<div class=\'setlist_item\'>";
    if( set_username_hash == logged_obj.username_hash ) {
      if( logged_obj.isLogged == true ) {
        dom_string += "<div class=\"button setlist_item_edit_button\" " +
          "onclick=\"getSet(" + set.set_id + ")\">Edit</div>";
      }
    }
    dom_string += "<div class=\"button setlist_item_text_container\"" +
      "onclick=\"playSet(" + set.set_id + ")\">" + 
      "<span class=\"setlist_item_text\">" +
      set.name + "</span>" + "</div>";
    //}
    if( set_username_hash == logged_obj.username_hash ) {
      if( logged_obj.isLogged == true ) {
        dom_string += "<div class=\"button setlist_item_delete_button\" " +
          "onclick=\"prompt_delete_set(" + set.set_id + ")\">Delete</div>";
      }
    }
    dom_string +=  "</div>";
  });
  setlist_dom_obj.innerHTML = dom_string;
}

function playSet( inSetID ) {
  launch_runset_interface( inSetID );
}

function getSet( inSetID ) {
  launch_cardlist_interface( inSetID );
}

function setlist_interface_set_create() {
  const setname_input = document.getElementById( 'setlist_interface_set_name' );
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
        launch_cardlist_interface( json.set_id );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Modal interface
*/
let modal_buttons_storage = {};
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
        launch_cardlist_interface( inSetID );
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
        launch_setlist_interface();
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

const logged_obj = {
  isLogged: false,
  username_hash: ""
}

/*
Logging in/out code
*/
let curr_interface = "";
let isLogged = false;
function login( inUsernameHash ) {
  logged_obj.isLogged = true;
  logged_obj.username_hash = inUsernameHash;

  close_modal();
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  login_element.style.display = "none";
  logout_element.style.display = "flex";
  //)Relaunch interface.
  if( curr_interface == "setlist" ) {
    launch_setlist_interface();
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
  if( curr_interface == "setlist" ) {
    launch_setlist_interface();
  } /*else if( curr_interface == "cardlist" ) {
    launch_cardlist_interface();
  }*/
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
Interface switching code.
*/
const interfaces = [
  "setlist", "cardlist", "card", "runset"
];

const functions = {
  "setlist" : {
    "set_name_create": setlist_interface_set_create,
    "add_search_tag_button": add_search_term
  },
  "cardlist" : {
    "new": cardlist_interface_new_button,
    "go_back": cardlist_interface_go_back
  },
  "card": {
    "set_card": card_interface_set_card,
    "go_back": card_interface_go_back
  },
  "runset": {
    "go_back": runset_interface_go_back,
    "missed": runset_interface_missed,
    "correct": runset_interface_correct,
    "flip_card": runset_interface_flip_card
  }
};

const bound_functions = {
  "setlist" : {
    "set_name_create": [],
    "add_search_tag_button": []
  },
  "cardlist" : {
    "new": [],
    "go_back": []
  },
  "card": {
    "set_card": [],
    "go_back": []
  },
  "runset": {
    "go_back": [],
    "missed": [],
    "correct": [],
    "flip_card": []
  }
}

function attach_functions( interface, value ) {
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    if( value ) {
      let func_ref = functions[interface][button_name].bind(null,value);
      button_ref.addEventListener( 'click', func_ref );
      //bound_functions[interface][button_name] = func_ref;
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

    /*if( bound_functions[interface][button_name] ) {
      button_ref.removeEventListener( 'click', bound_functions[interface][button_name] );
    }*/
  };
}

function set_interface( interface, value ) {
  curr_interface = interface;
  const body = document.body;
  interfaces.forEach( interface_base_name => {
    const interface_name = interface_base_name + "_interface";
    const interface_handle = document.getElementById( interface_name );
    if( interface == interface_base_name ) {
      if( interface_base_name == "setlist" ) {
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
