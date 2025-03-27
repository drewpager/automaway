function onOpen() {
  SpreadsheetApp.getUi().createMenu("Image Generation")
    .addItem("Gemerate Prompt + Image Link", "orchestrate")
    .addItem("Generate Image From Prompt", "fromPrompt")
    .addToUi()
}

function grokImageGeneration(prompt) {
  const payload = {
    model: "grok-2-image-latest",
    prompt: `${prompt}`
  }
  const url = "https://api.x.ai/v1/images/generations"
  // Go to Project Settings in Apps Script and Add Property with key "grokAPIKey" and value set to xai_yourkey
  const grokAPIKey = ScriptProperties.getProperty('grokAPIKey')
  const options = {
    method: "POST",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${grokAPIKey}`
    },
    payload: JSON.stringify(payload)
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const responseCode = response.getResponseCode()

    if (responseCode === 200) {
      const json = JSON.parse(response.getContentText())
      return json.data[0].url
    } else {
      Logger.log(responseCode)
    }
  } catch (e) {
    Logger.log("Error occurred: " + e.toString())
  }
}

async function fromPrompt() {
  let promptRange = SpreadsheetApp.getActiveRange().getValues()
  let row = SpreadsheetApp.getActiveRange().getRow()

  for (let i = 0; i < promptRange.length; i++) {
    let imageUrl = await grokImageGeneration(promptRange[i][0])
    SpreadsheetApp.getActiveSheet().getRange(row + i, 3).setValue(imageUrl)
    let oaiImage = await openAIImageGeneration(promptRange[i][0])
    SpreadsheetApp.getActiveSheet().getRange(row + i, 4).setValue(oaiImage)
  }
}

function promptGeneration(topic) {
  const payload = {
    model: "grok-2-latest",
    messages: [
        {
            role: "system",
            content: "You're an image generation assistant"
        },
        {
            role: "user",
            content: `Can you generate an image prompt to create a historically accurate, lifelike and iconic snapshot of the topic ${topic}. Please only return the image prompt and provide no additional context`
        },
    ],
  }

  const url = "https://api.x.ai/v1/chat/completions"
  // Go to Project Settings in Apps Script and Add Property with key "grokAPIKey" and value set to xai_yourkey
  const grokAPIKey = ScriptProperties.getProperty('grokAPIKey')
  const options = {
    method: "POST",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${grokAPIKey}`
    },
    payload: JSON.stringify(payload)
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const responseCode = response.getResponseCode()

    if (responseCode === 200) {
      const json = JSON.parse(response.getContentText())
      return json.choices[0].message.content;
    } else {
      Logger.log(responseCode)
    }
  } catch (e) {
    Logger.log("Error occurred: " + e.toString())
  }
}

async function orchestrate() {
  let range = SpreadsheetApp.getActiveRange().getValues()
  let row = SpreadsheetApp.getActiveRange().getRow()
  let rowIter = 1;

  for (let i = 0; i < range.length; i++) {
    let prompt = await promptGeneration(range[i][0])
    SpreadsheetApp.getActiveSheet().getRange(row + i, 2).setValue(prompt)
    rowIter += (i + 1)
  }

  let promptRange = SpreadsheetApp.getActiveSheet().getRange(row, 2, rowIter, 1).getValues()

  for (let j = 0; j < promptRange.length; j++) {
    let imageUrl = await grokImageGeneration(promptRange[j][0])
    SpreadsheetApp.getActiveSheet().getRange(row + j, 3).setValue(imageUrl)
    let oaiImage = await openAIImageGeneration(promptRange[j][0])
    SpreadsheetApp.getActiveSheet().getRange(row + j, 4).setValue(oaiImage)
  }
}

function openAIImageGeneration(prompt) {
  const payload = {
    "model": "dall-e-3",
    "prompt": `${prompt}`,
    "n": 1,
    "size": "1792x1024"
  }
  const url = "https://api.openai.com/v1/images/generations"
  // Go to Project Settings in Apps Script and Add Property with key "openAPIKey" and value set to sk-proj-yourkey
  const openAPIKey = ScriptProperties.getProperty('openAPIKey')
  const options = {
    method: "POST",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${openAPIKey}`
    },
    payload: JSON.stringify(payload)
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const responseCode = response.getResponseCode()

    if (responseCode === 200) {
      const json = JSON.parse(response.getContentText())
      return json.data[0].url
    } else {
      Logger.log(responseCode)
    }
  } catch (e) {
    Logger.log("Error occurred: " + e.toString())
  }
}
