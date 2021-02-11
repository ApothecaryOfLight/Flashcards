
window.addEventListener( 'load', (loaded_event) => {
  launch_setlist_interface();
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
  console.log( "Go!" );

  const get_cardlist = new Request(
    'http://52.36.124.150:3000/get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        console.dir( json.cards );
        card_set_obj.cards = json.cards;
        runset_render_qa( card_set_obj );
        next_card( card_set_obj );
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
  console.log( "Missed!" );
  console.log( cards_obj.cards.length );
  next_card( cards_obj );
}
function runset_interface_correct( cards_obj ) {
  console.log( "Correct!" );
  console.log( cards_obj.cards.length );
  next_card( cards_obj );
}
function runset_interface_flip_card( cards_obj ) {
  console.log( "Flipping!" );
  console.dir( cards_obj.cards );
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

function runset_render_qa( card_set_obj ) {
  const qa_field = document.getElementById("runset_interface_qa_space");
//  console.dir( card_set_obj.cards );
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
    console.log( "Old card." );
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
    console.log( "New card." );
  }
}

function proc_txt_card_interface( inText ) {
  console.log( "proccing" );
  //1) Replace unicode apostrophe with apostrophe.
  let outText = inText.replaceAll( "&#39", "\'" );
  return outText;
}

function get_card( inCardID ) {
  const get_card = new Request(
    'http://52.36.124.150:3000/get_card/' + inCardID
  );
  const question_text = document.getElementById("card_interface_q_text");
  const answer_text = document.getElementById("card_interface_a_text");
  fetch( get_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        question_text.value = proc_txt_card_interface( json.card.question );
        answer_text.value = proc_txt_card_interface( json.card.answer );
      }
    });
}

function card_interface_update_card( inSetID, inCardID ) {
  console.log( "card_interface_update_card" );
  const card_q_handle = document.getElementById("card_interface_q_text");
  const card_a_handle = document.getElementById("card_interface_a_text");
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;

  const update_card = new Request(
    'http://52.36.124.150:3000/update_card',
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
      }
    });
}

function card_interface_set_card( inSetID ) {
  console.log( "card_interface_set_card" );
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
    'http://52.36.124.150:3000/add_card',
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
      }
    });
}

function card_interface_go_back( inSetID ) {
  console.log( "card_interface_go_back" );
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
    'http://52.36.124.150:3000/get_cardlist/' + inSetID
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
      "<button class=\"button card_element_delete_button\" " +
      "onclick=\"prompt_delete_card(" + card.card_id + ", " + inSetID + ")\">X</button>" +
      "</div>";
  });
  cardlist_interface_card_list.innerHTML = dom;
}

function cardlist_interface_new_button( inSetID ) {
  launch_card_interface( null, inSetID, true );
}
function cardlist_interface_go_back() {
  //console.log( "cardlist_interface_go_back" );
  launch_setlist_interface();
}


/*
Setlist interface
*/
function launch_setlist_interface() {
  set_interface( "setlist" );
  getSetList();
}

function getSetList() {
  //console.log( "getSetList()" );
  const test = new Request(
    'http://52.36.124.150:3000/setlist',
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
  setList.forEach( set => {
    dom_string += "<div class=\'setlist_item\'>" +
      "<button class=\"button setlist_item_delete_button\" " +
      "onclick=\"prompt_delete_set(" + set.set_id + ")\">X</button>" +
      "<div class=\"button setlist_item_text_container\"" +
      "onclick=\"playSet(" + set.set_id + ")\">" + 
      "<span class=\"setlist_item_text\">" +
      set.name + "</span>" + "</div>" +
      "<button class=\"button setlist_item_play_button\" " +
      "onclick=\"getSet(" + set.set_id + ")\">Edit</button>" +
      "</div>";
  });
  setlist_dom_obj.innerHTML = dom_string;
}

function playSet( inSetID ) {
  console.log( "playSet " + inSetID );
  launch_runset_interface( inSetID );
}

function getSet( inSetID ) {
  launch_cardlist_interface( inSetID );
}

function setlist_interface_create() {
  const setname_input = document.getElementById( 'setlist_interface_set_name' );
  const new_set_name = setname_input.value;
  if( new_set_name != "" ) {
    create_set( new_set_name );
  }
}

function create_set( set_name ) {
  const new_set = new Request(
    'http://52.36.124.150:3000/new_set',
    {
      method: 'POST',
      body: JSON.stringify({ "set_name":set_name }),
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
      }
    });
}


/*
Modal interface
*/
let modal_buttons_storage = {};
function modal_button( button_name ) {
  console.log( button_name );
  modal_buttons_storage[button_name]();
}

function launch_modal( isPrompt, inMessage, inButtons ) {
  const modal_handle = document.getElementById("modal_interface_screen_cover");
  modal_handle.style.display = "flex";

  const modal_message = document.getElementById( "modal_interface_message" );
  modal_message.innerHTML = inMessage;

  let dom = "";
  for( button_name in inButtons ) {
    console.log( typeof( inButtons[button_name] ) );
    modal_buttons_storage[button_name] = inButtons[button_name];
    dom += "<button class=\"button modal_button\" " +
      "onclick=\"modal_button(\'" + button_name + "\')\">" +
      button_name + "</button>"
  }
  console.log( dom );
  const modal_buttons = document.getElementById( "modal_interface_button_container" );
  modal_buttons.innerHTML = dom;
}

function close_modal() {
  console.log( "close_modal" );
  const modal_handle = document.getElementById("modal_interface_screen_cover");
  modal_handle.style.display = "none";
}

function delete_card( inCardID, inSetID ) {
  console.log( inCardID + "/" + inSetID );
  const delete_card = new Request(
    'http://52.36.124.150:3000/delete_card/' + inCardID,
    {
      method: 'POST'
    }
  );
  fetch( delete_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        launch_cardlist_interface( inSetID );
      }
    });
  close_modal();
}

function delete_set( inSetID ) {
  const delete_set_req = new Request(
    'http://52.36.124.150:3000/delete_set/' + inSetID,
    {
      method: 'POST'
    }
  );
  fetch( delete_set_req )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        launch_setlist_interface();
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
Interface switching code.
*/
const interfaces = [
  "setlist", "cardlist", "card", "runset"
];

const functions = {
  "setlist" : {
    "create": setlist_interface_create
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
    "create": []
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
  interfaces.forEach( interface_base_name => {
    const interface_name = interface_base_name + "_interface";
    const interface_handle = document.getElementById( interface_name );
    if( interface == interface_base_name ) {
      if( interface_base_name == "setlist" ) {
        interface_handle.style.display = "grid"; 
      } else {
        interface_handle.style.display = "flex";
      }
      attach_functions( interface, value );
    } else {
      interface_handle.style.display = "none";
      detach_functions( interface_base_name );
    }
  });
}
