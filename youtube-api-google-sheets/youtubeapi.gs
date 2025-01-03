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
       const videoSnippet = YouTube.Videos.list('statistics, contentDetails', {
         id: playlistItem.snippet.resourceId.videoId,
       })


       let title = playlistItem.snippet.title
       let duration = parseISODuration(videoSnippet.items[0].contentDetails.duration)
       let views = videoSnippet.items[0].statistics.viewCount
      
       displayMyVideos(title, duration, views)
       // Logger.log('%s, %s, %s',
       //            playlistItem.snippet.title,
       //            parseISODuration(videoSnippet.items[0].contentDetails.duration),
       //            videoSnippet.items[0].statistics.viewCount);


     }
     nextPageToken = playlistResponse.nextPageToken;
   }
 }
}


function displayMyVideos(title, duration, views) {
 let sheet = SpreadsheetApp.getActiveSheet();
 let lastCol = sheet.getLastColumn()
 let lastRow = sheet.getLastRow();
 let titleCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Title")
 let durationCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Duration")
 let viewsCol = sheet.getRange(1, 1, 1, lastCol).getValues()[0].indexOf("Views")


 sheet.getRange(lastRow + 1, titleCol + 1).setValue(`${title}`)
 sheet.getRange(lastRow + 1, durationCol + 1).setValue(`${duration}`)
 sheet.getRange(lastRow + 1, viewsCol + 1).setValue(`${views}`)
}


function parseISODuration(duration) {
   // Use a regex to extract hours, minutes, and seconds
   const regex = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
   const matches = duration.match(regex);


   if (!matches) {
       throw new Error('Invalid ISO 8601 duration format');
   }


   const hours = matches[1] ? parseInt(matches[1], 10) : 0;
   const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
   const seconds = matches[3] ? parseInt(matches[3], 10) : 0;


   // Build a human-readable format
   let readableFormat = '';
   if (hours > 0) readableFormat += `${hours}:`;
   if (minutes > 0) readableFormat += `${minutes}:`;
   if (seconds > 0) readableFormat += `${seconds}`;


   return readableFormat.trim();
}
