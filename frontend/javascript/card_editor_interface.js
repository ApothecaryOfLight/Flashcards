/*Card Editor Interface*/


/*
Launch the interface used for editing cards.

inCardID: The unique identifier of the card to edit.

inSetID: The unique identifier of the set to which the card belongs.

isNew: Boolean indicating whether the card has just been created or already exists.

inPrevInt: Previous interface displayed. Used to return to that interface after
exiting the card editor interface.
*/
function launch_card_editor_interface( inCardID, inSetID, isNew, inPrevInt ) {
  //1) Set the current interface and variables.
  set_interface(
    "card_editor",
    {
      set_id:inSetID,
      card_id:inCardID,
      previous_interface: inPrevInt
    }
  );

  //3) Check to see if the card already exists.
  if( isNew == false ) {
    //4a) If the card exsists, get the card data.
    get_card( inCardID );

    //5) Get the card update button.
    const set_card =
      document.getElementById("card_editor_interface_set_card");

    //6) Create a bound function with the card's identifying data.
    const func_ref =
      card_editor_interface_update_card.bind( this, inSetID, inCardID );

    //7) Remove the existing bound function, if it exists.
    if( bound_functions["card_editor"]["set_card"] ) {
      bound_functions["card_editor"]["set_card"].forEach( (func)=> {
        set_card.removeEventListener( 'click', func );
      });
    }
    bound_functions["card_editor"]["set_card"] = [];

    //8) Add the new bound function as a click event listener.
    set_card.addEventListener( 'click', func_ref );
    bound_functions["card_editor"]["set_card"].push( func_ref );
  } else {
    //3b) If the card doesn't exist, don't bother.
    const question_text = document.getElementById("card_editor_interface_q_text");
    const answer_text = document.getElementById("card_editor_interface_a_text");
    question_text.innerHTML = "";
    answer_text.innerHTML = "";
  }
}

function proc_txt_question_card_editor_interface( inText, inImages, QuestionContainer ) {
  //1) Remove any text or images that may have previously been loaded into the container.
  while( QuestionContainer.firstChild ) {
    QuestionContainer.firstChild.remove();
  }

  //3) Turn JSONified text string into a JSON object.
  const objectifiedText = JSON.parse( inText );

  //4) Iterate through every value in the object and append it to the question container.
  objectifiedText.forEach( (object) => {
    if( object.type == "text" ) {
      const div_container = document.createElement("div");
      div_container.innerHTML = object.content;
      QuestionContainer.appendChild( div_container );
    } else if( object.type == "image" ) {
      const image_container = document.createElement("img");
      image_container.src = inImages[object.image_array_location];
      image_container.classList = "card_editor_interface_picture_question";
      QuestionContainer.appendChild( image_container );
    }
  });
}


/*
This function is used to get the content of a card from the server.

inCardID: The unique identifier of the card to fetch from the server.
*/
function get_card( inCardID ) {
  //Create a request to get a card.
  const get_card = new Request(
    ip + 'get_card/' + inCardID
  );

  //Ask the server for the card.
  fetch( get_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Get references to the text fields for the question and the answer.
        const question_text = document.getElementById("card_editor_interface_q_text");
        const answer_text = document.getElementById("card_editor_interface_a_text");

        //Upon success, set the question text and image values.
        proc_txt_question_card_editor_interface( json.card.question, json.card.images, question_text );

        //Upon success, set the answer text value to the card data.
        answer_text.innerHTML = json.card.answer;

        card_editor_interface_render_tags( json.tags );
      } else if( json.result == "error" ) {
        //Upon failure, notify the user of an error.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}



function recursively_traverse_tree( node, objectified_post, images_array ) {
  if( node.firstChild ) {
      for( const key in node.childNodes ) {
          recursively_traverse_tree( node.childNodes[key], objectified_post, images_array );
      }
  } else {
      const type = node.nodeName;

      if( type == "#text" || type == "DIV" ) {
        if( node.textContent ) {
          let node_type = "text";
          objectified_post.push({
              type: node_type,
              content: regexp_text( node.textContent )
          });
        }
        return;
      } else if( type == "IMG" ) {
        const image_position = objectified_post.length;
        const image_array_location = images_array.length;
        objectified_post.push({
            type: "image",
            image_position: image_position,
            image_array_location: image_array_location
        });

        images_array[image_array_location] = {
          image_data: node.src,
          image_position: image_position,
          image_array_location: image_array_location
        }
        return;
      }   
  }
}



/*
This function is used to update an existing card from the card editor interface.

inSetID: Unique indetifier of the set to which the card belongs.

inCardID: Unique identifier of the card to update.
*/
function card_editor_interface_update_card( inSetID, inCardID ) {
  //Get refernces to the question and answer text fields of the card.
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");

  const objectified_post = [];
  const images_array = [];
  recursively_traverse_tree( card_q_handle, objectified_post, images_array );

  const answer_text = regexp_text(card_a_handle.innerHTML);

  const card_tags = [];
  let tag_iterator = document.getElementById("card_editor_interface_tags_list").firstChild;
  while( tag_iterator ) {
    card_tags.push(tag_iterator.firstChild.data);
    tag_iterator = tag_iterator.nextSibling;
  }

  //Compose the message to send to the server.
  const body_content = JSON.stringify({
    set_id: inSetID,
    card_id: inCardID,
    question: objectified_post,
    question_images: images_array,
    answer: answer_text,
    tags: card_tags
  });

  //Send the request to update the card to the server.
  const update_card = new Request(
    ip + 'update_card',
    {
      method: 'POST',
      body: body_content,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( update_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, blank the text values.
        card_q_handle.innerHTML = "";
        card_a_handle.innerHTML = "";

        //Return to the set editor interface.
        launch_set_editor_interface( inSetID );
      } else if( json.result == "error" ) {
        //Upon failure, notify the user of an error.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Function to be called upon creating a new card in the card editor interface.

inCardData: Object containing the unique identifiers of the card and set.
*/
function card_editor_interface_set_card( inCardData ) {
  //Get references to the question and answer text fields.
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");

  const objectified_post = [];
  const images_array = [];
  recursively_traverse_tree( card_q_handle, objectified_post, images_array );

  const answer_text = regexp_text(card_a_handle.innerHTML);

  const card_tags = [];
  let tag_iterator = document.getElementById("card_editor_interface_tags_list").firstChild;
  while( tag_iterator ) {
    card_tags.push(tag_iterator.firstChild.data);
    tag_iterator = tag_iterator.nextSibling;
  }

  //Compose the message to send to the sever.
  const body_content = JSON.stringify({
    question: objectified_post,
    question_images: images_array,
    answer: answer_text,
    set_id: inCardData.set_id,
    card_id: inCardData.card_id,
    tags: card_tags
  });

  //Send the request to the server.
  const new_card = new Request(
    ip + 'add_card',
    {
      method: 'POST',
      body: body_content,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  fetch( new_card )
    .then( json => json.json() )
    .then( json => {
      if( json.result == "success" ) {
        //Upon success, blank the text fields and return to the set editor interface.
        card_q_handle.value = "";
        card_a_handle.value = "";
        launch_set_editor_interface( inCardData.set_id, true );
      } else if( json.result == "error" ) {
        //Upon failure, notify the user of an error.
        const options = {
          "Close" : close_modal
        }
        launch_modal( null, json.error_message, options );
      }
    });
}


/*
Function to return to the previous interface.
*/
function card_editor_interface_go_back( inCardData ) {
  //Get references to the question and answer text fields.
  const card_q_handle = document.getElementById("card_editor_interface_q_text");
  const card_a_handle = document.getElementById("card_editor_interface_a_text");

  //Blank the text value of the question and answer text fields.
  card_q_handle.value = "";
  card_a_handle.value = "";

  //Return to the interface the user was in before the card editor interface.
  if( inCardData.previous_interface == "set_editor" ) {
    launch_set_editor_interface( inCardData.set_id );
  } else if( inCardData.previous_interface == "search" ) {
    launch_search_interface();
  }
}


function card_editor_interface_add_tag( inTag ) {
  const tags_field = document.getElementById("card_editor_interface_tags_list");

  const new_tag_container = document.createElement("div");
  new_tag_container.classList = "card_editor_interface_tag_container";
  new_tag_container.innerText = inTag;

  const new_tag_delete_button = document.createElement("div");
  new_tag_delete_button.classList = "card_editor_interface_tag_delete_button";
  new_tag_delete_button.onclick = delete_card_tag.bind( null, inTag );
  new_tag_delete_button.innerText = "X";
  new_tag_container.appendChild( new_tag_delete_button );

  tags_field.appendChild( new_tag_container );
}

/*
Function to be used to add a subject tag to a card.
*/
function card_editor_interface_add_tag_button() {
  const tag_text_field = document.getElementById("card_editor_interface_tags_field");
  let tag_text = tag_text_field.value;
  tag_text_field.value = "";

  if( tag_text == "" ) { return; }
  tag_text = tag_text.replace( /\s/g, "&nbsp;" );

  card_editor_interface_add_tag( tag_text );
}


/*
Function to convert card topic tags into HTML elements.
*/
function card_editor_interface_render_tags( card_tags ) {
  //Iterate through each card tag.
  const tag_list = document.getElementById("card_editor_interface_tags_list");
  while( tag_list.firstChild ) {
    tag_list.firstChild.remove();
  }

  for( index in card_tags ) {
      card_editor_interface_add_tag( card_tags[index].name );
  }
}


/*
Function to delete a card search tag.

inTag: The tag being deleted.
*/
function delete_card_tag( inTagText ) {
  let tag_iterator = document.getElementById("card_editor_interface_tags_list").firstChild;
  while( tag_iterator ) {
    if( tag_iterator.firstChild.data == inTagText ) {
      tag_iterator.remove();
    }
    tag_iterator = tag_iterator.nextSibling;
  }
}



function card_editor_interface_pictoral_question_add_button() {
  const temp_input = document.createElement("input");
  temp_input.type = "file";
  temp_input.accept = "image/*";

  temp_input.onchange = e => {
    const reader = new FileReader();
    reader.readAsDataURL( e.target.files[0] );

    reader.onload = readerEvent => {
      const ref = document.getElementById("card_editor_interface_q_text");
      const new_image = document.createElement("img");
      new_image.classList = "card_editor_interface_picture_question";

      const content = readerEvent.target.result;

      new_image.src = content;

      ref.appendChild( new_image );
    }
  }
  temp_input.click();
}
