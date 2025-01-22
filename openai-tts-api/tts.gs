function onOpen() {
  DocumentApp.getUi().createMenu("Text to Speech")
    .addItem("Generate Speech", "textToSpeech")
    .addToUi()
}

function textToSpeech() {
  const url = "https://api.openai.com/v1/audio/speech"

  // Current limitation here: body can't be longer than 4096 characters
  let body = DocumentApp.getActiveDocument().getBody().getText()
  let title = DocumentApp.getActiveDocument().getName()

  const API_KEY = "YOUR_API_KEY"

  const payload = {
    "model": "tts-1",
    "voice": "ash",
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
    const folderId = getParentFolder();

    DriveApp.createFile(response.getAs('audio/mpeg')).setName(title).moveTo(DriveApp.getFolderById(folderId))
  } catch (error) {
    DocumentApp.getUi().alert(`Error here ${error}`)
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
