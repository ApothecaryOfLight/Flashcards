
function regexp_text( inText ) {
    inText = inText.replaceAll( ";", "&#59;" );
    inText = inText.replaceAll( "\"", "&#34;" );
    inText = inText.replaceAll( "\'", "&#39;" );
    inText = inText.replaceAll( "`", "&#96;" );
    inText = inText.replaceAll( ":", "&#58;" );
    inText = inText.replaceAll( "\\", "&#92;" );
    inText = inText.replaceAll( "/", "&#47;" );
    return inText;
  }