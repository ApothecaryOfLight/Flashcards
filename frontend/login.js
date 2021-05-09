/*
==7.0== Logging in/out code
*/
function login( inUsernameHash ) {
  logged_obj.isLogged = true;
  logged_obj.username_hash = inUsernameHash;

  close_modal();
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  login_element.style.display = "none";
  logout_element.style.display = "flex";
  //)Relaunch interface.
  if( curr_interface == "search" ) {
    launch_search_interface();
  }
}

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

  //)Relaunch interface
}

function logout() {
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  logout_element.style.display = "none";
  login_element.style.display = "flex";
  //)Relaunch interface.
  logged_obj.isLogged = false;
  if( curr_interface == "search" ) {
    launch_search_interface();
  }
}

function attempt_login() {
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
        login( json.username_hash );
      } else if( json.result == "error" ) {
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      } else {
        prompt_failed_login( json.reason );
      }
    });

  //3) If refused, prompt failure message, fallback into login prompt.
}

function prompt_failed_login( inFailureReason ) {
  const options = {
    "Okay" : prompt_login
  };
  launch_modal( null, inFailureReason, options );
}

function prompt_login() {
  //1) Launch login prompt.
  const prompts = {
    "username_field" : "Enter Username Here",
    "password_field" : "Enter Password Here"
  };
  const options = {
    "Cancel": close_modal,
    "Login" : attempt_login,
    "Create Account" : attempt_create_account
  }
  launch_modal( prompts, "Log In", options );
}

function attach_login() {
  const login_element = document.getElementById("login_element");
  const logout_element = document.getElementById("logout_element");
  logout_element.style.display = "none";
  login_element.addEventListener( 'click', (click_event) => {
    prompt_login();
  });
  logout_element.addEventListener( 'click', (click_evnet) => {
    logout();
  });
}
