function render_subject_tags( interface_state, subject_tags, level, parent_id ) {
    let up_button = document.getElementById("subject_tab_bar_up_button");
    if( level == 1 ) {
        up_button.style["display"] = "none";
    } else {
        up_button.style["display"] = "block";
        up_button.replaceWith( up_button.cloneNode(true) );
        up_button = document.getElementById("subject_tab_bar_up_button");
        up_button.addEventListener(
            'click',
            get_subject_tags_above.bind( null, interface_state, level, parent_id )
        );
    }
    const subject_tab_container = document.getElementById("subject_tab_container");
    while( subject_tab_container.firstChild ) {
        subject_tab_container.firstChild.remove();
    }
    subject_tags.forEach( (subject_tag) => {
        const new_subject_tag = document.createElement("div");
        new_subject_tag.classList = "subject_tab";
        new_subject_tag.innerText = subject_tag.name;
        //if( level < 4 ) {
            new_subject_tag.onclick = () => {
                get_subject_tags( interface_state, level+1, subject_tag.subject_id );
            }
        /*} else if( level == 4 ) {
            new_subject_tag.onclick = () => {
                run_search_at_final_granularity( interface_state, level, subject_tag.subject_id );
            }
        }*/
        subject_tab_container.appendChild( new_subject_tag );
    });
}

function run_search_at_final_granularity( interface_state, level, parent_id ) {
    interface_state.search_interface_state.subjects.levels[3] = parent_id;
    interface_state.search_interface_state.subjects.current_level = 5;

    search_interface_run_search( interface_state );
}

function get_subject_tags( interface_state, level, parent_id ) {
    const URL_params = "get_subjects_by_level/" + level + "/" + (parent_id??-1);
    const get_subjects_tags = new Request(
        ip + URL_params
    );
    fetch( get_subjects_tags )
    .then( json => json.json() )
    .then( parsed_object => {
        interface_state.search_interface_state.subjects.current_level = level;
        if( level > 1 ) {
            interface_state.search_interface_state.subjects.levels[level-2] = parent_id;
        }
        interface_state.search_interface_state.scrollY = 0;
        search_interface_run_search( interface_state );
        render_subject_tags( interface_state, parsed_object.search_tags, level, parent_id );
    });
}

function get_subject_tags_above( interface_state, level, child_id ) {
    const level_above = Number(level) - 1;
    const parent_id = interface_state.search_interface_state.subjects.levels[level_above-2]??-1;
    const URL_params = "get_subjects_by_level/" + level_above + "/" + parent_id;
    const get_subjects_tags = new Request(
        ip + URL_params
    );
    fetch( get_subjects_tags )
    .then( json => json.json() )
    .then( parsed_object => {
        //interface_state.search_interface_state.subjects.levels[level] = null;
        interface_state.search_interface_state.subjects.current_level--;
        if( level_above == 1 ) {
            interface_state.search_interface_state.subjects.levels[0] = null;
        }
        interface_state.search_interface_state.scrollY = 0;
        search_interface_run_search( interface_state );
        render_subject_tags( interface_state, parsed_object.search_tags, level_above, parsed_object.parent_id );
    });
}