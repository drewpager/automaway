// Run Function From Menu and Input Result
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Categorize")
    .addItem("Run Grok Categorizer", "getTopics")
    .addToUi()
}

function getTopics() {
  // NOTE: You must highlight the cells in the spreadsheet for this to work!
  let sheet = SpreadsheetApp.getActiveSheet().getActiveRange()
  let row = sheet.getRow()
  let topics = sheet.getValues()
  let responses = []
  for (let t = 0; t < topics.length; t++) {
    let res = grokCategorize(topics[t][0])
    responses.push(res)
  }
  for (let r = 0; r < responses.length; r++) {
    SpreadsheetApp.getActiveSheet().getRange(row + r, 2).setValue(responses[r].trim())
  }
}
 
function grokCategorize(topic) {
  // NOTE: You must save your Grok API Key in Project Settings > Script Properties
  let grokAPIkey = ScriptProperties.getProperty("grokAPIkey")
  let url = "https://api.x.ai/v1/chat/completions"

  const payload = {
    // UPDATE "content" fields below to match your use case
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant that can categorize topics into American History, World History, Biography, Military History, Science, Technology, and Geography"
      },
      {
        "role": "user",
        "content": `The 16th Amendment`
      },
      {
        "role": "system",
        "content": "American History"
      },
      {
        "role": "user",
        "content": `Battle of the Bulge`
      },
      {
        "role": "system",
        "content": "Military History"
      },
      {
        "role": "user",
        "content": `Henry Ford`
      },
      {
        "role": "system",
        "content": "Biography"
      },
      {
        "role": "user",
        "content": `${topic}`
      },

    ],
    "reasoning_effort": "low",
    "model": "grok-3-mini-fast-latest"
  }

  const options = {
    "method": "post",
    "contentType": "application/json",
    "headers": {
      "Authorization": `Bearer ${grokAPIkey}`
    },
    "payload": JSON.stringify(payload)
  }

  try {
    const response = UrlFetchApp.fetch(url, options)
    const json = response.getContentText()
    const data = JSON.parse(json)
    // Logger.log(data.choices[0].message.content)
    return data.choices[0].message.content
  } catch (error) {
    return "Error: " + error.message;
  }
}
