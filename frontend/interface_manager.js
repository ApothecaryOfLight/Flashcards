/*
Interface switching code.
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
    "flip_card": []
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
