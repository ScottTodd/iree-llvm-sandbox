function fetchData() {
  fetch('./data/simple_abs_vmvx_06_30_ops.json')
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        const seriesData = processRawData(data);
        setupChart(seriesData, 'simple_abs_vmvx');
      });
}

function processRawData(rawData) {
  console.log('got', rawData.length, 'rows of data');

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

  const colors = [
    '#ff0029',
    '#377eb8',
    '#66a61e',
    '#984ea3',
    '#00d2d5',
    '#ff7f00',
    '#af8d00',
  ];

  // TODO(scotttodd): optimize iteration scheme (this has redundant iterations)
  const seriesData = [];
  for (let i = 0; i < dialectNamesSorted.length; ++i) {
    const dialectName = dialectNamesSorted[i];
    const dataPoints = [];
    for (let j = 0; j < rawData.length; ++j) {
      let count = 0;
      const dialectOpCounts = rawData[j]['dialectOpCounts'];
      for (let k = 0; k < dialectOpCounts.length; ++k) {
        if (dialectOpCounts[k]['dialectName'] == dialectName) {
          count = dialectOpCounts[k]['opCount'];
          break;
        }
      }
      dataPoints.push({x: j, y: count, passName: rawData[j]['passName']});
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
    axisX: {interval: 10, intervalType: 'number'},
    axisY: {
      valueFormatString: '#0 ops',
      gridColor: '#B6B1A8',
      tickColor: '#B6B1A8'
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

  const tooltipTitle = '<span style = "color:Black;">' +
      e.entries[0].dataPoint['passName'] + '</span><br/>';

  const tooltipFooter =
      '<span style = "color:Black">Total:</span> ' + totalOps + ' ops<br/>';

  return (tooltipTitle.concat(seriesTooltips)).concat(tooltipFooter);
}

window.onload = function() {
  fetchData();
}
