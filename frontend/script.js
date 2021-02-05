

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
  launch_cardlist_interface( inName, inSetID );
}

function renderSetList( setList ) {
  const setlist_dom_obj = document.getElementById("setlist_interface_set_list");
  let dom_string = "";
  setList.forEach( set => {
    dom_string += "<div class=\'setlist_item\'" +
      " onclick=\"getSet(\'" + set.name + "\'," + set.set_id + ")\">" + set.name + "</div>";
  });
console.log( dom_string );
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
function launch_card_interface( inCardID, inSetID ) {
  set_interface( "card" );
console.log( "card_id: " + inCardID + " / " + "inSetID: " + inSetID );
  card_id = inCardID;
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
  console.dir( json_obj );
}

/*
Cardlist interface
*/
let set_name = "";
let set_id = "";
function launch_cardlist_interface( inSetName, inSetID ) {
  set_interface( "cardlist" );
  const set_name_element = document.getElementById("cardlist_interface_set_name");
  set_name_element.innerHTML = inSetName;
  set_name = inSetName;
  set_id = inSetID;
}
function cardlist_interface_new_button() {
  console.log( "Creating card." );
  const new_card = new Request(
    'http://52.36.124.150:3000/new_card',
    {
      method: 'POST'
    }
  );
  //console.dir( new_set );
  fetch( new_card )
    .then( json => json.json() )
    .then( json => {
      console.dir( json );
      if( json.result == "success" ) {
        launch_card_interface( json.card_id, set_id );
      }
    });
}
function cardlist_interface_edit_button() {
  
}
function cardlist_interface_toggle_questions_button() {
  
}
function cardlist_interface_toggle_answers_button() {
  
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
        launch_cardlist_interface( json.set_name, json.set_id );
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
  "new": cardlist_interface_new_button
},
"card": {
  "set_card" : card_interface_set_card
}
};

function attach_functions( interface ) {
  console.log( "Attaching functions for interface " + interface );
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    button_ref.addEventListener( 'click', functions[interface][button_name] );
  };
}

function detach_functions( interface ) {
  console.log( "Detaching functions for interface " + interface );
  for( const button_name in functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    button_ref.removeEventListener( 'click', functions[interface][button_name] );
  };
}

function set_interface( interface ) {
  console.log( "Setting interface to " + interface );
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
