function onOpen() {
  SpreadsheetApp.getUi().createMenu("Generate Charts")
    .addItem("Generate Combo Chart", "comboChart")
    .addToUi()
}

function comboChart() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const startingDate = sheet.getRange(2, 1).getValue();
  const endingDate = sheet.getRange(lastRow, 1).getValue()
  const title = `NVDA Stock Performance ${Utilities.formatDate(startingDate, "GMT", "MMM dd, YYYY")} to ${Utilities.formatDate(endingDate, "GMT", "MMM dd, YYYY")}`
  const chart = sheet.newChart();
  const range = sheet.getRange(1, 1, lastRow, 3)

  chart.addRange(range).setChartType(Charts.ChartType.COMBO)
  .setNumHeaders(1)
  .setPosition(2, 4, 0, 0)
  .setOption('title', title)
  .setOption('backgroundColor', '#1e1f23')
  .setOption('titleTextStyle', { fontName: 'Helvetica Neue', bold: true, color: '#FFF' })
  .setOption('legend', {
    position: 'bottom',
    textStyle: { color: '#FFF' },
  })
  // .setOption('width', 1000)
  .setOption('hAxis.textStyle.color', '#FFF')
  .setOption('hAxis', {
    textStyle: { fontName: 'Helvetica Neue' },
    slantedText: true,
    slantedTextAngle: 30,
  })
  .setOption('vAxes', {
    0: { // Left Y-axis
      gridlines: { color: '#535354' },
      textStyle: { color: '#FFF', fontName: 'Helvetica Neue' },
    },
    1: { // Right Y-axis
      gridlines: { color: '#535354' },
      textStyle: { color: '#FFF', fontName: 'Helvetica Neue' },
    }
  })
  .setOption('series', {
    0: {
      type: 'line',
      color: '#008000',
      lineWidth: 3,
      targetAxisIndex: 0 // left Y-axis
    },
    1: {
      type: 'bars',
      color: '#FF0000',
      targetAxisIndex: 1 // right Y-axis
    }
  });
  sheet.insertChart(chart.build());
}
