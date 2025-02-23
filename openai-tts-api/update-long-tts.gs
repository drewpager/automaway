function onOpen() {
 DocumentApp.getUi().createMenu("Text to Speech")
   .addItem("Generate Speech", "splitTextCombineAudio")
   .addToUi()
}


// Update: Find natural break point (not mid-word or -sentence) for OpenAI TTS Character Limit
function splitTextIntoChunks(text, maxLength = 4095) {
 const chunks = [];
 let currentChunk = '';
  // Regular expression for sentence endings
 // Matches: . ! ? followed by optional quotes and whitespace
 const sentenceEndings = /([.!?]["']?\s+)/g;
 // Split text into sentences while preserving the delimiters
 let sentences = [];
 let lastIndex = 0;
 let match;
  while ((match = sentenceEndings.exec(text)) !== null) {
   sentences.push(text.slice(lastIndex, match.index + match[0].length));
   lastIndex = match.index + match[0].length;
 }
  // Add any remaining text after the last sentence ending
 if (lastIndex < text.length) {
   sentences.push(text.slice(lastIndex));
 }
  // Build chunks
 for (let sentence of sentences) {
   // If adding this sentence would exceed maxLength
   if ((currentChunk + sentence).length > maxLength) {
     if (currentChunk.length > 0) {
       chunks.push(currentChunk.trim());
     }
     // If single sentence is too long, split it
     if (sentence.length > maxLength) {
       let remaining = sentence;
       while (remaining.length > 0) {
         let cutPoint = findLastSpaceBefore(remaining, maxLength);
         if (cutPoint === -1) cutPoint = maxLength;
         chunks.push(remaining.slice(0, cutPoint).trim());
         remaining = remaining.slice(cutPoint);
       }
     } else {
       currentChunk = sentence;
     }
   } else {
     currentChunk += sentence;
   }
 }
  // Add the final chunk if it exists
 if (currentChunk.length > 0) {
   chunks.push(currentChunk.trim());
 }
  return chunks;
}


// Helper function to find last space before max length
function findLastSpaceBefore(text, maxLength) {
 const substring = text.slice(0, maxLength);
 const lastSpace = substring.lastIndexOf(' ');
 return (lastSpace > 0) ? lastSpace : -1;
}


async function splitTextCombineAudio() {
 let body = DocumentApp.getActiveDocument().getBody().getText()
 let title = DocumentApp.getActiveDocument().getName()
 let chunks = splitTextIntoChunks(body)


 let text = []
 let blob = []


 for (let i = 0; i < chunks.length; i++) {
   text.push(chunks[i])
 }


 for (let j = 0; j < text.length; j++) {
   blob.push(textToSpeech(text[j]))
 }
 const folderId = getParentFolder();


 const combined = await combineAudioBlobs(blob)


 if (!!combined) {
   DriveApp.createFile(combined.getAs("audio/mpeg")).setName(title).moveTo(DriveApp.getFolderById(folderId))
 } else {
   DocumentApp.getUi().alert("Something broke with combining audio files")
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


function textToSpeech(body) {
 const url = "https://api.openai.com/v1/audio/speech"


 const API_KEY = "YOUR_OPENAI_API_KEY"


 const payload = {
   "model": "tts-1",
   "voice": "onyx",
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
   return response.getAs("audio/mpeg")


 } catch (error) {
   DocumentApp.getUi().alert(`Error here: ${Error}`)
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

