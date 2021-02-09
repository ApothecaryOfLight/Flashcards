
window.addEventListener( 'load', (loaded_event) => {
  launch_setlist_interface();
});

/*
Runset Interface
*/
function launch_runset_interface( inSetID ) {
  let card_set_obj = {
    curr_card: 0,
    side: 0
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
      }
    });
}

function runset_interface_go_back( cards_obj ) {
  launch_setlist_interface();
}
function runset_interface_missed( cards_obj ) {
  console.log( "Missed!" );
  console.log( cards_obj.cards.length );
  if( cards_obj.curr_card <= cards_obj.cards.length ) {
    cards_obj.curr_card++;
    cards_obj.side = 0;
    runset_render_qa( cards_obj );
  }
}
function runset_interface_correct( cards_obj ) {
  console.log( "Correct!" );
  console.log( cards_obj.cards.length );
  if( cards_obj.curr_card <= cards_obj.cards.length ) {
    cards_obj.curr_card++;
    cards_obj.side = 0;
    runset_render_qa( cards_obj );
  }
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

function runset_render_qa( card_set_obj ) {
  const qa_field = document.getElementById("runset_interface_qa_space");
  console.dir( card_set_obj.cards );
  if( card_set_obj.side == 0 ) {
    const dom = "<span onclick=\"switchSide( 0 )\">" +
      card_set_obj.cards[card_set_obj.curr_card].question +
      "</span>";
    qa_field.innerHTML = dom;
  } else if( card_set_obj.side == 1 ) {
    const dom = "<span onclick=\"switchSide( 0 )\">" +
      card_set_obj.cards[card_set_obj.curr_card].answer +
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
        question_text.value = json.card.question;
        answer_text.value = json.card.answer;
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
        launch_cardlist_interface( inSetID );
      }
    });
}

function card_interface_go_back( inSetID ) {
  console.log( "card_interface_go_back" );
  launch_cardlist_interface( inSetID );
}

/*
Cardlist interface
*/
function launch_cardlist_interface( inSetID ) {
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
      }
    });
}
function cardlist_interface_populate_list( inSetID, inCards ) {
  const cardlist_interface_card_list = document.getElementById("cardlist_interface_card_list" );
  let dom = "";
  inCards.forEach( card => {
    dom += "<div class=\"card_element\"> " +
      "<span class=\"card_button\" " +
      "onclick=\"launch_card_interface(" + card.card_id + ", " + inSetID + ", false)\">" +
      "<span class=\"card_element_q\">" + card.question + "</span>" +
      "<span class=\"card_element_a\">" + card.answer + "</span>" +
      "</span>" +
      "<button class=\"card_element_delete_button\" " +
      "onclick=\"deleteCard(" + card.card_id + ", " + inSetID + ")\">X</button>" +
      "</div>";
  });
  cardlist_interface_card_list.innerHTML = dom;
}

function deleteCard( inCardID, inSetID ) {
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
      "<span onclick=\"getSet(\'" + set.name + "\'," + set.set_id + ")\">" + set.name +
      "</span>" +
      "<button onclick=\"playSet(" + set.set_id + ")\">Play</button>" +
      "<button onclick=\"deleteSet(" + set.set_id + ")\">X</button>" +
      "</div>";
  });
  setlist_dom_obj.innerHTML = dom_string;
}

function playSet( inSetID ) {
  console.log( "playSet " + inSetID );
  launch_runset_interface( inSetID );
}

function getSet( inName, inSetID ) {
  launch_cardlist_interface( inSetID );
}

function deleteSet( inSetID ) {
  const delete_set = new Request(
    'http://52.36.124.150:3000/delete_set/' + inSetID,
    {
      method: 'POST'
    }
  );
  fetch( delete_set )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        launch_setlist_interface();
      }
    });
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
      interface_handle.style.display = "flex";
      attach_functions( interface, value );
    } else {
      interface_handle.style.display = "none";
      detach_functions( interface_base_name );
    }
  });
}
