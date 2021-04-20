const handleIncomingCall = ({ call }) => {
  cleanData();
  currentCall = call;
  setUpCall({ currentCall, isIncoming: true, destination: call.number() });
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
          receiveVideo: true,
        }
      );
    document.getElementById('incoming-call').classList.add('hidden');
  };
  document.getElementById('incoming-call-decline').onclick = () => {
    call && call.decline();
  };
};

const createCall = () => {
  const destination = document.getElementById('input-number').value.trim();
  if (!destination) return;
  cleanData();
  currentCall = sdk.call({
    number: destination,
    video: {
      sendVideo: document.getElementById('input-send_video_call').checked,
      receiveVideo: true,
    },
    H264first: document.getElementById('input-h264_call'),
  });

  disableConnectingSettings();

  setUpCall({ currentCall, destination });
};

const createTransferCall = () => {
  const destination = document.getElementById('input-number-transfer').value;
  transferCall = sdk.call({
    number: destination,
    video: {
      sendVideo: document.getElementById('input-send_video_call-transfer').checked,
      receiveVideo: true,
    },
    H264first: document.getElementById('input-h264_call-transfer'),
  });
  holdCall(currentCall, document.getElementById('hold-btn'));
  document.getElementById('input-number-transfer').disabled = true;
  document.getElementById('transfer-btn-group').classList.add('hidden');
  document.getElementById('transfer-confirm-btn-group').classList.remove('hidden');

  transferCall.addEventListener(VoxImplant.CallEvents.Connected, (e) => {
    transferCall.setActive(true);
    document.getElementById('confirm-transfer-btn').addEventListener('click', () => {
      sdk.transferCall(currentCall, transferCall);
      document.querySelector('.action_connecting').classList.add('hidden');
      document.querySelector('.action_transfer').classList.remove('hidden');
      callStateDisconnected();
    });
  });

  transferCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
    console.log(`Transfer call disconnected`);
    transferCallStateDisconnected();
  });

  transferCall.addEventListener(VoxImplant.CallEvents.Failed, (e) => {
    console.log(`Transfer call failed`);
    transferCallStateDisconnected();
  });
};

const setUpCall = ({ currentCall, isConf, isIncoming, destination }) => {
  let prefix = isConf ? 'Call conference to' : 'Call to';
  if (isIncoming) prefix = 'Incoming call from';
  logger.write(`${prefix} ${destination}...`);

  currentCall.addEventListener(VoxImplant.CallEvents.EndpointAdded, onEndpointAdded);

  currentCall.addEventListener(VoxImplant.CallEvents.Updated, (e) => {
    console.log('CALL UPDATED', e);
    logger.write(`CALL UPDATED: ${simpleStringify(e)}`);
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Connected, (e) => {
    if (e.call.settings.incoming) {
      disableConnectingSettings();
    }
    callStateConnected();
  });

  currentCall.addEventListener(VoxImplant.CallEvents.Disconnected, () => {
    logger.write(`${prefix} was disconnected`);
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
    console.log('CALL MediaElementCreated', e);
    logger.write(`CALL MediaElementCreated: ${simpleStringify(e)}`);
  });
};

const holdCall = (call, button) => {
  if (call) {
    if (button.innerText === 'Unhold') {
      button.innerText = 'Hold';
      call.setActive(true);
    } else {
      button.innerText = 'Unhold';
      call.setActive(false);
    }
  }
};
