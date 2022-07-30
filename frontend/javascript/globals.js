window.addEventListener( 'load', (loaded_event) => {
  const interface_state = {
    isLogged: false,
    username_hash: "",
    doSearch: false,
    search_interface_state: {
      curr_page: 0,
      max_pages: 1,
      search_type: "set",
      scrollY: 0
    },
    set_editor_interface_state: {
      set_id: null
    },
    card_editor_interface_state: {
      set_id: null,
      card_id: null,
      prev_interface: null,
      isNew: false
    },
    runset_interface_state: {
      set_id: null,
      card_sets_obj: {
        curr_set : 0,
        sets : [],
        set_images: []
      }
    }
  }
  launch_search_interface( interface_state );
});
