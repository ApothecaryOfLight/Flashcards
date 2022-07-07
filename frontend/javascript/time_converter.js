/*
Prepends a zero to any number smaller than ten, so that the number supplied
can be used in a timestamp string.
While this function takes a Number type, type coercion will return a string
because the return call uses the plus sign with a string ("0") and a Number,
this will cause the plus sign to function as a string concatenator.
*/
function pad_with_zero( inNumber ) {
    if( inNumber < 10 ) {
      return "0" + inNumber;
    }
    return inNumber;
  }
  
  /*
  This function will ensure that milliseconds will consist of 6 digits, a requirement
  for the timestamp format we're using (the MySQL DATETIME format). That value is in
  fractional seconds, not milliseconds.
  MySQL lets us set the preicion of these fractional seconds, which we set to the max,
  at 6. This makes them equivalent to microseconds, which are three magnitudes of order
  smaller than milliseconds.
  Because the JavaScript getMilliseconds() function returns a three digit value, we
  will need to append three zeroes, to convert from milliseconds to microseconds,
  and then prepend a number of zeroes that will make the string 6 digits long, in
  order to match the format expected by MySQL's DATETIME(6).
  */
  function pad_milliseconds( inMilliseconds ) {
    let outMilliseconds = "";
  
    //JavaScript milliseconds need to be multipled by two orders of magnitude to be
    //converted into fractional seconds. That means appending two zeroes, since we
    //can't JavaScript won't give us values at those finer granularities.
    outMilliseconds = inMilliseconds + "000";
  
    //Next we need to prepend zeroes to the string in order to reach a length of 6 digits.
    const inLength = String(outMilliseconds).length;
    const needed_zeroes = 6 - inLength;
    for( let i=0; i<needed_zeroes; i++ ) {
      outMilliseconds = String("0") + outMilliseconds;
    }
  
    return outMilliseconds;
  }
  
  
  /*
  We use this function to format the timestamp provided to use from the MySQL server.
  In this case, we're using the MySQL DATETIME format, but are then converting it to
  a JavaScript Date. So in order to display it as it appears in the MySQL server, we'll
  need to do a little parsing and string bashing.
  We use pad_with_zero to make sure that all 2-digit values have 2 digits, and we use
  pad_milliseconds to make sure that our milliseconds value has 6 digits, both of which
  are required for MySQL DATETIME format.
  */
  function format_datetime( inDate ) {
    const year = inDate.getFullYear();
    const month = pad_with_zero(inDate.getMonth() + 1);
    const day = pad_with_zero( inDate.getDate() );
    const hours = pad_with_zero( inDate.getHours() );
    const minutes = pad_with_zero( inDate.getMinutes() );
    const seconds = pad_with_zero( inDate.getSeconds() );
    const milliseconds = pad_milliseconds( inDate.getMilliseconds() );
  
    const MySQLDateTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + "." + milliseconds;
  
    return MySQLDateTime;
  }