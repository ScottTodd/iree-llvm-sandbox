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

  // Alternate form like `vm.rodata @ssa_name dense<...`
  //   ^\s*                 Skip over whitespace at the start of the line
  //   (?<dialect>[a-z]+)   Capture group for the first part of the op name
  //   \.                   Dot literal
  const alternateFormOpRegex = /^\s*(?<dialect>[a-z]+)\./;

  // Miscellaneous lines that aren't directly ops themselves
  //   ^\s*                 Skip over whitespace at the start of the line
  //   }                    Close scope
  //   ])                   Close scope
  //   \^                   Enter basic block
  //   \/                   // comment
  //   module               Keyword
  //   func                 Keyword
  //   return               Keyword
  const skipRegex = /^\s*(}|\]\)|\^|\/|module|func|return)/;

  const kSkipSections = false;
  const skipSectionsRegex = /After\s(Canonicalizer|CSE|SymbolDCE)/;

  // TODO(scotttodd): other forms:
  //  Assignment (should skip):
  //    %c1 = (%buffer_0 : !hal.buffer)[%c96, %c4]
  //  std.cond_br (control flow):
  //    cond_br %0, ^bb1, ^bb2
  //    br ^bb3(%exe : !hal.executable)
  //    br ^bb3(%4 : !hal.executable)

  opCounts = {};

  // Normalize line endings.
  sectionText.replace(/\r\n/g, '\n');

  const sectionLines = sectionText.split('\n');
  if (kSkipSections && sectionLines[0].match(skipSectionsRegex)) {
    return null;
  }
  console.log('Section: ' + sectionLines[0]);

  for (const line of sectionLines) {
    // Skip empty or obviously broken lines.
    if (!line || line.length < 5) {
      continue;
    }

    const matches = line.match(nonStdOpRegex);
    if (matches) {
      const dialect = matches.groups['dialect'];
      opCounts[dialect] = ++opCounts[dialect] || 1;
      continue;
    }

    const stdMatches = line.match(stdOpRegex);
    if (stdMatches) {
      opCounts['standard'] = ++opCounts['standard'] || 1;
      continue;
    }

    const alternateMatches = line.match(alternateFormOpRegex);
    if (alternateMatches) {
      const dialect = alternateMatches.groups['dialect'];
      opCounts[dialect] = ++opCounts[dialect] || 1;
      continue;
    }

    const skipMatches = line.match(skipRegex);
    if (skipMatches) {
      continue;
    }

    opCounts['unknown'] = ++opCounts['unknown'] || 1;
    // console.log('Unknown line: ' + line);
  }

  return opCounts;
}

// TODO(scotttodd): stream via `createReadStream` (for files larger th an 256MB)
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
    if (opCounts) {
      console.log(opCounts);
    }
  }
});
