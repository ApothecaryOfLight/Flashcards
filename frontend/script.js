
function getSetList() {
  const test = new Request(
    'http://52.36.124.150:3000/setlist',
    { method: 'GET' }
  );
  fetch( test )
    .then( txt => txt.text())
    .then( txt => {
      console.dir( txt );
      renderSetList( JSON.parse(txt) );
    });
}

function getSet( inName ) {
  console.log( "Requesting " + inName );
}

function renderSetList( setList ) {
  const setlist_dom_obj = document.getElementById("setlist_interface_set_list");
  let dom_string = "";
  setList.forEach( set => {
    dom_string += "<div class=\'setlist_item\'" +
      " onclick=\"getSet(\'" + set + "\')\">" + set + "</div>";
  });

  setlist_dom_obj.innerHTML = dom_string;
}

window.addEventListener( 'load', (loaded_event) => {
  getSetList();
  renderSetList( ["list1","list2"] );
});
