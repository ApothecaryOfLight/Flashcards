let isLogged = false;
const logged_obj = {
  isLogged: false,
  username_hash: ""
}


let scrollY = 0;


window.addEventListener( 'load', (loaded_event) => {
  launch_search_interface( true );
  attach_login();
});
