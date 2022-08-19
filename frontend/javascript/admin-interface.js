"use strict";

/*
Function to switch between interfaces.
target_interface_id: The name of the interface to display.
*/
function switch_interface( target_interface_id ) {
    //Create an array of all interface names.
    const interfaces = [
        "error-log-container",
        "event-log-container",
        "subject_editor_container",
        "search_index_container"
    ];

    detach_add_subject_events();

    //Iterate through each interface name.
    interfaces.forEach( (interface_name) => {
        const interface_ref = document.getElementById(interface_name);
        //If this interface in the array is the target, show it ("block").
        //Otherwise, hide it ("none").
        if( interface_name == target_interface_id ) {
            interface_ref.style["display"] = "block";
        } else {
            interface_ref.style["display"] = "none";
        }
    })
}

/*
This attaches an anonymous function to the window onload event.
The anonymous function then attaches click event listeners to the event and error
menu buttons, which show their respective log and hide the other, then fetch the logs
from the server.
*/
window.onload = () => {
    console.log( "Loaded!" );

    //Get a reference to the get error log menu button.
    const get_error_log_button = document.getElementById("menu_button_error_log");
    //Attach a click event listener to the get error log menu button.
    get_error_log_button.addEventListener( "click", (event) => {
        switch_interface( "error-log-container" );

        //Get the error log from the server.
        get_error_log();
    });

    //Get a reference to the get event log menu button.
    const get_event_log_button = document.getElementById("menu_button_event_log");
    //Attach a click event listener to the get event log menu button.
    get_event_log_button.addEventListener( "click", (event) => {
        switch_interface( "event-log-container" );
        
        //Get the event log from the server.
        get_event_log();
    });
    
    //Get a reference to the get subject editor menu button.
    const get_subject_editor_button = document.getElementById("menu_button_subject_editor");
    //Attach a click event listener to the get subject editor menu button.
    get_subject_editor_button.addEventListener( "click", (event) => {
        switch_interface( "subject_editor_container" );
        
        //Get the subjects from the server.
        attach_dropdown_event_listeners();
        //get_initial_subjects();
        get_subjects( [null,null,null,null], 1 );
        attach_add_subject_events();
    });
    
    //Get a reference to the search interface menu button.
    const get_search_index_button = document.getElementById("menu_button_search_index");
    //Attach a click event listener to the get subject editor menu button.
    get_search_index_button.addEventListener( "click", (event) => {
        switch_interface( "search_index_container" );
    });
    const rebuild_search_index_button_ref = document.getElementById("rebuild_search_index");
    rebuild_search_index_button_ref.addEventListener( 'click', (click_event) => {
        const rebuild_search_index = new Request(
            ip + "rebuild_search_index"
        );
        fetch( rebuild_search_index )
        .then( json => json.json() )
        .then( parsed_object => {
            console.dir( parsed_object );
        });
    });
}