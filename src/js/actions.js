const inputNumber = document.getElementById('input-number');
const inputNumberTransfer = document.getElementById('input-number-transfer');
const callButton = document.getElementById('call-btn');
const oneToOneCallSelect = document.getElementById('one-to-one-call-btn');
const conferenceCallSelect = document.getElementById('conf-call-btn');
const joinAsViewerButton = document.getElementById('viewer-button');
const showLocalVideoInput = document.getElementById('show-local-video-switch');
const startSendingVideoInput = document.getElementById('start-sending-video');
const startSendingVideoSwitchGroup = document.getElementById('switch-start-video');
const shareButton = document.getElementById('start-sharing');
const holdButton = document.getElementById('hold-btn');
const muteInput = document.getElementById('mute');
const muteSwitchGroup = document.getElementById('switch-mute');
const callOrConferenceRadioSelectors = document.querySelectorAll('.radio-container');
const sendVideoCheck = document.getElementById('input-send_video_call');
const H264Check = document.getElementById('input-h264_call');
const receiveVideoCheck = document.getElementById('input-receive_video_call');
const simulcastCheck = document.getElementById('input-simulcast');
const callButtonsGroup = document.getElementById('call-btn-group');
const declineButtonGroup = document.getElementById('decline-btn-group');
const transferButton = document.getElementById('transfer');
const callTransferButton = document.getElementById('call-btn-transfer');
const simulcastContainer = document.getElementById('input-simulcast-container');
const connectingBoard = document.querySelector('.action_connecting');
const transferBoard = document.querySelector('.action_transfer');
const backToCallButton = document.getElementById('back-to-call-btn');
const sendVideoIncomingCall = document.getElementById('input-send_video_incoming_call');
const showLocalVideoCheck = document.getElementById('input-show-local-video');
const replaceVideoCheck = document.getElementById('input-replace-video');
const stopSharingButton = document.getElementById('stop-sharing');
const transferButtonsGroup = document.getElementById('transfer-btn-group');
const transferConfirmButtonGroup = document.getElementById('transfer-confirm-btn-group');
const endpointsTable = document.getElementById('endpoints-table');
const timer = document.querySelector('.timer');
const remoteVideoHolder = document.querySelector('.remote-video-holder');
const checkboxGroups = document.querySelectorAll('.checkbox_group');
const localVideo = document.querySelector('.local-video-holder');
const noVideoIcon = localVideo.querySelector('.white-circle');

// add listeners to access functionality
const accessFunctionality = () => {
  callButton.onclick = createCall;
  joinAsViewerButton.onclick = joinAsViewer;
  showLocalVideoInput.onchange = showLocalVideo;
  startSendingVideoInput.onchange = sendingVideo;
  shareButton.onclick = startShare;
  holdButton.onclick = holdCall;
  muteInput.onchange = muteAudio;
};

// disable the caller's connection settings after the call started
const disableConnectingSettings = () => {
  callOrConferenceRadioSelectors.forEach((radio) => radio.classList.add('disabled'));
  inputNumber.disabled = true;
  sendVideoCheck.disabled = true;
  H264Check.disabled = true;
  receiveVideoCheck.disabled = true;
  oneToOneCallSelect.disabled = true;
  simulcastCheck.disabled = true;
  conferenceCallSelect.disabled = true;
  callButtonsGroup.classList.add('hidden');
  declineButtonGroup.classList.remove('hidden');
  if (oneToOneCallSelect.checked) {
    transferButton.classList.remove('hidden');
  } else {
    holdButton.classList.add('hidden');
  }
};

// manages connection view functionality
const manageConnectingView = () => {
  // adds the possibility to join as a viewer if call conference selected
  conferenceCallSelect.onchange = () => {
    if (conferenceCallSelect.checked) {
      joinAsViewerButton.classList.remove('hidden');
      simulcastContainer.classList.remove('hidden');
    }
  };

  // removes the possibility to join as a viewer if call conference selected
  oneToOneCallSelect.onchange = () => {
    if (oneToOneCallSelect.checked) {
      joinAsViewerButton.classList.add('hidden');
      simulcastContainer.classList.add('hidden');
    }
  };

  // check receiveVideo if sendVideo checked, because video calls stable work without parameter receiveVideo is not guaranteed
  sendVideoCheck.onchange = () => {
    if (sendVideoCheck.checked) receiveVideoCheck.checked = true;
  };

  // adds the transfer action view
  transferButton.onclick = () => {
    connectingBoard.classList.add('hidden');
    transferBoard.classList.remove('hidden');
  };
  transferButton.onkeypress = () => {
    connectingBoard.classList.add('hidden');
    transferBoard.classList.remove('hidden');
  };

  // return call action view to connecting state
  backToCallButton.onclick = () => {
    connectingBoard.classList.remove('hidden');
    transferBoard.classList.add('hidden');
  };

  // return call action view to connecting state if the transfer canceled
  document.getElementById('cancel-transfer-btn').onclick = () => {
    connectingBoard.classList.remove('hidden');
    transferBoard.classList.add('hidden');
  };
};

// make UIelements to manage call, share video and access functionality available
const callStateConnected = (video) => {
  if (sendVideoCheck.checked || sendVideoIncomingCall.checked) {
    startSendingVideoInput.checked = true;
  }
  if (video) {
    showLocalVideoCheck.disabled = false;
    replaceVideoCheck.disabled = false;
    shareButton.disabled = false;
    stopSharingButton.disabled = false;
    startSendingVideoSwitchGroup.classList.remove('disabled');
    startSendingVideoInput.disabled = false;
  }
  muteInput.disabled = false;
  muteSwitchGroup.classList.remove('disabled');
  callTransferButton.onclick = createTransferCall;

  // send dtmf to VoxEngine scenario
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && currentCall) {
      // keys which is used to send dtmf
      const keysToSend = [
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '*',
        '#',
        'a',
        'b',
        'c',
        'd',
        'e',
      ];
      if (keysToSend.includes(e.key)) {
        currentCall.sendTone(e.key);
      }
    }
  });
};

// return UI elements to the initial state before call
const callStateDisconnected = () => {
  enableDropdownSelect();
  if (!showLocalVideoInput.checked) {
    localVideo.querySelector('.full_screen_icon') !== null &&
      localVideo.querySelector('.full_screen_icon').remove();
    noVideoIcon.classList.remove('hidden');
  }
  remoteVideoHolder.innerHTML = '';
  remoteVideoHolder.classList.add('empty');
  inputNumber.value = '';
  oneToOneCallSelect.checked = true;
  showLocalVideoCheck.disabled = true;
  replaceVideoCheck.disabled = true;
  shareButton.disabled = true;
  stopSharingButton.disabled = true;
  muteInput.checked = false;
  muteInput.disabled = true;
  startSendingVideoInput.checked = false;
  startSendingVideoInput.disabled = true;
  muteSwitchGroup.classList.add('disabled');
  startSendingVideoSwitchGroup.classList.add('disabled');
  inputNumber.disabled = false;
  inputNumberTransfer.disabled = false;
  declineButtonGroup.classList.add('hidden');
  callButtonsGroup.classList.remove('hidden');
  holdButton.classList.remove('hidden');
  simulcastContainer.classList.add('hidden');
  joinAsViewerButton.classList.add('hidden');
  transferButton.classList.add('hidden');
  sendVideoCheck.disabled = false;
  receiveVideoCheck.disabled = false;
  H264Check.disabled = false;
  simulcastCheck.disabled = false;
  callOrConferenceRadioSelectors.forEach((radio) => radio.classList.remove('disabled'));
  oneToOneCallSelect.disabled = false;
  conferenceCallSelect.disabled = false;
  checkboxGroups.forEach((group) => {
    group.querySelectorAll('input').forEach((input) => (input.checked = false));
  });
};

// return UI elements to the initial state before call
const transferCallStateDisconnected = () => {
  inputNumberTransfer.disabled = false;
  transferButtonsGroup.classList.remove('hidden');
  transferConfirmButtonGroup.classList.add('hidden');
  connectingBoard.classList.remove('hidden');
  transferBoard.classList.add('hidden');
};

// enable/disable the possibility to change sharing settings depending on sharing state
const changeAccessToSharingElements = (access = false) => {
  shareButton.disabled = access;
  showLocalVideoCheck.disabled = access;
  replaceVideoCheck.disabled = access;
};

// clear fields with logs, endpoints info
const cleanData = () => {
  logger.clear();
  endpointsTable.innerHTML = '';
  timer.innerText = '00:00:00';
};

const addFullScreenIconToLocalVideo = () => {
  const localVideoHolder = document.querySelector('.local-video-holder');
  const fullScreenIcon = document.createElement('div');
  fullScreenIcon.classList.add('full_screen_icon');
  localVideoHolder.querySelector('.full_screen_icon') === null &&
    localVideoHolder.appendChild(fullScreenIcon);
  fullScreenIcon.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      localVideoHolder.querySelector('video').classList.remove('full_screen');
    } else {
      localVideoHolder.requestFullscreen();
      localVideoHolder.querySelector('video').classList.add('full_screen');
    }
  });
};
