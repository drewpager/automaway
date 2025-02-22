function onOpen() {
  DocumentApp.getUi().createMenu("Localize Document With AI")
    .addItem("Step 1: Select Languages", "showSidebar")
    .addItem("Step 2: Localize", "runTranslate")
    .addToUi();
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('sidebar')
      .setTitle('Text Translation Language Selection');
  DocumentApp.getUi().showSidebar(html);
}

function getLanguages() {
  var sourceLang = PropertiesService.getScriptProperties().getProperty('sourceLang');
  var targetLang = PropertiesService.getScriptProperties().getProperty('targetLang');
  return { source: sourceLang, target: targetLang };
}

function setLanguages(sourceLang, targetLang) {
  PropertiesService.getScriptProperties().setProperty('sourceLang', sourceLang);
  PropertiesService.getScriptProperties().setProperty('targetLang', targetLang);
  return "Languages set successfully!"; // Return a success message
}

function translateAndCopyDocument(sourceDocId, sourceLanguage, targetLanguage) {
  // 1. Get the source document.
  var sourceDoc = DocumentApp.openById(sourceDocId);
  var sourceBody = sourceDoc.getBody();
  let folderId = getParentFolder(sourceDocId)

  // 2. Create a copy of the document.
  var targetDoc = DriveApp.getFileById(sourceDocId).makeCopy().moveTo(DriveApp.getFolderById(folderId))
  var targetDocId = targetDoc.getId()
  var targetBody = DocumentApp.openById(targetDocId).getBody()

  // 3. Translate the title.
  var sourceTitle = sourceDoc.getName();
  var translatedTitle = translateText(sourceTitle, sourceLanguage, targetLanguage);
  targetDoc.setName(translatedTitle); // Set the translated title.

  // 4. Translate the document body content recursively.
  translateContent(sourceBody, targetBody, sourceLanguage, targetLanguage);

  // 5. Return the ID of the translated document.
  return targetDocId;
}

function translateContent(sourceElement, targetElement, sourceLanguage, targetLanguage) {
  var sourceType = sourceElement.getType();

  switch (sourceType) {
    case DocumentApp.ElementType.PARAGRAPH:
    case DocumentApp.ElementType.TEXT:
      var sourceText = sourceElement.getText();
      // Check if text exists to prevent errors on empty elements
      if (sourceText) { 
        var translatedText = translateText(sourceText, sourceLanguage, targetLanguage);
        if (targetElement.getType() === DocumentApp.ElementType.PARAGRAPH) {
          targetElement.setText(translatedText); // Paragraph
        } else if (targetElement.getType() === DocumentApp.ElementType.TEXT) {
          targetElement.insertText(0, translatedText); // For inline text within other elements
        }
      }
      break;
    case DocumentApp.ElementType.LIST_ITEM:
      var sourceChild = sourceElement.getChild(0);
      var targetChild = targetElement.getChild(0);

      // Clear existing content of the target child BEFORE translating.
      if (targetChild.getType() === DocumentApp.ElementType.PARAGRAPH || DocumentApp.ElementType.TEXT) {
        targetChild.setText(""); // Clear paragraph content
      } else {
        // Handle other child types if necessary (e.g., tables within list items)
        targetChild.setText(""); // Or a more appropriate clear method
      }

      translateContent(sourceChild, targetChild, sourceLanguage,targetLanguage); // Now translate and populate the cleared element.
      break;
    case DocumentApp.ElementType.TABLE:
      var numRows = sourceElement.getNumRows();
      var numCols = sourceElement.getNumColumns();
      for (var i = 0; i < numRows; i++) {
        for (var j = 0; j < numCols; j++) {
          var sourceCell = sourceElement.getCell(i, j);
          var targetCell = targetElement.getCell(i, j);
          translateContent(sourceCell, targetCell, sourceLanguage,targetLanguage);
        }
      }
      break;
    case DocumentApp.ElementType.INLINE_IMAGE:
    case DocumentApp.ElementType.IMAGE:
      // Copy images directly.  Translation not applicable.
      var blob = sourceElement.getBlob();
      targetElement.insertImage(0, blob); // Preserve image
      break;
    case DocumentApp.ElementType.HEADING:
      var sourceText = sourceElement.getText();
      var translatedText = translateText(sourceText, sourceLanguage,targetLanguage);
      targetElement.setText(translatedText);
      break;
    default:
      // Handle other element types as needed (e.g., tables, lists, etc.)
      // For now, we'll just iterate through children.
      var numChildren = sourceElement.getNumChildren();
      for (var i = 0; i < numChildren; i++) {
        var sourceChild = sourceElement.getChild(i);
        var targetChild = targetElement.getChild(i); // Assuming structure is mirrored.
        translateContent(sourceChild, targetChild, sourceLanguage,targetLanguage);
      }
  }
}

function geminiLocalizationAPI(text, sourceLang, tgtLang) {
  const API_KEY = "YOUR_GEMINI_API_KEY"
  // The endpoint URL for generating content
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=' + API_KEY;

  const payload = {
    "contents": [{
      "parts": [{
        "text": `Can you localize the following ${sourceLang} text into ${tgtLang} and only return the most likely single translation as a response with no additional context:
        
        ${text}`
      }]
    }]
  };

  const options = {
    'method' : 'post',
    'contentType': 'application/json',
    'payload' : JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() === 200) {
    const content = JSON.parse(response.getContentText());
    const translation = content.candidates[0].content.parts[0].text;
    return translation
  } else {
    return Error(`Something broke here!`)
  }
}

function translateText(text, sourceLanguage, targetLanguage) {
  // Use the LanguageApp service for translation.
  // Persistent storage for rate limiting data.  Properties Service is good for this.
  const properties = PropertiesService.getScriptProperties();
  let callCount = properties.getProperty('callCount') || 0;
  let lastCallTime = properties.getProperty('lastCallTime') || 0;

  const now = Date.now();
  const minute = 60 * 1000; // Milliseconds in a minute

  // Check if we need to reset the counter
  if (now - lastCallTime >= minute) {
    callCount = 0;
    lastCallTime = now;
    properties.setProperty('callCount', callCount);
    properties.setProperty('lastCallTime', lastCallTime);
  }

  // Check if we've hit the rate limit
  if (callCount >= 30) {
    const timeToWait = minute - (now - lastCallTime);
    Logger.log(`Rate limit hit. Waiting ${timeToWait / 1000} seconds.`);
    Utilities.sleep(timeToWait); // Wait until the next minute
    callCount = 0; // Reset the counter since we waited a full minute.
    lastCallTime = Date.now(); // Update last call time after waiting.
    properties.setProperty('callCount', callCount);
    properties.setProperty('lastCallTime', lastCallTime);
  }

  // Make the API call
  try {
    let translation = geminiLocalizationAPI(text, sourceLanguage, targetLanguage)
    callCount++;
    properties.setProperty('callCount', callCount);
    if (translation.length > 0) {
      return translation;
    } else {
      Logger.log("Translation length error!");  
    }
  } catch (error) {
    Logger.log("Translation error: " + error);
    return text; // Return original text if translation fails.
  }
}

function runTranslate() {
  var languages = getLanguages();
  if (!languages.source || !languages.target) {
    DocumentApp.getUi().alert('Error', 'Please select source and target languages first.', DocumentApp.getUi().ButtonSet.OK);
    return;
  }

  var sourceLanguage = languages.source;
  var targetLanguage = languages.target;
  var sourceDocId = DocumentApp.getActiveDocument().getId();

  var localizedDocId = translateAndCopyDocument(sourceDocId, sourceLanguage, targetLanguage);
  DocumentApp.getUi().alert("Localized document ID: " + localizedDocId);
}

function getParentFolder(sourceDocId){
  var file = DriveApp.getFileById(sourceDocId);
  var folders = file.getParents();
  while (folders.hasNext()){
    return folders.next().getId();
  }
}

