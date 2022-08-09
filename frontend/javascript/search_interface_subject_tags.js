function render_subject_tags( subject_tags, level, parent_id ) {
    let up_button = document.getElementById("subject_tab_bar_up_button");
    if( level == 1 ) {
        up_button.style["display"] = "none";
    } else {
        up_button.style["display"] = "block";
        up_button.replaceWith( up_button.cloneNode(true) );
        up_button = document.getElementById("subject_tab_bar_up_button");
        up_button.addEventListener(
            'click',
            get_subject_tags_above.bind( null, level, parent_id )
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
        if( level < 4 ) {
            new_subject_tag.onclick = () => {
                get_subject_tags( level+1, subject_tag.id );
            }
        }
        subject_tab_container.appendChild( new_subject_tag );
    });
}

function get_subject_tags( level, parent_id ) {
    const URL_params = "get_subjects_by_level/" + level + "/" + (parent_id??-1);
    const get_subjects_tags = new Request(
        ip + URL_params
    );
    fetch( get_subjects_tags )
    .then( json => json.json() )
    .then( parsed_object => {
        render_subject_tags( parsed_object.search_tags, level, parent_id );
    });
}

function get_subject_tags_above( level, child_id ) {
    const level_above = Number(level) - 1;
    const URL_params = "get_subjects_above/" + level_above + "/" + (child_id??-1);
    const get_subjects_tags = new Request(
        ip + URL_params
    );
    fetch( get_subjects_tags )
    .then( json => json.json() )
    .then( parsed_object => {
        render_subject_tags( parsed_object.search_tags, level_above, child_id );
    });
}