/*
Function to login.

inUsernameHash: A hash of the user's username.
*/
function login( inUsernameHash, interface_state ) {
  //Set the global login variables.
  interface_state.isLogged = true;
  interface_state.username_hash = inUsernameHash;

  //Close the login modal.
  close_modal();

  //Get references to the login elements.
  const login_element = document.getElementById("search_interface_login_element");
  const logout_element = document.getElementById("search_interface_logout_element");

  //Hide the login element.
  login_element.style.display = "none";

  //Display the logout element.
  logout_element.style.display = "flex";

  //Relaunch interface.
  launch_search_interface( interface_state );
}


/*
Function to attempt to create an account.
*/
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
}


/*
Function to logout.
*/
function logout( interface_state ) {
  //Get refernces to the login and logout elements.
  const login_element = document.getElementById("search_interface_login_element");
  const logout_element = document.getElementById("search_interface_logout_element");

  //Hide the logout element.
  logout_element.style.display = "none";

  //Display the login element.
  login_element.style.display = "flex";

  //Update the global login variable.
  interface_state.isLogged = false;
  interface_state.username_hash = "";

  //Relaunch interface.
  launch_search_interface( interface_state );
}


/*
Function to attempt to login.
*/
function attempt_login( interface_state ) {
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
        login( json.username_hash, interface_state );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      } else {
        prompt_failed_login( json.reason );
      }
    });
}


/*
Function that launches a modal upon a failed login.
*/
function prompt_failed_login( inFailureReason ) {
  //Construct the modal object.
  const options = {
    "Okay" : prompt_login
  };

  //Launch the modal.
  launch_modal( null, inFailureReason, options );
}


/*
Function that launches the login modal.
*/
function prompt_login( interface_state ) {
  //Create the modal object.
  const prompts = {
    "username_field" : {
      hint: "Enter Username Here",
      event: true,
      event_type: "keypress",
      func: switch_focus_to_password_field
    },
    "password_field" : {
      hint: "Enter Password Here",
      event: true,
      event_type: "keypress",
      func: submit_login_on_enter_press.bind(null,interface_state)
    }
  };
  const options = {
    "Cancel": close_modal,
    "Login" : attempt_login.bind( null, interface_state ),
    "Create Account" : attempt_create_account
  }

  //Launch the modal object.
  launch_modal( prompts, "Log In", options );
}


/*
Function to attach login/logout events to the login/logout buttons.
*/
function attach_login() {
  //Get references to the login/logout elements.
  const login_element = document.getElementById("search_interface_login_element");
  const logout_element = document.getElementById("search_interface_logout_element");

  //Hide the logout element.
  logout_element.style.display = "none";

  //Attach the logout/logout events to their respective buttons.
  login_element.addEventListener( 'click', (click_event) => {
    prompt_login();
  });
  logout_element.addEventListener( 'click', (click_event) => {
    logout();
  });
}


function switch_focus_to_password_field( keydown_event ) {
  if( keydown_event.key == "Enter" ) {
    document.getElementById("password_field").focus();
  }
}


function submit_login_on_enter_press( interface_state, keydown_event ) {
  if( keydown_event.key == "Enter" ) {
    attempt_login( interface_state );
  }
}