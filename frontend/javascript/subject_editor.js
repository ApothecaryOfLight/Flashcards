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

function get_hierarchy_depth( levels ) {
    if( typeof(levels.level_2) === "undefined" ) {
        return 1;
    } else if( typeof(levels.level_3) === "undefined" ) {
        return 2;
    } else if ( typeof(levels.level_4) === "undefined" ) {
        return 3;
    } else {
        return 4;
    }
}

function get_subjects( first, second, third ) {
    const URL_params = (first??1) + "/" + (second??-1) + "/" + (third??-1);
    const get_subjects_request = new Request(
        ip + 'get_subjects/' + URL_params
    );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( levels => {
        populate_dropdown( levels.level_2, "2_level_subject_dropdown", 2 );
        populate_dropdown( levels.level_3, "3_level_subject_dropdown", 3 );
        populate_dropdown( levels.level_4, "4_level_subject_dropdown", 4 );
        hide_input_fields_above( get_hierarchy_depth(levels) );
    });
}
function get_initial_subjects() {
    const get_subjects_request = new Request(
        ip + 'get_subjects/1/-1/-1'
    );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( levels => {
        populate_dropdown( levels.level_1, "1_level_subject_dropdown", 1 );
        populate_dropdown( levels.level_2, "2_level_subject_dropdown", 2 );
        populate_dropdown( levels.level_3, "3_level_subject_dropdown", 3 );
        populate_dropdown( levels.level_4, "4_level_subject_dropdown", 4 );
        hide_input_fields_above( get_hierarchy_depth(levels) );
    });
}

function option_change( level ) {
    const first_dropdown_ref = document.getElementById("1_level_subject_dropdown");
    const second_dropdown_ref =  document.getElementById("2_level_subject_dropdown");
    const third_dropdown_ref = document.getElementById("3_level_subject_dropdown");
    if( level == 1 ) {
        const first_dropdown_val = Number(first_dropdown_ref.value);
        get_subjects( first_dropdown_val, -1, -1 );
    } else if( level == 2 ) {
        const first_dropdown_val = Number(first_dropdown_ref.value);
        const second_dropdown_val = Number(second_dropdown_ref.value);
        get_subjects( first_dropdown_val, second_dropdown_val, -1 );
    } else if( level == 3 ) {
        const first_dropdown_val = Number(first_dropdown_ref.value);
        const second_dropdown_val = Number(second_dropdown_ref.value);
        const third_dropdown_val = Number(third_dropdown_ref.value);
        get_subjects( first_dropdown_val, second_dropdown_val, third_dropdown_val );
    }
}

function populate_dropdown( subjects, target_dropdown, level ) {
    const select_element = document.getElementById(target_dropdown);
    while( select_element.firstChild ) {
        select_element.firstChild.remove();
    }
    if( typeof(subjects) === "undefined" ) {
        return;
    }
    subjects.forEach( (subject) => {
        const option = document.createElement("option");
        option.value = subject.id;
        option.innerText = subject.name;
        select_element.appendChild( option );
    });
    select_element.addEventListener( 'change', option_change.bind(null,level) );
}

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
        url += parent_id;
    } else {
        url += "-1";
    }

    const add_subject_request = new Request(
        ip + url
    );
    fetch( add_subject_request )
    .then( json => json.json() )
    .then( json => {
        option_change( level );
    });
}

function attach_add_subject_events() {
    for( i=1; i<5; i++ ) {
        const button_name = "add_" + i + "_level_subject_button";
        const button_ref = document.getElementById(button_name);
        button_ref.addEventListener( "click", add_subject.bind(null,i));
    }
}

function detach_add_subject_events() {
    for( i=1; i<5; i++ ) {
        const button_name = "add_" + i + "_level_subject_button";
        const button_ref = document.getElementById(button_name);
        button_ref.replaceWith( button_ref.cloneNode(true) );
    }
}