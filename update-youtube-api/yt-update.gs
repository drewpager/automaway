// Don't Forget to Add YouTube Data API V3 to Services in Apps Script

function onOpen() {
  SpreadsheetApp.getUi().createMenu("YouTube Update API")
    .addItem("Fetch YouTube Data", "getMyVideos")
    .addItem("Update YouTube Videos", "updateVideos")
    .addToUi();
}

function getMyVideos() {
 var results = YouTube.Channels.list('contentDetails', {mine: true});
 for(let i in results.items) {
   const item = results.items[i];
   const playlistId = item.contentDetails.relatedPlaylists.uploads;


   let nextPageToken = '';
  
   while (nextPageToken != null) {
     var playlistResponse = YouTube.PlaylistItems.list('snippet', {
       playlistId: playlistId,
       maxResults: 25,
       pageToken: nextPageToken
     });


     for (var j = 0; j < playlistResponse.items.length; j++) {
       var playlistItem = playlistResponse.items[j];

       let title = playlistItem.snippet.title
       let description = playlistItem.snippet.description
       let id = playlistItem.id
      
       displayMyVideos(title, description, id)
     }
     nextPageToken = playlistResponse.nextPageToken;
   }
 }
}

function displayMyVideos(title, description, id) {
 let sheet = SpreadsheetApp.getActiveSheet();
 let lastCol = sheet.getLastColumn()
 let lastRow = sheet.getLastRow();
 let titleCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Title")
 let descriptionCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Description")
 let idCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("ID")


 sheet.getRange(lastRow + 1, titleCol + 1).setValue(`${title}`)
 sheet.getRange(lastRow + 1, descriptionCol + 1).setValue(`${description}`)
 sheet.getRange(lastRow + 1, idCol + 1).setValue(`${id}`)
}


function updateVideos() {
  let sheet = SpreadsheetApp.getActiveSheet();
  let lastRow = sheet.getLastRow();
  let lastCol = sheet.getLastColumn();
  let newScriptCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("New Description")
  let idCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("ID")

  let data = sheet.getRange(2, 1, lastRow, lastCol).getValues();

  var myChannels = YouTube.Channels.list('contentDetails', {mine: true});
  
  for (var i = 0; i < myChannels.items.length; i++) {
    var item = myChannels.items[i];
    var uploadsPlaylistId = item.contentDetails.relatedPlaylists.uploads;

    let nextPageToken = "";

    while (nextPageToken != null) {
      var playlistResponse = YouTube.PlaylistItems.list('snippet', {
        playlistId: uploadsPlaylistId,
        maxResults: 10,
        pageToken: nextPageToken
      });

      for (let j = 0; j < playlistResponse.items.length; j++) {
        // Get the videoID of the first video in the list
        var video = playlistResponse.items;
        
        if (data[j][newScriptCol].toString().length > 1 && video[j].id === data[j][idCol]) {
          var updatedDescription = `${data[j][newScriptCol]}`

          video[j].snippet.description = updatedDescription

          var resource = {
            snippet: {
              title: video[j].snippet.title,
              description: updatedDescription,
              categoryId: '22'
            },
            id: video[j].snippet.resourceId.videoId
          };
          YouTube.Videos.update(resource, 'id,snippet');
        }
      }
      nextPageToken = playlistResponse.nextPageToken;
    }
  }
}

