'use strict';

//Object for logging into a textarea
const cLogger = function (element) {
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

  function render() {
    textArea.value = logRecords.join('\r\n');
    textArea.scrollTop = textArea.scrollHeight;
  }
};

function createSDPtextarea(evt, sdp) {
  const reinviteContainer = document.getElementById('action_reinvite');
  const title = document.createElement('h3');
  title.innerText = `Reinvite ${evt}-${window.iconfig}`;
  reinviteContainer.appendChild(title);
  const textareaContainer = document.createElement('div');
  textareaContainer.classList.add('textarea-container');
  const textarea = document.createElement('textarea');
  textarea.id = `${evt}-${window.iconfig}`;
  textarea.value = getInfoFromSDP(sdp);
  textareaContainer.appendChild(textarea);
  reinviteContainer.appendChild(textareaContainer);
}

// global variable counting reinvites
window.iconfig = 0;

let events = ['createOffer'];
events.forEach((evt) => {
  const orig = window.RTCPeerConnection.prototype[evt];
  window.RTCPeerConnection.prototype[evt] = function () {
    let promise = orig.apply(this, arguments);
    promise.then((sdp) => {
      if (window.iconfig > 0) {
        window.iconfig++;
        createSDPtextarea(` ${evt}`, sdp.sdp);
      } else {
        window.iconfig++;
      }
    });
    return promise;
  };
});

// get SDP message
function getServerSDP(client) {
  client.voxSignaling._onWSData = client.voxSignaling.onWSData;
  client.voxSignaling.onWSData = (data) => {
    let parsedData = JSON.parse(data);
    let evnts = ['handleReInvite', 'handleIncomingConnection'];
    if (~evnts.indexOf(parsedData.name)) {
      if (parsedData.name === 'handleIncomingConnection') {
        window.iconfig = 0;
      }
      if (parsedData.name === 'handleIncomingConnection' || parsedData.name === 'handleReInvite')
        window.iconfig++;
      if (parsedData.name === 'handleReInvite') {
        let sdp = parsedData.params.find(
          (item) => typeof item === 'string' && !!~item.indexOf('v=')
        );
        if (sdp) {
          createSDPtextarea(` ${parsedData.name}`, sdp);
        }
      }
    }
    client.voxSignaling._onWSData(data);
  };
}

// extracts needed info from SDP message
function getInfoFromSDP(sdp) {
  const lines = sdp.split(/(\r\n|\r|\n)/).filter(RegExp.prototype.test.bind(/^([a-z])=(.*)/));
  let neededInfo = ['m=audio', 'm=video', 'sendrecv', 'sendonly', 'recvonly', 'inactive'];
  const info = [];
  lines.forEach((line) => {
    neededInfo.forEach((param) => {
      if (~line.indexOf(param)) info.push(line);
    });
  });
  return info.join('\r\n') + '\r\n';
}

function simpleStringify(object) {
  const simpleObject = Object.keys(object)
    .filter((item) => typeof object[item] === 'string')
    .reduce((acc, item) => {
      acc[item] = object[item];
      return acc;
    }, {});
  return JSON.stringify(simpleObject);
}
