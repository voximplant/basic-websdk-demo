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


// add listeners to access functionality
const accessFunctionality = () => {
  callButton.onclick = oneToOneCallSelect.checked ? createCall : callConference;
  joinAsViewerButton.onclick = joinAsViewer;
  showLocalVideoInput.onchange = showLocalVideo;
  startSendingVideoInput.onchange = sendingVideo;
  shareButton.onclick = startShare;
  holdButton.onclick = holdCall;
  muteInput.onchange = muteAudio;
};

// disable connecting settings of the caller after call started
const disableConnectingSettings = () => {
  callOrConferenceRadioSelectors.forEach((radio) => radio.classList.add('disabled'));
  inputNumber.disabled = true;
  sendVideoCheck.disabled = true;
  H264Check.disabled = true;
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

// manages connecting view functionality
const manageConnectingView = () => {
  // adds possibility to join as a viewer if call conference selected
  conferenceCallSelect.onchange = () => {
    if (conferenceCallSelect.checked) {
      joinAsViewerButton.classList.remove('hidden');
      simulcastContainer.classList.remove('hidden');
    }
  };

  // removes possibility to join as a viewer if call conference selected
  oneToOneCallSelect.onchange = () => {
    if (oneToOneCallSelect.checked) {
      joinAsViewerButton.classList.add('hidden');
      simulcastContainer.classList.add('hidden');
    }
  };

  // adds transfer action view
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

  // return call action view to connecting state if transfer canceled
  document.getElementById('cancel-transfer-btn').onclick = () => {
    connectingBoard.classList.remove('hidden');
    transferBoard.classList.add('hidden');
  };
};

// make available UI elements needed to manage call, share video and access to over functionality
const callStateConnected = () => {
  if (
    sendVideoCheck.checked ||
    sendVideoIncomingCall.checked
  ) {
    startSendingVideoInput.checked = true;
  }
  showLocalVideoCheck.disabled = false;
  replaceVideoCheck.disabled = false;
  shareButton.disabled = false;
  stopSharingButton.disabled = false;
  muteInput.disabled = false;
  muteSwitchGroup.classList.remove('disabled');
  startSendingVideoSwitchGroup.classList.remove('disabled');
  startSendingVideoInput.disabled = false;
  callTransferButton.onclick = createTransferCall;
  document.addEventListener('keydown',(e)=>{
    if(e.target.tagName!=='INPUT'&&e.target.tagName!=='TEXTAREA'&&currentCall){
      const keysToSend = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*','#', 'a', 'b', 'c', 'd', 'e'];
      if(keysToSend.includes(e.key)){
        currentCall.sendTone(e.key);
      }
    }
  })
};

// return UI elements to initial state before call
const callStateDisconnected = () => {
  enableDropdownSelect();
  startSendingVideoInput.checked = false;
  showLocalVideoCheck.disabled = true;
  replaceVideoCheck.disabled = true;
  shareButton.disabled = true;
  stopSharingButton.disabled = true;
  muteInput.disabled = true;
  startSendingVideoInput.disabled = true;
  muteSwitchGroup.classList.add('disabled');
  startSendingVideoSwitchGroup.classList.add('disabled');
  inputNumber.disabled = false;
  inputNumberTransfer.disabled = false;
  transferButton.classList.add('hidden');
  sendVideoCheck.disabled = false;
  H264Check.disabled = false;
  simulcastCheck.disabled = false;
  callOrConferenceRadioSelectors.forEach((radio) => radio.classList.remove('disabled'));
  oneToOneCallSelect.disabled = false;
  conferenceCallSelect.disabled = false;
  isConference = false;
};

// return UI elements to initial state before call
const transferCallStateDisconnected = () => {
  inputNumberTransfer.disabled = false;
  transferButtonsGroup.classList.remove('hidden');
  transferConfirmButtonGroup.classList.add('hidden');
  connectingBoard.classList.remove('hidden');
  transferBoard.classList.add('hidden');
};

// enable/disable possibility to change sharing settings depending on sharing state
const changeAccessToSharingElements = (access = false) => {
  shareButton.disabled = access;
  showLocalVideoCheck.disabled = access;
  replaceVideoCheck.disabled = access;
};

// clear fields with logs, endpoints info
const cleanData = () => {
  logger.clear();
  endpointsTable.innerHTML = '';
};
const closeAllSelect = (element) => {
  const arrItems = [];
  const items = document.getElementsByClassName('select-items');
  const selected = document.getElementsByClassName('select-selected');

  for (let i = 0; i < selected.length; i++) {
    if (element == selected[i]) {
      arrItems.push(i);
    }
  }
  for (let i = 0; i < items.length; i++) {
    if (arrItems.indexOf(i)) {
      items[i].classList.add('select-hide');
      items[i].previousSibling.querySelector('.arrow').classList.remove('opened');
    }
  }
}
const toggleSelectItems = (e) => {
  e.stopPropagation();
  closeAllSelect(e.target);
  e.target.nextSibling.classList.toggle('select-hide');
  e.target.querySelector('.arrow').classList.toggle('opened');
};

const disableDropdownSelect = () => {
  document.querySelectorAll('.select-selected').forEach(custSelect => {
      custSelect.classList.add('disabled');
      custSelect.querySelector('.arrow').classList.add('disabled');
      custSelect.removeEventListener('click', toggleSelectItems);
  })
}
