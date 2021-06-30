function fetchData() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let jsonFilePath = urlParams.get('data');
  if (!jsonFilePath) {
    jsonFilePath = './data/bert_encoder_unrolled_llvmaot_06_30_ops.json'
  }
  const fileName = jsonFilePath.substring(
      jsonFilePath.lastIndexOf('/') + 1, jsonFilePath.length - 5);

  fetch(jsonFilePath)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const seriesData = processRawData(data);
        setupChart(seriesData, fileName);
      });
}

function processRawData(rawData) {
  // We'll create one chart series per dialect, so first enumerate all dialects.
  const dialectNamesSet = new Set();
  for (let i = 0; i < rawData.length; ++i) {
    const dialectOpCounts = rawData[i]['dialectOpCounts'];
    for (let j = 0; j < dialectOpCounts.length; ++j) {
      dialectNamesSet.add(dialectOpCounts[j]['dialectName']);
    }
  }
  // Convert to a sorted list.
  const dialectNamesSorted = Array.from(dialectNamesSet).sort();

  // from https://google.github.io/palette.js/ (should integrate directly)
  const colors = [
    '#ff0029',
    '#377eb8',
    '#66a61e',
    '#984ea3',
    '#00d2d5',
    '#ff7f00',
    '#af8d00',
    '#7f80cd',
    '#b3e900',
    '#c42e60',
    '#a65628',
    '#f781bf',
    '#8dd3c7',
    '#bebada',
    '#fb8072',
  ];

  // Create one series per dialect, filling 'dataPoints' with op counts at
  // each pass index (some many be 0).
  // TODO(scotttodd): optimize iteration scheme (this has redundant iterations)
  const seriesData = [];
  for (let i = 0; i < dialectNamesSorted.length; ++i) {
    const dialectName = dialectNamesSorted[i];
    const dataPoints = [];
    for (let j = 0; j < rawData.length; ++j) {
      let opCount = 0;
      const dialectOpCounts = rawData[j]['dialectOpCounts'];
      for (let k = 0; k < dialectOpCounts.length; ++k) {
        if (dialectOpCounts[k]['dialectName'] == dialectName) {
          opCount = dialectOpCounts[k]['opCount'];
          break;
        }
      }
      dataPoints.push({x: j, y: opCount, passName: rawData[j]['passName']});
    }

    seriesData.push({
      type: 'stackedColumn',
      showInLegend: true,
      color: colors[i],
      name: dialectName,
      dataPoints: dataPoints,
    });
  }

  return seriesData;
}

function setupChart(seriesData, titleDataDescription) {
  const mlirOpsChart = new CanvasJS.Chart('chartContainer', {
    // TODO(scotttodd): put model / pipeline / etc. name in title
    zoomEnabled: true,
    title: {
      text: 'MLIR Dialect Ops for ' + titleDataDescription,
      fontFamily: 'arial black',
      fontColor: 'black'
    },
    axisX: {
      interval: 100,
      intervalType: 'number',
      title: 'Pass #',
    },
    axisY: {
      valueFormatString: '#0 ops',
      gridColor: '#B6B1A8',
      tickColor: '#B6B1A8',
      title: 'Op count',
    },
    toolTip: {shared: true, content: toolTipContent},
    data: seriesData,
  });
  mlirOpsChart.render();
}

function toolTipContent(e) {
  let seriesTooltips = '';
  let totalOps = 0;
  for (let i = 0; i < e.entries.length; ++i) {
    const seriesTooltipLine =
        '<span style= "color:' + e.entries[i].dataSeries.color + '"> ' +
        e.entries[i].dataSeries.name + '</span>: ' + e.entries[i].dataPoint.y +
        ' ops<br/>';
    totalOps = e.entries[i].dataPoint.y + totalOps;
    seriesTooltips = seriesTooltips.concat(seriesTooltipLine);
  }

  const tooltipTitle = '<span style = "color:Black;">Pass #' +
      e.entries[0].dataPoint.x + ': ' + e.entries[0].dataPoint['passName'] +
      '</span><br/>';

  const tooltipFooter =
      '<span style = "color:Black">Total:</span> ' + totalOps + ' ops<br/>';

  return (tooltipTitle.concat(seriesTooltips)).concat(tooltipFooter);
}

window.onload = function() {
  fetchData();
}
