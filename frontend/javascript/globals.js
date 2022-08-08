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
    },
    interface_list: ["search", "set_editor", "card_editor", "runset"],
    functions: functions = {
      "search" : {
        "set_name_create": {
          func: search_interface_set_create, event_type: 'click'
        },
        "add_search_tag_button": {
          func: add_search_term_button, event_type: 'click'
        },
        "switch_list_type": {
          func: switch_list_type, event_type: 'click'
        },
        "create_temp_set_button": {
          func: create_temp_set_button, event_type: 'click'
        },
        "login_element": {
          func: prompt_login, event_type: 'click'
        },
        "logout_element": {
          func: logout, event_type: 'click'
        },
        "set_name": {
          func: add_search_term_on_enter, event_type: 'keydown'
        }
      },
      "set_editor" : {
        "new": {
          func: set_editor_interface_new_button, event_type: 'click'
        },
        "go_back": {
          func: set_editor_interface_go_back, event_type: 'click'
        },
        "add_tag_button": {
          func: set_editor_interface_add_tag_button, event_type: 'click'
        },
        "tags_field": {
          func: set_editor_interface_add_tag_on_enter_keypress, event_type: 'keydown'
        },
        "update_subjects": {
          func: set_editor_interface_update_subjects, event_type: 'click'
        }
      },
      "card_editor": {
        "set_card": { func: card_editor_interface_set_card, event_type: 'click'
        },
        "go_back": {
          func: card_editor_interface_go_back, event_type: 'click'
        },
        "add_tag_button": {
          func: card_editor_interface_add_tag_button, event_type: 'click'
        },
        "pictoral_question_add_button": {
          func: card_editor_interface_pictoral_question_add_button, event_type: 'click'
        },
        "tags_field": {
          func: card_editor_interface_add_tag_on_enter_keypress, event_type: 'keydown'
        }
      },
      "runset": {
        "go_back": {
          func: runset_interface_go_back, event_type: 'click'
        },
        "missed": {
          func: runset_interface_missed, event_type: 'click'
        },
        "correct": {
          func: runset_interface_correct, event_type: 'click'
        },
        "flip_card": {
          func: runset_interface_flip_card, event_type: 'click'
        }
      }
    }
  }
  create_bound_function_storage( interface_state );
  launch_search_interface( interface_state );
});
