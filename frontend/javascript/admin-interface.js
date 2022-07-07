"use strict";

/*
Function to switch between interfaces.
target_interface_id: The name of the interface to display.
*/
function switch_interface( target_interface_id ) {
    //Create an array of all interface names.
    const interfaces = [
        "error-log-container",
        "event-log-container"
    ];

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
}