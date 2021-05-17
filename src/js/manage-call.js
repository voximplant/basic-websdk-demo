// handle an incoming call
const handleIncomingCall = ({ call }) => {
  currentCall = call;
  cleanData();
  setUpCall({ currentCall, isIncoming: true, number: call.number() });
  document.getElementById('incoming-call').classList.remove('hidden');
  document.getElementById('caller-number').innerText = call.number();
  document.querySelector('.close-incoming-window').onclick = () => {
    document.getElementById('incoming-call').classList.add('hidden');
  };
  document.getElementById('incoming-call-answer').onclick = () => {
    call &&
      call.answer(
        '',
        {},
        {
          sendVideo: document.getElementById('input-send_video_incoming_call').checked,
          receiveVideo: true
        }
      );
    document.getElementById('incoming-call').classList.add('hidden');
  };
  document.getElementById('incoming-call-decline').onclick = () => {
    document.querySelector('.incoming-call').classList.add('hidden');
    call && call.decline();
  };
};

// create a call or conference
const createCall = () => {
  cleanData();
  const numberInput = document.getElementById('input-number');
  const number = numberInput.value.trim();
  if (!number) {
    numberInput.classList.add('invalid');
    numberInput.onkeypress = () => numberInput.classList.remove('invalid');
    return;
  }

  const sendVideo = document.getElementById('input-send_video_call').checked || false;
  const receiveVideo = document.getElementById('input-receive_video_call').checked || false;
  const H264first = document.getElementById('input-h264_call').checked || false;
  const simulcast = document.getElementById('input-simulcast').checked || false;

  const callSettings = { number };
  if (receiveVideo && !sendVideo) {
    callSettings.video = { sendVideo, receiveVideo };
    callSettings.H264first = H264first;
  }
  if (sendVideo) {
    callSettings.video = { sendVideo, receiveVideo };
  }

  if (document.getElementById('conf-call-btn').checked) {
    callSettings.simulcast = simulcast;
    currentCall = sdk.callConference(callSettings);
  } else {
    currentCall = sdk.call(callSettings);
  }
  disableConnectingSettings();
  setUpCall({ currentCall, number, video: sendVideo || receiveVideo });
};

const createTransferCall = () => {
  const numberInput = document.getElementById('input-number-transfer');
  const number = numberInput.value;
  if (!number) {
    numberInput.classList.add('invalid');
    numberInput.onkeypress = () => numberInput.classList.remove('invalid');
    return;
  }
  transferCall = sdk.call({
    number,
    video: {
      sendVideo: document.getElementById('input-send_video_call-transfer').checked,
      receiveVideo: true
    },
    H264first: document.getElementById('input-h264_call-transfer')
  });
  holdCall();
  document.getElementById('input-number-transfer').disabled = true;
  document.getElementById('transfer-btn-group').classList.add('hidden');
  document.getElementById('transfer-confirm-btn-group').classList.remove('hidden');

  transferCall.addEventListener(VoxImplant.CallEvents.Connected, () => {
    transferCall.setActive(true);
    document.getElementById('confirm-transfer-btn').addEventListener('click', () => {
      sdk.transferCall(currentCall, transferCall);
      document.querySelector('.action_connecting').classList.remove('hidden');
      document.querySelector('.action_transfer').classList.add('hidden');
      callStateDisconnected();
    });
  });

  transferCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
    transferCallStateDisconnected();
  });

  transferCall.addEventListener(VoxImplant.CallEvents.Failed, () => {
    transferCallStateDisconnected();
  });
};

const setUpCall = ({ currentCall, isIncoming, number, viewer, video }) => {
  let prefix = currentCall.settings.isConference ? 'Call conference to' : 'Call to';
  if (isIncoming) prefix = 'Incoming call from';
  logger.write(`${prefix} ${number}...`);
  document.getElementById('end-call').onclick = () => {
    currentCall.hangup();
  };
  currentCall.addEventListener(VoxImplant.CallEvents.EndpointAdded, onEndpointAdded);

  currentCall.addEventListener(VoxImplant.CallEvents.Updated, (e) => {
    logger.write(`CALL UPDATED: ${simpleStringify(e)}`);
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Connected, () => {
    startTimer();
    if (isIncoming || viewer) {
      disableConnectingSettings();
    }
    if (viewer || (!video && !isIncoming)) {
      disableDropdownSelect(viewer);
    }
    if (isIncoming) {
      callStateConnected(true);
    } else if (!viewer) {
      callStateConnected(video);
    }
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
    stopTimer();
    logger.write(`${prefix} ${number} was disconnected`);
    callStateDisconnected();
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Failed, (e) => {
    logger.write(`${prefix} ${number} failed: ${e.reason} (${e.code})`);
    callStateDisconnected();
  });

  currentCall.addEventListener(VoxImplant.CallEvents.MediaElementCreated, (e) => {
    logger.write(`CALL MediaElementCreated: ${simpleStringify(e)}`);
  });
};

// toggle the current call activity
const holdCall = () => {
  const holdButton = document.getElementById('hold-btn');
  if (currentCall) {
    if (holdButton.innerText === 'Unhold') {
      holdButton.innerText = 'Hold';
      currentCall.setActive(true);
    } else {
      holdButton.innerText = 'Unhold';
      currentCall.setActive(false);
    }
  }
};

// create a call to conference as a viewer
const joinAsViewer = () => {
  const number = document.getElementById('input-number').value.trim();
  if (!number) return;
  cleanData();
  if (sdk.joinAsViewer) {
    currentCall = sdk.joinAsViewer(number);
    setUpCall({ currentCall, number, viewer: true });
  } else {
    logger.write("This SDK version doesn't allow to call as viewer");
  }
};
