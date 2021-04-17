window.addEventListener( 'load', (loaded) => {
  console.log( "Ready" );

  const download_button = document.getElementById("download_database");
  download_button.addEventListener( 'click', download_database );

  const upload_button = document.getElementById("upload_database");
  upload_button.addEventListener( 'click', upload_database );
});

function download_database() {
  const download_obj = new Request(
    ip + 'download_backup',
    { method: 'GET' }
  );
  fetch( download_obj )
    .then( result => result.json())
    .then( result => {
      console.dir( result );
      save_backup( result.data );
    });
}

function save_backup( data ) {
  //1) Create placeholder element.
  const a = document.createElement('a');

  //2) Create a file blob.
  const file = new Blob([data], {type: 'utf8'});

  a.href = URL.createObjectURL( file );
  a.download = "backup_database.sql";
  a.click();

  URL.revokeObjectURL( a.href );
}

function upload_database() {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsText( file );
    reader.onload = readerEvent => {
      fetch(
        ip + 'upload_database',
        {
          method: 'POST',
          body: JSON.stringify({
            data: readerEvent.target.result
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      .then( response => response.json() )
      .then( json => {
        if( json.result == "success" ) {
          console.log( "Upload successful!" );
        } else {
          console.log( "Unspecified error." );
        }
      });
    }
  }
  input.click();
}
