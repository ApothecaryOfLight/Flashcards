
//Runset data
const set_data = {};

//
const card_tags = [];
const set_editor_tags = [];

const search_terms = [];

let modal_buttons_storage = {};

let curr_interface = "";
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
