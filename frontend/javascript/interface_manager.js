/*
Interface switching code.
*/


/*
Function to attach an interface's functions to it.

interface: Interface to attach functions to.

value: Value to bind to the interface's functions.
*/
function attach_functions( interface, interface_state ) {
  for( const button_name in interface_state.functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    if( interface_state ) {
      const func_ref = interface_state.functions[interface][button_name].func.bind(null,interface_state);
      const event_type = interface_state.functions[interface][button_name].event_type;
      button_ref.addEventListener( event_type, func_ref );
      interface_state.bound_functions[interface][button_name].push( func_ref );
    } else {
      button_ref.addEventListener( event_type, interface_state.functions[interface][button_name] );
    }
  };
}


/*
Function to detach an interface's functions from it.

interface: Interface to detach all functions from.
*/
function detach_functions( interface, interface_state ) {
  for( const button_name in interface_state.functions[interface] ) {
    const button_ref = document.getElementById( interface + "_interface_" + button_name );
    const func_ref = interface_state.functions[interface][button_name].func;
    const event_type = interface_state.functions[interface][button_name].event_type;
    button_ref.removeEventListener( event_type, func_ref );
    if( interface_state.bound_functions[interface][button_name] ) {
      interface_state.bound_functions[interface][button_name].forEach( func => {
        button_ref.removeEventListener( event_type, func );
      });
    }
  };
}


/*
Function to switch between interfaces.

interface: Target interface to display.

interface_state: The commonly held interface state to bind to all the interface's functions.
*/
function set_interface( target_interface_name, interface_state ) {
  const body = document.body;
  interface_state.interface_list.forEach( interface_base_name => {
    const interface_name = interface_base_name + "_interface";
    const interface_handle = document.getElementById( interface_name );
    detach_functions( interface_base_name, interface_state );
    if( target_interface_name == interface_base_name ) {
      if( interface_base_name == "search" ) {
        interface_handle.style.display = "grid";
        body.style['overflow-y'] = "auto";
      } else {
        interface_handle.style.display = "flex";
        body.style['overflow-y'] = "hidden";
      }
      attach_functions( target_interface_name, interface_state );
    } else {
      interface_handle.style.display = "none";
    }
  });
}


/*
Function to create a storage object in the interface state to retain references to
event listeners so that they can be attached and removed when interfaces are switched.
*/
function create_bound_function_storage( interface_state ) {
  interface_state.bound_functions = {};
  interface_state.interface_list.forEach( (interface_name) => {
    interface_state.bound_functions[interface_name] = {};
    for( const button_name in interface_state.functions[interface_name] ) {
      interface_state.bound_functions[interface_name][button_name] = [];
    }
  });
}