function visionAPI(fileId) {
  const API_KEY = "CREATE API KEY HERE: https://aistudio.google.com/app/apikey"
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY

  const image = DriveApp.getFileById(fileId)

  const NUM_BYTES = image.getSize()
  const MIME_TYPE = image.getMimeType()
  const DISPLAY_NAME = image.getName()
  
  const uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" + API_KEY;

  const upload = {
    'method': 'POST',
    'contentType': 'application/json',
    'headers': {
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": NUM_BYTES,
      "X-Goog-Upload-Header-Content-Type": MIME_TYPE
    },
    'payload': JSON.stringify({
      'file': {
        'mime_type': MIME_TYPE,
        'display_name': DISPLAY_NAME
      }
    })
  }

  const up = UrlFetchApp.fetch(uploadUrl, upload)
  const json = JSON.stringify(up.getAllHeaders())
  const responseHeaders = JSON.parse(json)
  let downUrl = responseHeaders["x-goog-upload-url"]

  const payload = {
    'method': 'POST',
    'headers': {
      "X-Goog-Upload-Header-Content-Length": NUM_BYTES,
      "X-Goog-Upload-Offset": '0',
      "X-Goog-Upload-Command": "upload, finalize"
    },
    'payload': image
  }

  let res = UrlFetchApp.fetch(downUrl, payload)
  let parse = JSON.parse(res.getContentText())
  let fileUri = `${parse.file.uri}`

  const generatedPayload = {
    "contents": [{
      "parts": [
        {"text": "Can you tell me about the financial performance of the company based on the 10-Q SEC quarterly PDF?"},
        // {"text": "Can you describe this photo in 100 to 250 characters?"},
        {"file_data": 
          {"mime_type": MIME_TYPE,
          "file_uri": fileUri }
        }]
    }]
  }

  const options = {
    'method': 'POST',
    'contentType': 'application/json',
    'payload': JSON.stringify(generatedPayload)
  }

  const response = UrlFetchApp.fetch(url, options)

  if (response.getResponseCode() === 200) {
    const content = JSON.parse(response.getContentText())

    const generatedDescription = content.candidates[0].content.parts[0].text
    return generatedDescription;
  } else {
    Logger.log(`Error fetching content`)
  }
}

function getFileIdsFromFolder(folderId) {

  const folder = DriveApp.getFolderById(folderId);

  const filesIterator = folder.getFiles();

  const fileIds = [];
  const fileNames = [];

  while (filesIterator.hasNext()) {
    const file = filesIterator.next();
    fileIds.push(file.getId());
    fileNames.push(file.getName())
  }

  return [fileIds, fileNames];
}

function driveFiles() {
  let files = getFileIdsFromFolder('YOUR FOLDER ID')
  Logger.log(files[1])
  let doc = DocumentApp.create("Financial Performance")
  let docId = doc.getId()
  let body = doc.getBody();

  for (let i = 0; i < files[0].length; i++) {
    let generatedDescription = visionAPI(files[0][i])
    body.appendParagraph(`${files[1][i]} - ${generatedDescription}`)
  }

  DriveApp.getFolderById('YOUR FOLDER ID').createShortcut(docId)
}
