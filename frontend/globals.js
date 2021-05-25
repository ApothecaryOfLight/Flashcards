const card_tags = [];
const set_data = {};
const set_editor_tags = [];
let list_type = "set";
const search_terms = [];
let modal_buttons_storage = {};
let curr_interface = "";
let isLogged = false;
const logged_obj = {
  isLogged: false,
  username_hash: ""
}
let scrollY = 0;
const split_buttons = [];
const merge_buttons = [];
const go_to_set_buttons = [];

window.addEventListener( 'load', (loaded_event) => {
  launch_search_interface( true );
  attach_login();
});
