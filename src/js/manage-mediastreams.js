// stop screen sharing
const stopShare = () => {
  const noVideoSign = document.querySelector('.local-video-holder').querySelector('.white-circle');
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
    const showLocalVideo = document.getElementById('input-show-local-video').checked;
    const replaceVideo = document.getElementById('input-replace-video').checked;
    const noVideoSign = document.querySelector('.local-video-holder').querySelector('.white-circle');
    showLocalVideo && noVideoSign.classList.add('hidden');
    currentCall
      .shareScreen(showLocalVideo, replaceVideo)
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
  const noVideoSign = document.querySelector('.local-video-holder').querySelector('.white-circle');
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
  const isSendingVideo = document.getElementById('start-sending-video').checked;
  if (currentCall) {
    currentCall
      .sendVideo(isSendingVideo)
      .then(() => {
        logger.write(`Resolved sendVideo(${isSendingVideo})`);
      })
      .catch((e) => {
        logger.write(`ERROR Reject sendVideo(${isSendingVideo})`);
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
