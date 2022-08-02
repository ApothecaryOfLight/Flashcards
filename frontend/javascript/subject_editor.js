function get_subjects( first, second, third ) {
    const URL_params = (first??1) + "/" + (second??-1) + "/" + (third??-1);
    const get_subjects_request = new Request(
        ip + 'get_subjects/' + URL_params
    );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( json => {
        populate_dropdown( json.second_level, "second_level_subject_dropdown", 2 );
        populate_dropdown( json.third_level, "third_level_subject_dropdown", 3 );
        populate_dropdown( json.fourth_level, "fourth_level_subject_dropdown", 4 );
    });
}
function get_initial_subjects() {
    const get_subjects_request = new Request(
        ip + 'get_subjects/1/-1/-1'
    );
    fetch( get_subjects_request )
    .then( json => json.json() )
    .then( json => {
        populate_dropdown( json.first_level, "first_level_subject_dropdown", 1 );
        populate_dropdown( json.second_level, "second_level_subject_dropdown", 2 );
        populate_dropdown( json.third_level, "third_level_subject_dropdown", 3 );
        populate_dropdown( json.fourth_level, "fourth_level_subject_dropdown", 4 );
    });
}

function option_change( level ) {
    const first_dropdown_ref = document.getElementById("first_level_subject_dropdown");
    const second_dropdown_ref =  document.getElementById("second_level_subject_dropdown");
    const third_dropdown_ref = document.getElementById("third_level_subject_dropdown");
    if( level == 1 ) {
        const first_dropdown_val = first_dropdown_ref.value;
        get_subjects( first_dropdown_val, -1, -1 );
    } else if( level == 2 ) {
        const first_dropdown_val = first_dropdown_ref.value;
        const second_dropdown_val = second_dropdown_ref.value;
        get_subjects( first_dropdown_val, second_dropdown_val, -1 );
    } else if( level == 3 ) {
        const first_dropdown_val = first_dropdown_ref.value;
        const second_dropdown_val = second_dropdown_ref.value;
        const third_dropdown_val = third_dropdown_ref.value;
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