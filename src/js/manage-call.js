const handleIncomingCall = ({ call }) => {
  cleanData();
  currentCall = call;
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

const createCall = () => {
  cleanData();
  const numberInput = document.getElementById('input-number');
  const number = numberInput.value.trim();
  if (!number) {
    numberInput.classList.add('invalid');
    numberInput.onkeypress = () => numberInput.classList.remove('invalid');
    return;
  }
  currentCall = sdk.call({
    number,
    video: {
      sendVideo: document.getElementById('input-send_video_call').checked,
      receiveVideo: true
    },
    H264first: document.getElementById('input-h264_call')
  });

  disableConnectingSettings();

  setUpCall({ currentCall, number });
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
      document.querySelector('.action_connecting').classList.add('hidden');
      document.querySelector('.action_transfer').classList.remove('hidden');
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

const setUpCall = ({ currentCall, isIncoming, number, viewer }) => {
  let prefix = isConference ? 'Call conference to' : 'Call to';
  if (isIncoming) prefix = 'Incoming call from';
  logger.write(`${prefix} ${number}...`);
  document.getElementById('end-call').onclick = () => {
    currentCall.hangup();
  }
  currentCall.addEventListener(VoxImplant.CallEvents.EndpointAdded, onEndpointAdded);

  currentCall.addEventListener(VoxImplant.CallEvents.Updated, (e) => {
    logger.write(`CALL UPDATED: ${simpleStringify(e)}`);
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Connected, () => {
    startTimer();
    if (isIncoming || viewer) {
      disableConnectingSettings();
    }
    if (viewer) {
      disableDropdownSelect();
    }
    if (!viewer) {
      callStateConnected();
    }
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
    stopTimer();
    logger.write(`${prefix} ${number} was disconnected`);
    document.getElementById('decline-btn-group').classList.add('hidden');
    document.getElementById('call-btn-group').classList.remove('hidden');
    callStateDisconnected();
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Failed, (e) => {
    logger.write(`${prefix} conference failed: ${e.reason} (${e.code})`);
    document.getElementById('decline-btn-group').classList.add('hidden');
    document.getElementById('call-btn-group').classList.remove('hidden');
    callStateDisconnected();
  });

  currentCall.addEventListener(VoxImplant.CallEvents.MediaElementCreated, (e) => {
    logger.write(`CALL MediaElementCreated: ${simpleStringify(e)}`);
  });
};

const holdCall = () => {
  const holdButton = document.getElementById('hold-btn')
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
