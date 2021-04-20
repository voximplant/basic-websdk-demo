// add listeners to access functionality
const accessFunctionality = () => {
  document.getElementById('call-btn').onclick = () => {
    if (document.getElementById('one-to-one-call-btn').checked) {
      createCall();
    } else {
      callConference();
    }
  };

  document.getElementById('viewer-button').onclick = joinAsViewer;

  document.getElementById('show-local-video-switch').onchange = showLocalVideo;

  document.getElementById('start-sending-video').onchange = () => {
    sendingVideo(currentCall, logger);
  };
  document.getElementById('start-sharing').onclick = () => startShare(currentCall);

  document.getElementById('hold-btn').onclick = () =>
    holdCall(currentCall, document.getElementById('hold-btn'));

  // document.getElementById('change-microphone').onclick = () => changeMicrophone(currentCall);
  //
  // document.getElementById('change-camera').onclick = () => changeCamera(currentCall);

  document.getElementById('mute').onchange = () => muteAudio(currentCall);

  document.getElementById('end-call').onclick = () => {
    currentCall.hangup();
  };
};

// disable connecting settings of the caller after call started
const disableConnectingSettings = () => {
  document.querySelectorAll('.radio-container').forEach((radio) => radio.classList.add('disabled'));
  document.getElementById('input-number').disabled = true;
  document.getElementById('input-send_video_call').disabled = true;
  document.getElementById('input-h264_call').disabled = true;
  document.getElementById('one-to-one-call-btn').disabled = true;
  document.getElementById('input-simulcast').disabled = true;
  document.getElementById('conf-call-btn').disabled = true;
  document.getElementById('call-btn-group').classList.add('hidden');
  document.getElementById('decline-btn-group').classList.remove('hidden');
  if (document.getElementById('one-to-one-call-btn').checked) {
    document.getElementById('transfer').classList.remove('hidden');
  } else {
    document.getElementById('hold-btn').classList.add('hidden');
  }
};

// manages connecting view functionality
const manageConnectingView = () => {
  // adds possibility to join as a viewer if call conference selected
  document.getElementById('conf-call-btn').onchange = () => {
    if (document.getElementById('conf-call-btn').checked) {
      document.getElementById('viewer-button').classList.remove('hidden');
      document.getElementById('input-simulcast-container').classList.remove('hidden');
    }
  };

  // removes possibility to join as a viewer if call conference selected
  document.getElementById('one-to-one-call-btn').onchange = () => {
    if (document.getElementById('one-to-one-call-btn').checked) {
      document.getElementById('viewer-button').classList.add('hidden');
      document.getElementById('input-simulcast-container').classList.add('hidden');
    }
  };

  // adds transfer action view
  document.getElementById('transfer').onclick = () => {
    document.querySelector('.action_connecting').classList.add('hidden');
    document.querySelector('.action_transfer').classList.remove('hidden');
  };
  document.getElementById('transfer').onkeypress = () => {
    document.querySelector('.action_connecting').classList.add('hidden');
    document.querySelector('.action_transfer').classList.remove('hidden');
  };

  // return call action view to connecting state
  document.getElementById('back-to-call-btn').onclick = () => {
    document.querySelector('.action_connecting').classList.remove('hidden');
    document.querySelector('.action_transfer').classList.add('hidden');
  };

  // return call action view to connecting state if transfer canceled
  document.getElementById('cancel-transfer-btn').onclick = () => {
    document.querySelector('.action_connecting').classList.remove('hidden');
    document.querySelector('.action_transfer').classList.add('hidden');
  };
};

// make available UI elements needed to manage call, share video and access to over functionality
const callStateConnected = () => {
  if (
    document.getElementById('input-send_video_call').checked ||
    document.getElementById('input-send_video_incoming_call').checked
  ) {
    document.getElementById('start-sending-video').checked = true;
  }
  document.getElementById('input-show-local-video').disabled = false;
  document.getElementById('input-replace-video').disabled = false;
  document.getElementById('start-sharing').disabled = false;
  document.getElementById('stop-sharing').disabled = false;
  document.getElementById('mute').disabled = false;
  document.getElementById('switch-mute').classList.remove('disabled');
  document.getElementById('switch-start-video').classList.remove('disabled');
  document.getElementById('start-sending-video').disabled = false;
  document.getElementById('call-btn-transfer').onclick = createTransferCall;
};

// return UI elements to initial state before call
const callStateDisconnected = () => {
  document.getElementById('start-sending-video').checked = false;
  document.getElementById('input-show-local-video').disabled = true;
  document.getElementById('input-replace-video').disabled = true;
  document.getElementById('start-sharing').disabled = true;
  document.getElementById('stop-sharing').disabled = true;
  document.getElementById('mute').disabled = true;
  document.getElementById('start-sending-video').disabled = true;
  document.getElementById('switch-mute').classList.add('disabled');
  document.getElementById('switch-start-video').classList.add('disabled');
  document.getElementById('input-number').disabled = false;
  document.getElementById('input-number-transfer').disabled = false;
  document.getElementById('transfer').classList.add('hidden');
  document.getElementById('input-number').disabled = false;
  document.getElementById('input-send_video_call').disabled = false;
  document.getElementById('input-h264_call').disabled = false;
  document.getElementById('input-simulcast').disabled = false;
  document
    .querySelectorAll('.radio-container')
    .forEach((radio) => radio.classList.remove('disabled'));
  document.getElementById('one-to-one-call-btn').disabled = false;
  document.getElementById('conf-call-btn').disabled = false;
};

// return UI elements to initial state before call
const transferCallStateDisconnected = () => {
  document.getElementById('input-number-transfer').disabled = false;
  document.getElementById('transfer-btn-group').classList.remove('hidden');
  document.getElementById('transfer-confirm-btn-group').classList.add('hidden');
  document.querySelector('.action_connecting').classList.remove('hidden');
  document.querySelector('.action_transfer').classList.add('hidden');
};

// enable/disable possibility to change sharing settings depending on sharing state
const changeAccessToSharingElements = (access = false) => {
  document.getElementById('start-sharing').disabled = access;
  document.getElementById('input-show-local-video').disabled = access;
  document.getElementById('input-replace-video').disabled = access;
};

// clear fields with logs, endpoints info, reinvite info
const cleanData = () => {
  logger.clear();
  document.getElementById('endpoints-table').innerHTML = '';
  document.getElementById('action_reinvite').innerHTML = '';
};

const dropdown = () => {
  const customSelects = document.getElementsByClassName('custom-select');
  for (const customSelect of customSelects) {
    const nativeSelect = customSelect.querySelector('select');
    const selected = document.createElement('div');
    selected.setAttribute('class', 'select-selected');
    selected.id = nativeSelect.options[nativeSelect.selectedIndex].value;
    selected.innerHTML = nativeSelect.options[nativeSelect.selectedIndex].innerHTML;
    customSelect.appendChild(selected);
    const arrow = document.createElement('div');
    arrow.setAttribute('class', 'arrow');
    selected.appendChild(arrow);
    const allItems = document.createElement('div');
    allItems.setAttribute('class', 'select-items select-hide');
    for (const option of nativeSelect.options) {
      const item = document.createElement('div');
      item.innerHTML = option.innerHTML;
      item.id = option.value;
      item.addEventListener('click', function (e) {
        console.log('Toggle on item: ', this);
        e.stopPropagation();
        const currentNativeSelect = this.parentNode.parentNode.querySelector('select');
        const selectedItem = this.parentNode.previousSibling;
        for (let i = 0; i < currentNativeSelect.length; i++) {
          if (currentNativeSelect.options[i].innerHTML == this.innerHTML) {
            currentNativeSelect.selectedIndex = i;
            selectedItem.innerHTML = this.innerHTML;
            selectedItem.id = this.id;
            if (item.id !== 'Default' && this.parentNode.querySelector('#Default') !== null) {
              this.parentNode.querySelector('#Default').remove();
            }
            const sameSelected = this.parentNode.querySelector('.same-as-selected');
            sameSelected !== null && sameSelected.removeAttribute('class');
            console.log('Same as selected: ', sameSelected);
            this.setAttribute('class', 'same-as-selected');
          }
        }
        console.log('Arrow to append ', arrow);
        selected.appendChild(arrow);
        selectedItem.click();
        currentNativeSelect.options[currentNativeSelect.selectedIndex].click();
      });
      allItems.appendChild(item);
    }
    customSelect.appendChild(allItems);
    selected.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllSelect(this);
      console.log('Toggle on selected: ', selected);
      this.nextSibling.classList.toggle('select-hide');
      console.log('Arrow', this.previousSibling);
      this.querySelector('.arrow').classList.toggle('opened');
    });
  }
  function closeAllSelect(element) {
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
  document.addEventListener('click', (e) => {
    closeAllSelect();
  });
};
