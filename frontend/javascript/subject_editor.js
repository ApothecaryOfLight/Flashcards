function hide_input_fields_above( level ) {
    for( let i=1; i<5; i++ ) {
        const input_field_name = i + "_level_subject_input_field";
        const input_field_ref = document.getElementById(input_field_name);
        if( i <= level ) {
            input_field_ref.style["display"] = "inline-block";
        } else {
            input_field_ref.style["display"] = "none";
        }
    }
}

/*function get_hierarchy_depth( levels ) {
    for( level in levels ) {
        if( levels[level].length == 0 ) {
            levels[level] = undefined;
        }
    }
    if( typeof(levels.level_2) === "undefined" ) {
        return 2;
    } else if( typeof(levels.level_3) === "undefined" ) {
        return 3;
    } else if( typeof(levels.level_4) === "undefined" ) {
        return 4;
    }
}

function get_subjects( subject_values, level ) {
    console.log( "Getting subjects" );
    const URL_params = (subject_values[0]??1) + "/" + (subject_values[1]??-1) + "/" + (subject_values[2]??-1);
    const get_subjects_request = new Request(
        ip + 'get_subjects/' + URL_params
    );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( levels => {
        console.dir( levels );
        if( levels.result == false ) {
            console.error( "No subjects found. Has database been populated?" );
            return;
        }
        level = (level??1);
        if( level == 1 ) {
            level = 2;
        }
        for( i=level; i<=4; i++ ) {
            const key = "level_" + i;
            const element = i + "_level_subject_dropdown";
            populate_dropdown( levels[key], element, i, subject_values[i-1] );
        }
        hide_input_fields_above( get_hierarchy_depth(levels) );
    });
}

function get_initial_subjects() {
    const get_subjects_request = new Request(
        ip + 'get_subjects/-1/-1/-1'
    );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( levels => {
        console.dir( levels );
        populate_dropdowns( levels );
    });
}

function option_change( level ) {
    const first_dropdown_ref = document.getElementById("1_level_subject_dropdown");
    const second_dropdown_ref =  document.getElementById("2_level_subject_dropdown");
    const third_dropdown_ref = document.getElementById("3_level_subject_dropdown");
    if( level == 1 ) {
        const first_dropdown_val = Number(first_dropdown_ref.value);
        get_subjects( [first_dropdown_val, -1, -1], 1 );
    } else if( level == 2 ) {
        const first_dropdown_val = Number(first_dropdown_ref.value);
        const second_dropdown_val = Number(second_dropdown_ref.value);
        get_subjects( [first_dropdown_val, second_dropdown_val, -1], 2 );
    } else if( level == 3 ) {
        const first_dropdown_val = Number(first_dropdown_ref.value);
        const second_dropdown_val = Number(second_dropdown_ref.value);
        const third_dropdown_val = Number(third_dropdown_ref.value);
        get_subjects( [first_dropdown_val, second_dropdown_val, third_dropdown_val], 3 );
    }
}

function populate_dropdown( subjects, target_dropdown, level, current_value ) {
    let select_element = document.getElementById(target_dropdown);
    while( select_element.firstChild ) {
        select_element.firstChild.remove();
    }
    if( typeof(subjects) === "undefined" ) {
        return;
    }
    select_element.replaceWith( select_element.cloneNode(true) );
    select_element = document.getElementById(target_dropdown);
    subjects.forEach( (subject) => {
        const option = document.createElement("option");
        option.value = subject.id;
        option.innerText = subject.name;
        select_element.appendChild( option );
    });
    select_element.addEventListener( 'change', option_change.bind(null,level) );
    if( current_value && current_value != -1 ) {
        select_element.value = current_value;
    }
}*/

function add_subject( level ) {
    const input_field_name = level + "_level_subject_input_field";
    const input_field_ref = document.getElementById(input_field_name);
    const input_field_value = input_field_ref.value;
    input_field_ref.value = "";
    let url = "add_subject/" + level + "/" + input_field_value + "/";

    if( level > 1 ) {
        const parent_dropdown_name = (level-1) + "_level_subject_dropdown";
        const parent_ref = document.getElementById(parent_dropdown_name);
        const parent_value = parent_ref.value;
        url += parent_value;
    } else {
        url += "-1";
    }

    const add_subject_request = new Request(
        ip + url
    );
    fetch( add_subject_request )
    .then( json => json.json() )
    .then( json => {
        //option_change( level );
        console.dir( json );
    });
}


function delete_subject( level ) {
    const dropdown_name = level + "_level_subject_dropdown";
    const dropdown_ref = document.getElementById(dropdown_name);
    const dropdown_field_value = dropdown_ref.value;

    let url = "delete_subject/" + level + "/" + dropdown_field_value;

    const add_subject_request = new Request(
        ip + url
    );
    fetch( add_subject_request )
    .then( json => json.json() )
    .then( json => {
        //option_change( level );
        console.dir( json );
    });
}


function attach_add_subject_events() {
    for( i=1; i<5; i++ ) {
        const add_button_name = "add_" + i + "_level_subject_button";
        const add_button_ref = document.getElementById(add_button_name);
        add_button_ref.addEventListener( "click", add_subject.bind(null,i));
        
        const delete_button_name = "delete_" + i + "_level_subject_button";
        const delete_button_ref = document.getElementById(delete_button_name);
        delete_button_ref.addEventListener( "click", delete_subject.bind(null,i));
    }
}

function detach_add_subject_events() {
    for( i=1; i<5; i++ ) {
        const add_button_name = "add_" + i + "_level_subject_button";
        const add_button_ref = document.getElementById(add_button_name);
        add_button_ref.replaceWith( add_button_ref.cloneNode(true) );

        const delete_button_name = "delete_" + i + "_level_subject_button";
        const delete_button_ref = document.getElementById(delete_button_name);
        delete_button_ref.replaceWith( delete_button_ref.cloneNode(true) );
    }
}






function get_subjects( subject_values, level ) {
    let URL_params = "";
    for( let i=1; i<=level; i++ ) {
        URL_params += (subject_values[i]??-1) + "/";
    }
    for( let i=level+1; i<=3; i++ ) {
        URL_params += "-1/";
    }
    for( let i=level+1; i<=4; i++ ) {
        subject_values[i] = null;
    }

    const full_url = ip + 'get_subjects/' + URL_params;
    const get_subjects_request = new Request( full_url );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( levels => {
        console.dir( levels );
        depopulate_dropdowns( level );
        populate_dropdowns( levels, subject_values );
    });
}

function subject_selection_event( level ) {
    const subject_ids = [];
    for( let i=1; i<=4; i++ ) {
        const dropdown_name = i + "_level_subject_dropdown";
        const dropdown_ref = document.getElementById(dropdown_name);
        subject_ids[i] = dropdown_ref.value;
    }
    get_subjects( subject_ids, level );
}

function does_dropdown_have_subject( options, subject_id ) {
    for( let i=0; i<options.length; i++ ) {
        if( options[i].value == subject_id ) {
            return true;
        }
    }
    return false;
}

function add_subject_to_dropdown( subject_name, subject_id, level ) {
    const dropdown_name = level + "_level_subject_dropdown";
    const dropdown_ref = document.getElementById(dropdown_name);

    const options = Object.values( dropdown_ref.options );
    if( !does_dropdown_have_subject( options, subject_id) ) {
        const option = document.createElement("option");
        option.value = subject_id;
        option.innerText = subject_name;
        dropdown_ref.appendChild( option );
    }

    return dropdown_ref.value;
}

function depopulate_dropdowns( level ) {
    for( let i=level+1; i<=4; i++ ) {
        const dropdown_name = i + "_level_subject_dropdown";
        const dropdown_ref = document.getElementById(dropdown_name);
        while( dropdown_ref.firstChild ) {
            dropdown_ref.firstChild.remove();
        }
    }
}

function set_dropdown( level, value ) {
    const dropdown_name = level + "_level_subject_dropdown";
    const dropdown_ref = document.getElementById(dropdown_name);
    dropdown_ref.value = value;
}

function populate_dropdowns( dropdown_data, existing_selections ) {
    dropdown_data.forEach( (subject) => {
        if( subject.level_1_subject_id ) {
            const level_1_id = add_subject_to_dropdown( subject.level_1_subject_name, subject.level_1_subject_id, 1 );
            if( subject.level_2_subject_id && subject.level_1_subject_id == level_1_id ) {
                const level_2_id = add_subject_to_dropdown( subject.level_2_subject_name, subject.level_2_subject_id, 2 );
                if( subject.level_3_subject_id && subject.level_2_subject_id == level_2_id ) {
                    const level_3_id = add_subject_to_dropdown( subject.level_3_subject_name, subject.level_3_subject_id, 3 );
                    if( subject.level_4_subject_id && subject.level_3_subject_id == level_3_id ) {
                        add_subject_to_dropdown( subject.level_4_subject_name, subject.level_4_subject_id, 4 );
                    }
                }
            }
        }
    });
    if( existing_selections ) {
        for( let i=1; i<=4; i++ ) {
            if( existing_selections[i] ) {
                set_dropdown( i, existing_selections[i] );
            }
        }
    }
    display_new_fields();
}

function attach_dropdown_event_listeners() {
    for( let i=1; i<=4; i++ ) {
        const dropdown_name = i + "_level_subject_dropdown";
        const dropdown_ref = document.getElementById(dropdown_name);
        dropdown_ref.addEventListener( 'change', subject_selection_event.bind( null, i ) );
    }
}

function display_new_fields() {
    let lowest_null = 4;
    for( let i=1; i<=4; i++ ) {
        const dropdown_name = i + "_level_subject_dropdown";
        const dropdown_ref = document.getElementById(dropdown_name);
        if( dropdown_ref.options.length == 0 ) {
            lowest_null = i;
            break;
        }
    }
    for( let i=1; i<=lowest_null; i++ ) {
        const field_name = i + "_level_subject_input_field";
        const field_ref = document.getElementById(field_name);
        field_ref.style["display"] = "inline-block";
    }
    for( let i=lowest_null+1; i<=4; i++ ) {
        const field_name = i + "_level_subject_input_field";
        const field_ref = document.getElementById(field_name);
        field_ref.style["display"] = "none";
    }
}