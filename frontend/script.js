
window.addEventListener( 'load', (loaded_event) => {
  launch_setlist_interface();
});


/*
Card interface
*/
function launch_card_interface( inCardID, inSetID, isNew ) {
  set_interface( "card", inSetID );

  if( isNew == false ) {
    get_card( inCardID );
  } else {
    card_id = inCardID;
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
      "<span " +
      "onclick=\"launch_card_interface(" + card.card_id + ", " + inSetID + ", false)\">" +
      card.question + "/" + card.answer +
      "</span>" +
      "<button onclick=\"deleteCard(" + card.card_id + ", " + inSetID + ")\">X</button>" +
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
function cardlist_interface_edit_button() {
  
}
function cardlist_interface_toggle_questions_button() {
  
}
function cardlist_interface_toggle_answers_button() {
  
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
      "</span><button onclick=\"deleteSet(" + set.set_id + ")\">X</button>" +
      "</div>";
  });
  setlist_dom_obj.innerHTML = dom_string;
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

function setlist_interface_edit() {

}


/*
Interface switching code.
*/
const interfaces = [
  "setlist", "cardlist", "card", "runset"
];

const functions = {
  "setlist" : {
    "create": setlist_interface_create,
    "edit": setlist_interface_edit
  },
  "cardlist" : {
    "new": cardlist_interface_new_button,
    "go_back": cardlist_interface_go_back
  },
  "card": {
    "set_card": card_interface_set_card,
    "go_back": card_interface_go_back
  }
};

const bound_functions = {
  "setlist" : {
    "create": null,
    "edit": null
  },
  "cardlist" : {
    "new": null,
    "go_back": null
  },
  "card": {
    "set_card": null,
    "go_back": null
  }
}

function attach_functions( interface, value ) {
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    if( value ) {
      let func_ref = functions[interface][button_name].bind(null,value);
      button_ref.addEventListener( 'click', func_ref );
      bound_functions[interface][button_name] = func_ref;
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
      button_ref.removeEventListener( 'click', bound_functions[interface][button_name] );
    }
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
