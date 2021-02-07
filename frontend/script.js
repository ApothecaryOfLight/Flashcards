

function getSetList() {
  const test = new Request(
    'http://52.36.124.150:3000/setlist',
    { method: 'GET' }
  );
  fetch( test )
    .then( obj => obj.json())
    .then( obj => {
      console.dir( obj );
      renderSetList( obj );
    });
}

function getSet( inName, inSetID ) {
  console.log( "Requesting " + inName + " @ " + inSetID );
  launch_cardlist_interface( inSetID );
}

function renderSetList( setList ) {
  const setlist_dom_obj = document.getElementById("setlist_interface_set_list");
  let dom_string = "";
  setList.forEach( set => {
    dom_string += "<div class=\'setlist_item\'" +
      " onclick=\"getSet(\'" + set.name + "\'," + set.set_id + ")\">" + set.name + "</div>";
  });
  setlist_dom_obj.innerHTML = dom_string;
}



window.addEventListener( 'load', (loaded_event) => {
  set_interface( "setlist" );
  getSetList();
});


/*
Card interface
*/
let card_id;
function launch_card_interface( inCardID, inSetID, isNew ) {
  set_interface( "card" );
  console.log( "card_id: " + inCardID + " / " + "inSetID: " + inSetID );
  card_id = inCardID;
  set_id = inSetID;
  if( isNew == false ) {
    get_card( inCardID );
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
        console.dir( json.card );
        question_text.value = json.card.question;
        answer_text.value = json.card.answer;
      }
    });
}

function card_interface_set_card() {
  console.log( "Set card." );
  const card_q_handle = document.getElementById("card_interface_q_text");
  const card_a_handle = document.getElementById("card_interface_a_text");
  const question_text = card_q_handle.value;
  const answer_text = card_a_handle.value;
  const json_obj = {
    "question": question_text,
    "answer": answer_text,
    "card_id": card_id,
    "set_id": set_id
  };

  const new_card = new Request(
    'http://52.36.124.150:3000/add_card',
    {
      method: 'POST',
      body: JSON.stringify({
        "set_id" :set_id,
        "card_id": card_id,
        "question": question_text,
        "answer": answer_text
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  console.dir( new_card );
  fetch( new_card )
    .then( json => json.json() )
    .then( json => {
      console.dir( json );
      if( json.result == "success" ) {
        launch_cardlist_interface( set_id );
      }
    });
}

function card_interface_go_back() {
  launch_cardlist_interface( set_id );
}

/*
Cardlist interface
*/
let set_name = "";
let set_id = "";
function launch_cardlist_interface( inSetID ) {
  set_interface( "cardlist" );
//TODO: Loading modal until reuqest if fulfilled.
  const set_name_element = document.getElementById("cardlist_interface_set_name");

  const get_cardlist = new Request(
    'http://52.36.124.150:3000/get_cardlist/' + inSetID
  );
  fetch( get_cardlist )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        json.cards.forEach( card => {
          console.log( card.answer );
        });
        set_name = json.set_name.name;
        set_name_element.innerHTML = json.set_name.name;
        cardlist_interface_populate_list( inSetID, json.cards );
      }
    });
  set_id = inSetID;
}
function cardlist_interface_populate_list( inSetID, inCards ) {
  const cardlist_interface_card_list = document.getElementById("cardlist_interface_card_list" );
  let dom = "";
  inCards.forEach( card => {
    dom += "<div class=\"card_element\" " +
      "onclick=\"launch_card_interface(" + card.card_id + ", " + inSetID + ", false)\"" +
      ">" +
      card.question + "/" + card.answer
      "</div>";
  });
  cardlist_interface_card_list.innerHTML = dom;
}
function cardlist_interface_new_button() {
  console.log( "Creating card." );
  const new_card = new Request(
    'http://52.36.124.150:3000/new_card',
    {
      method: 'POST'
    }
  );
  fetch( new_card )
    .then( json => json.json() )
    .then( json => {
      console.dir( json );
      if( json.result == "success" ) {
        launch_card_interface( json.card_id, set_id, true );
      }
    });
}
function cardlist_interface_edit_button() {
  
}
function cardlist_interface_toggle_questions_button() {
  
}
function cardlist_interface_toggle_answers_button() {
  
}
function cardlist_interface_go_back() {
  launch_setlist_interface();
}

/*
Setlist interface
*/
function launch_setlist_interface() {
  set_interface( "setlist" );
}

function setlist_interface_create() {
  console.log( "setlist_interface_create" );
  const setname_input = document.getElementById( 'setlist_interface_set_name' );
  const new_set_name = setname_input.value;
  if( new_set_name != "" ) {
    create_set( new_set_name );
  }
}

function create_set( set_name ) {
  console.log( "Creating set " + set_name );
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
  console.dir( new_set );
  fetch( new_set )
    .then( json => json.json() )
    .then( json => {
      console.dir( json );
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
  "set_card" : card_interface_set_card,
  "go_back": card_interface_go_back
}
};

function attach_functions( interface ) {
//  console.log( "Attaching functions for interface " + interface );
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    button_ref.addEventListener( 'click', functions[interface][button_name] );
  };
}

function detach_functions( interface ) {
//  console.log( "Detaching functions for interface " + interface );
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    button_ref.removeEventListener( 'click', functions[interface][button_name] );
  };
}

function set_interface( interface ) {
//  console.log( "Setting interface to " + interface );
  interfaces.forEach( interface_base_name => {
    const interface_name = interface_base_name + "_interface";
    const interface_handle = document.getElementById( interface_name );
    if( interface == interface_base_name ) {
      interface_handle.style.display = "flex";
      attach_functions( interface );
    } else {
      interface_handle.style.display = "none";
      detach_functions( interface_base_name );
    }
  });
}
