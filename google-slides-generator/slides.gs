/* 
Example Google Sheet: https://docs.google.com/spreadsheets/d/1xSuYw40sHeI2cQNp_eZvhlftzbT3aaXorkbr9IBaAMw/

Example Google Slide Template: https://docs.google.com/presentation/d/1ES8f7HNXonV-wFqo984LlSxmMib--GK-iTBg0CcoJyM/

Example Slide Bank: https://docs.google.com/presentation/d/1vT5PGGD_G8_kUDoUFF_Ow9CetVX2FxGmuuq-04Hiz68/
*/

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Google Slides Generator")
    .addItem("Fetch Template Gallery Slides", "updateTemplateSlides")
    .addItem("Generate Slide Deck", "sheetCreateSlides")
    .addToUi()
}

function sheetCreateSlides() {
  let deck_template = "1ES8f7HNXonV-wFqo984LlSxmMib--GK-iTBg0CcoJyM"
  const client = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Deck Generator").getRange(2, 1).getValue()
  const name = `${client} Report`
  const folderId = getParentFolder();

  let copyFile = DriveApp.getFileById(deck_template).makeCopy().setName(name).moveTo(DriveApp.getFolderById(folderId))

  const presentationCopyId = copyFile.getId();

  slideGenerator(presentationCopyId);
}

function slideGenerator(presId) {
  const deckData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Deck Generator")
  const chartData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Charts")
  const date = deckData.getRange(2, 2).getValue()
  const presentationDate = Utilities.formatDate(new Date(date), "GMT", "M.d.YYYY")
  const companyName = deckData.getRange(2, 1).getValue()
  let d1 = deckData.getRange(2, 3).getValue()
  let d2 = deckData.getRange(2, 4).getValue()
  let d3 = deckData.getRange(2, 5).getValue()
  let d4 = deckData.getRange(2, 6).getValue()
  let addSlide = deckData.getRange(2, 7).getValue()

  d1 = d1.toLocaleString('en-US')
  d2 = `$` + d2.toLocaleString('en-US')
  d3 = d3.toLocaleString('en-US')
  d4 = `$` + d4.toLocaleString('en-US')

  const newDeck = SlidesApp.openById(presId)
  newDeck.getSlides()[0].replaceAllText("{{Period}}", "Q1 2025")
  newDeck.getSlides().forEach((slide) => slide.replaceAllText("{{d1}}", d1))
  newDeck.getSlides().forEach((slide) => slide.replaceAllText("{{d2}}", d2))
  newDeck.getSlides().forEach((slide) => slide.replaceAllText("{{d3}}", d3))
  newDeck.getSlides().forEach((slide) => slide.replaceAllText("{{d4}}", d4))

  // Get Template Slides
  const slideGalleryId = "1vT5PGGD_G8_kUDoUFF_Ow9CetVX2FxGmuuq-04Hiz68"
  const slides = [];

  SlidesApp.openById(slideGalleryId).getSlides().forEach((slide, index) => {
    slides.push(slide.getNotesPage().getSpeakerNotesShape().getText().asRenderedString().trim())
  })

  let insertSlideNum;
  let chartSlideNum;

  newDeck.getSlides().forEach((slide, indy) => {
    if (slide.getNotesPage().getSpeakerNotesShape().getText().asRenderedString().trim() === "insert") {
      return insertSlideNum = indy;
    }

    if (slide.getNotesPage().getSpeakerNotesShape().getText().asRenderedString().trim() === "chart") {
      return chartSlideNum = indy;
    }
  })

  // Get Chart
  const chart = chartData.getCharts()[0]

  newDeck.getSlides()[chartSlideNum].insertSheetsChartAsImage(chart).setWidth(500).scaleHeight(0.7).setTop(100).setLeft(50)

  // Insert Existing Slide
  const insertSlide = newDeck.getSlides()[insertSlideNum]

  var newSlidesAdded = 0;
  const rows = deckData.getDataRange().getValues()
  rows.forEach(function(row, index) {
    if (index === 0) return;
    if (!!row[6]) {
      SlidesApp.openById(slideGalleryId).getSlides().forEach((temp, indy) => {
        if (temp.getNotesPage().getSpeakerNotesShape().getText().asRenderedString().trim() === row[6]) {
          let slide = SlidesApp.openById(slideGalleryId).getSlides()[indy]
          newDeck.insertSlide(insertSlideNum + index, slide)
          newSlidesAdded = newSlidesAdded + 1
        }
      })
    }
  })

  newDeck.getSlides().forEach((slide) => slide.replaceAllText("{{companyName}}", companyName))
  newDeck.getSlides().forEach((slide) => slide.replaceAllText("{{date}}", presentationDate))
}

function updateTemplateSlides() {
  var presId = "1vT5PGGD_G8_kUDoUFF_Ow9CetVX2FxGmuuq-04Hiz68"
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Deck Generator")
  var slideCount = SlidesApp.openById(presId).getSlides().length
  var templateSlides = []

  SlidesApp.openById(presId).getSlides().forEach((slide, indy) => {
    templateSlides.push(slide.getNotesPage().getSpeakerNotesShape().getText().asRenderedString().trim())
  })
  sheet.getRange(2, 9, slideCount).setValues(templateSlides.map((i, index) => [i]))
}

function getParentFolder(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var file = DriveApp.getFileById(ss.getId());
  var folders = file.getParents();
  while (folders.hasNext()){
    return folders.next().getId();
  }
}
