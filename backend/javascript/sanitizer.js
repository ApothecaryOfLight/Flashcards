/*Regex Processing*/
const replacement = {
    "\/\/g" : "<ESCAPECHAR>",
    "\/'\/g" : "<APOSTROPHE>",
    "\/\"\/g" : "<QUOTATIONMARK>", 
    "\/-/" : "<HYPHEN>",
    "=" : "<EQUALS>"
}

function process_input( inText ) {
    let processed_text = "";
    processed_text = inText.replace(/['"]+/g,'&#39' );
    return processed_text;
}
exports.process_input = process_input;

function process_tag( inTag, replaceWith ) {
    let return_string = inTag.replace(
    /^[bd]\.|[^\w][bd]\.|&#39s|[^&\w]/g, " "
    );
    return_string= return_string.replace( /\s/g, "&nbsp;" );
    return return_string;
}