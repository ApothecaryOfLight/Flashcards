/*Regex Processing*/
function process_input( inText ) {
    let processed_text = inText.replace(/"+/g,'\"' );
    processed_text = inText.replace(/'+/g,'\'' );
    return processed_text;
}
exports.process_input = process_input;

function process_tag( inTag ) {
    let return_string = inTag.replace(
    /^[bd]\.|[^\w][bd]\.|&#39s|[^&\w]/g, " "
    );
    return_string= return_string.replace( /\s/g, "&nbsp;" );
    return return_string;
}
exports.process_tag = process_tag;