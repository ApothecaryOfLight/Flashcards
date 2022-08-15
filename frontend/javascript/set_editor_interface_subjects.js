function set_editor_interface_get_subjects( interface_state ) {
    const URL_params = "get_subjects_by_set/" + interface_state.set_editor_interface_state.set_id;
    const get_set_subjects = new Request(
        ip + URL_params
    );
    fetch( get_set_subjects )
    .then( json => json.json() )
    .then( parsed_object => {
        interface_state.set_editor_interface_state.all_subjects = parsed_object.all_subjects;
        interface_state.set_editor_interface_state.set_subjects = parsed_object.set_subjects[0];
        if( parsed_object.set_subjects.length == 0 ) {
            interface_state.set_editor_interface_state.set_subjects = [];
            set_editor_interface_populate_default_subjects( interface_state, 1 );
        }
        set_editor_interface_render_subjects( interface_state );
    });
}

function set_editor_interface_populate_default_subjects( interface_state, start_level ) {
    const subjects = interface_state.set_editor_interface_state.set_subjects;
    const avail_subjects = interface_state.set_editor_interface_state.all_subjects;
    if( start_level == 1 ) {
        subjects["1_id"] = avail_subjects[0][0].id;
        start_level++;
    }
    for( let index = start_level-1; index<4; index++ ) {
        const subject_id = index + 1 + "_id";
        let is_any_subject_avail = false;
        for( let avail_index = 0; avail_index<avail_subjects[index].length; avail_index++ ) {
            const parent_subject_id = index + "_id";
            const parent_id = subjects[parent_subject_id];
            if( avail_subjects[index][avail_index].parent_id == parent_id ) {
                subjects[subject_id] = avail_subjects[index][avail_index].id;
                is_any_subject_avail = true;
                break;
            }
        }
        if( !is_any_subject_avail ) {
            subjects[subject_id] = null;
        }
    }
}

function set_editor_interface_subjects_change_dropdown( interface_state, dropdown_element_name, level ) {
    const element_ref = document.getElementById( dropdown_element_name );
    const new_value = element_ref.value;
    const set_id = level + "_id";
    interface_state.set_editor_interface_state.set_subjects[set_id] = Number(new_value);
    set_editor_interface_populate_default_subjects( interface_state, level+1 )
    set_editor_interface_render_subjects( interface_state );
}

function set_editor_interface_render_dropdown( interface_state, dropdown_element_name, options, level, parent_value, value ) {
    const element_ref = document.getElementById(dropdown_element_name);
    while( element_ref.firstChild ) {
        element_ref.firstChild.remove();
    }
    options.forEach( (option) => {
        if( !parent_value && level == 1 ) {
            const new_option = document.createElement("option");
            new_option.innerText = option.name;
            new_option.value = option.id;
            element_ref.appendChild( new_option );
        } else {
            if( option.parent_id == parent_value ) {
                const new_option = document.createElement("option");
                new_option.innerText = option.name;
                new_option.value = option.id;
                element_ref.appendChild( new_option );
            }
        }
        if( value ) {
            element_ref.value = value;
        }
    });
    element_ref.onclick = set_editor_interface_subjects_change_dropdown.bind(
        null,
        interface_state,
        dropdown_element_name,
        level
    );
}

function set_editor_interface_render_subjects( interface_state ) {
    const all_subjects = interface_state.set_editor_interface_state.all_subjects;
    const set_subjects = interface_state.set_editor_interface_state.set_subjects;
    const set_id = interface_state.set_editor_interface_state.set_id;
    for( let i=0; i<4; i++ ) {
        const level = Number(i+1);
        const dropdown_name = level + "_subject_dropdown";
        const parent_set_id = i + "_id";
        const set_id = level + "_id";
        const parent_value = document.getElementById( i + "_subject_dropdown" )?.value;
        set_editor_interface_render_dropdown(
            interface_state,
            dropdown_name,
            all_subjects[i],
            level,
            set_subjects?.[parent_set_id] ?? parent_value,
            set_subjects?.[set_id]
        )
    }
}

function set_editor_interface_update_subjects( interface_state ) {
    let URL_params = "update_subjects/" + interface_state.set_editor_interface_state.set_id;
    for( let level = 1; level<5; level++ ) {
        const element_name = level + "_subject_dropdown";
        const element_ref = document.getElementById(element_name);
        const value = Number(element_ref.value);
        if( value != 0 ) {
            URL_params += "/" + Number(value);
        } else {
            URL_params += "/null";
        }
    }
    const update_subjects = new Request(
        ip + URL_params
    );
    fetch( update_subjects )
    .then( json => json.json() )
    .then( parsed_object => {
        //TODO: Implement error message for user.
    });
}