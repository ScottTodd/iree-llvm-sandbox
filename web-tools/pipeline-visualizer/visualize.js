const fs = require('fs');
const yargs = require('yargs');

const argv =
    yargs
        .command('input', 'path to an input .mlir file', {
          input: {
            description: 'path to input .mlir file (from -print-ir-after-all)',
            alias: 'i',
            type: 'string',
          }
        })
        .help()
        .alias('help', 'h')
        .argv;

if (!argv.input) {
  console.log('Missing input arg');
  return;
}

function countOpsInSection(sectionText) {
  // Search for lines that look like ops and extract the dialect name.
  //   ^\s*                 Skip over whitespace at the start of the line
  //   %[0-9,a-z,_,A-Z]+    SSA value (% then alphanumeric with some symbols)
  //   \s\=\s               Space, equals, space
  //   "?                   Optional quote (accept `mhlo.add` and `"mhlo.add"`)
  //   (?<dialect>[a-z]+)   Capture group for the first part of the op name
  //   \.                   Dot literal
  const nonStdOpRegex = /^\s*%[0-9,a-z,_,A-Z]+\s\=\s"?(?<dialect>[a-z]+)\./;
  const stdOpRegex = /^\s*%[0-9,a-z,_,A-Z]+\s\=\s"?(?<dialect>[a-z]+)/;

  opCounts = {};

  const sectionLines = sectionText.split('\n');
  for (const line of sectionLines) {
    // console.log('Line: ' + line);

    const matches = line.match(nonStdOpRegex);
    if (matches) {
      const dialect = matches.groups['dialect'];
      // console.log(dialect);
      // console.log();

      if (opCounts[dialect]) {
        opCounts[dialect]++;
      } else {
        opCounts[dialect] = 1;
      }
      continue;
    }

    const stdMatches = line.match(stdOpRegex);
    if (stdMatches) {
      if (opCounts['standard']) {
        opCounts['standard']++;
      } else {
        opCounts['standard'] = 1;
      }
    }
  }

  return opCounts;
}

console.log('Reading input file: \"' + argv.input + '\"');
fs.readFile(argv.input, 'utf8', function(error, data) {
  if (error) {
    return console.error(error);
  }

  console.log('Input file loaded, length: ' + data.length);

  let textSections = [];
  const rawTextLines = data.split('\n');
  for (const rawTextLine of rawTextLines) {
    if (rawTextLine.startsWith('// ***')) {
      textSections.push(rawTextLine);
      continue;
    } else {
      textSections[textSections.length - 1] += '\n' + rawTextLine;
    }
  }

  console.log('Input parsed into ' + textSections.length + ' sections');

  for (let i = 0; i < textSections.length; ++i) {
    // if (i > 0) {
    //   continue;
    // }

    const sectionText = textSections[i];
    opCounts = countOpsInSection(sectionText);
    // console.log('Ops in section #' + i + ': ');
    console.log(opCounts);
  }
});
