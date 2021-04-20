function simpleStringify (object) {
  const simpleObject = Object.keys(object)
    .filter((item) => typeof object[item] === 'string')
    .reduce((acc, item) => {
      acc[item] = object[item];
      return acc;
    }, {});
  return JSON.stringify(simpleObject);
}

// Logging into a text area
const Logger = function (element) {
  const logRecords = [];
  const textArea = element;
  this.write = function (logRecord) {
    logRecords.push(logRecord.toString());
    render();
  };
  this.clear = function () {
    logRecords.length = 0;
    textArea.value = '';
  };

  function render () {
    textArea.value = logRecords.join('\r\n');
    textArea.scrollTop = textArea.scrollHeight;
  }
};
