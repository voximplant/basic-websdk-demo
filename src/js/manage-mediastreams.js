const noVideoSign = document.querySelector('.local-video-holder').querySelector('.white-circle');
const showLocalVideoSharing = document.getElementById('input-show-local-video');
const showLocalVideoOptional = document.getElementById('show-local-video-switch');
const replaceVideo = document.getElementById('input-replace-video');

// stop screen sharing
const stopShare = () => {
  !showLocalVideoOptional.checked &&
    showLocalVideoSharing.checked &&
    noVideoSign.classList.remove('hidden');
  if (currentCall !== null) {
    currentCall
      .stopSharingScreen()
      .then((e) => {
        changeAccessToSharingElements();
        logger.write('Sharing detached');
      })
      .catch((e) => {
        logger.write(e);
      });
  }
};

// start screen sharing with options: replace current video, show shared screen in local video, depending on user settings selected
const startShare = () => {
  if (currentCall !== null) {
    showLocalVideoSharing.checked && noVideoSign.classList.add('hidden');
    currentCall
      .shareScreen(showLocalVideoSharing.checked, replaceVideo.checked)
      .then((e) => {
        logger.write('Sharing attached');
        changeAccessToSharingElements(true);
        document.getElementById('stop-sharing').onclick = stopShare;

        const transceivers = currentCall.peerConnection.getTransceivers();
        const transceiverSharing = transceivers.find((transceiver) => {
          return (
            transceiver.sender.track !== null && transceiver.sender.track.label.includes('screen')
          );
        });
        transceiverSharing &&
          transceiverSharing.sender.track.addEventListener('ended', () => {
            document.getElementById('start-sharing').disabled = false;
            document.getElementById('input-show-local-video').disabled = false;
            document.getElementById('input-replace-video').disabled = false;
            noVideoSign.classList.add('hidden');
          });
      })
      .catch((e) => {
        noVideoSign.classList.remove('hidden');
        logger.write(e.message);
      });
  }
};

// render the local video
const showLocalVideo = () => {
  const isShow = document.getElementById('show-local-video-switch').checked;
  try {
    if (isShow) {
      sdk.showLocalVideo(true);
      noVideoSign.classList.add('hidden');
    } else {
      sdk.showLocalVideo(false);
      noVideoSign.classList.remove('hidden');
    }
  } catch (e) {
    logger.write('ERROR Local video already displayed');
  }
};

// Start/stop sending video to a call. In case of a remote participant uses a Web SDK client,
// he/she will receive either the EndpointEvents.RemoteMediaAdded or EndpointEvents.RemoteMediaRemoved event accordingly.
const sendingVideo = () => {
  const startSendingVideo = document.getElementById('start-sending-video').checked;

  // if video sending is switched off, screen sharing also stops, so starting a new screen share should be available
  if (!startSendingVideo) {
    changeAccessToSharingElements();
  }
  if (currentCall) {
    currentCall
      .sendVideo(startSendingVideo)
      .then(() => {
        logger.write(`Resolved sendVideo(${startSendingVideo})`);
      })
      .catch((e) => {
        logger.write(`ERROR Reject sendVideo(${startSendingVideo})`);
      });
  }
};

// mute/unmute audio
const muteAudio = () => {
  if (document.getElementById('mute').checked) {
    currentCall && currentCall.muteMicrophone();
  } else {
    currentCall && currentCall.unmuteMicrophone();
  }
};
