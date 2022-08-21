function set_editor_interface_get_subjects( interface_state ) {
    const URL_params = "get_subjects_by_set/" + interface_state.set_editor_interface_state.set_id;
    const get_set_subjects = new Request(
        ip + URL_params
    );
    fetch( get_set_subjects )
    .then( json => json.json() )
    .then( parsed_object => {
        interface_state.set_editor_interface_state.all_subjects = parsed_object.all_subjects;
        if( typeof(parsed_object.set_subjects[0]) === "undefined" ) {
            interface_state.set_editor_interface_state.set_subjects = [null,null,null,null];
        } else {
            interface_state.set_editor_interface_state.set_subjects = parsed_object.set_subjects[0];
        }
        format_all_sets( interface_state );
        set_editor_interface_populate_subjects( interface_state );
    });
}

function format_all_sets( interface_state ) {
    const new_all_subjects = [];
    const all_subjects = interface_state.set_editor_interface_state.all_subjects;
    all_subjects.forEach( (subject) => {
        if( typeof( new_all_subjects[subject.level] ) === "undefined" ) {
            new_all_subjects[subject.level] = [];
        };
        new_all_subjects[subject.level].push( subject );
    });
    interface_state.set_editor_interface_state.all_subjects = new_all_subjects;

    const curr_subjects = interface_state.set_editor_interface_state.set_subjects;
    const new_curr_subjects = [];
    for( let i=1; i<=Object.keys(curr_subjects).length-1; i++ ) {
        const subject_id_key = i+ "_id";
        new_curr_subjects[i] = curr_subjects[subject_id_key];
    }
    interface_state.set_editor_interface_state.set_subjects = new_curr_subjects;
}

function cleanDropdown( dropdown_name ) {
    const target_dropdown = document.getElementById(dropdown_name);
    while( target_dropdown.firstChild ) {
        target_dropdown.firstChild.remove();
    }
    target_dropdown.replaceWith( target_dropdown.cloneNode() );
}

function set_editor_interface_populate_subjects( interface_state ) {
    const all_subjects = interface_state.set_editor_interface_state.all_subjects;
    const curr_subjects = interface_state.set_editor_interface_state.set_subjects;
    all_subjects.forEach( (level_element, level_index) => {
        const target_dropdown_name = level_index + "_subject_dropdown";
        cleanDropdown( target_dropdown_name );
        const target_dropdown = document.getElementById(target_dropdown_name);
        target_dropdown.addEventListener( 'change', set_editor_interface_subject_change.bind( null, interface_state, target_dropdown_name, level_index ) );
        let valid_subject_id_for_level = null;
        if( level_index == 1 ) {
            level_element.forEach( (subject) => {
                const new_option = document.createElement("option");
                new_option.innerText = subject.name;
                new_option.value = subject.subject_id;
                target_dropdown.appendChild( new_option );
                if( valid_subject_id_for_level == null ) {
                    valid_subject_id_for_level = subject.subject_id;
                }
            });
        } else {
            level_element.forEach( (subject) => {
                const parent_level = level_index - 1;
                const old_dropdown_name = parent_level + "_subject_dropdown";
                const old_dropdown = document.getElementById( old_dropdown_name );
                if( old_dropdown.options.length > 0 ) {
                    const parent_id = old_dropdown.options[old_dropdown.selectedIndex].value;
                    if( subject.parent_id == parent_id ) {
                        const new_option = document.createElement("option");
                        new_option.innerText = subject.name;
                        new_option.value = subject.subject_id;
                        target_dropdown.appendChild( new_option );
                        if( valid_subject_id_for_level == null ) {
                            valid_subject_id_for_level = subject.subject_id;
                        }
                    }
                }
            });
        }
        if( curr_subjects.length != 0 ) {
            if( curr_subjects[level_index] == null ) {
                curr_subjects[level_index] = valid_subject_id_for_level;
            }
        } else {
            curr_subjects[level_index] = valid_subject_id_for_level;
        }
        target_dropdown.value = curr_subjects[level_index];
    })
}

function set_editor_interface_subject_change( interface_state, dropdown_element_name, level ) {
    const element_ref = document.getElementById( dropdown_element_name );
    const new_value = element_ref.value;
    interface_state.set_editor_interface_state.set_subjects[level] = Number(new_value);
    for( let i=level+1; i<=4; i++ ) {
        interface_state.set_editor_interface_state.set_subjects[i] = null;
    }
    set_editor_interface_populate_subjects( interface_state );
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