function onOpen() {
  DocumentApp.getUi().createMenu("Text to Speech")
    .addItem("Generate Speech", "splitTextCombineAudio")
    .addToUi()
}

// Split up the text into chunks of 4095 characters and then combine the audio blobs 
async function splitTextCombineAudio() {
  let body = DocumentApp.getActiveDocument().getBody().getText()
  let title = DocumentApp.getActiveDocument().getName()
  let chunkCount = Math.ceil(body.length / 4095)
  let text = []
  let blob = []
  for (let i = 0; i < chunkCount; i++) {
    text.push(body.slice(i*4095, ((i*4095))+4095))
  }

  for (let j = 0; j < text.length; j++) {
    blob.push(textToSpeech(text[j]))
  }
  
  const folderId = getParentFolder();
  
  const combined = await combineAudioBlobs(blob)

  if (!!combined) {
    DriveApp.createFile(combined.getAs("audio/mpeg")).setName(title).moveTo(DriveApp.getFolderById(folderId))
  } else {
    DocumentApp.getUi().alert("Something broke here")
  }
}

function textToSpeech(body) {
  const url = "https://api.openai.com/v1/audio/speech"

  const API_KEY = "YOUR_API_KEY"

  const payload = {
    "model": "tts-1",
    "voice": "fable",
    "input": `${body}`,
  }

  const headers = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": `Bearer ${API_KEY}`,
    },
    "payload": JSON.stringify(payload)
  }
  
  try {
    const response = UrlFetchApp.fetch(url, headers)
    return response.getAs('audio/mpeg')
  } catch (error) {
    DocumentApp.getUi().alert(`Error here ${error}`)
  }
}

// prompt: How would you combine an array of two or more blobs containing audio data in Google Apps Script?
function combineAudioBlobs(audioBlobs) {
  try {  
    const combinedBuffer = audioBlobs.reduce((acc, blob, index) => {
      const blobData = blob.getBytes();
      
      // For the first blob, initialize the combined array
      if (index === 0) {
        return blobData; 
      }

      // For subsequent blobs, concatenate the data
      const newBuffer = new Uint8Array(acc.length + blobData.length);
      newBuffer.set(acc, 0);
      newBuffer.set(blobData, acc.length);
      return newBuffer;
    }, []); 

    return Utilities.newBlob(combinedBuffer, 'audio/mpeg'); 

  } catch (error) {
    Logger.log("Error combining audio blobs: " + error);
    throw error;
  }
}

function getParentFolder(){
  var doc = DocumentApp.getActiveDocument();
  var file = DriveApp.getFileById(doc.getId());
  var folders = file.getParents();
  while (folders.hasNext()){
    return folders.next().getId();
  }
}
