import Promise from 'bluebird';

export function extractFilesFromEvent(event) {
  return extractFilesFromItems(event.dataTransfer.items
      || event.dataTransfer.files);
}

export function extractFilesFromItems(items) {
  const isWebKitUpload = items
    && items[0]
    && items[0].webkitGetAsEntry;

  if (isWebKitUpload) {
    let entries = Array.from(items).map(item => {
      return item.webkitGetAsEntry();
    });

    return resolveEntries(entries);
  } else {
    return Promise.resolve(Array.from(items));
  }
}

// recursively read files
function resolveEntries(entries) {
  const flattened = [];
  const reads = Array.from(entries).map(entry => {
    if (entry.isDirectory) {
      return readDirectory(entry)
        .then(entries => resolveEntries(entries))
        .then(files => flattened.push(...files));
    } else {
      return entryToFile(entry)
        .then(file => flattened.push(file));
    }
  });

  return Promise.all(reads)
    .then(() => flattened);
}

function entryToFile(entry) {
  return new Promise((resolve, _reject) => {
    entry.file(data => {
      let {fullPath, isDirectory, isFile} = entry;
      resolve({fullPath, isDirectory, isFile, data});
    });
  });
}

function readDirectory(directory) {
  let reader = directory.createReader();
  return new Promise((resolve, _reject) => {
    var entries = [];

    function readEntries() {
      reader.readEntries(function (results) {
        if (!results.length) {
          entries.sort();
          resolve(entries);
        } else {
          entries.push(...results);
          readEntries();
        }
      }, function (err) {
        console.error(err);
      });
    }

    readEntries();
  });
}

