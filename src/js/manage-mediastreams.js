// stop share screen
const stopShare = () => {
  document.querySelector('.white-circle').classList.contains('hidden') &&
    document.querySelector('.white-circle').classList.remove('hidden');
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

// start share screen, with options: replacing current video, showing shared screen in local video, depending on user settings selected
const startShare = () => {
  if (currentCall !== null) {
    const showLocalVideo = document.getElementById('input-show-local-video').checked;
    const replaceVideo = document.getElementById('input-replace-video').checked;
    showLocalVideo && document.querySelector('.white-circle').classList.add('hidden');
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
          });
      })
      .catch((e) => {
        document.querySelector('.white-circle').classList.remove('hidden');
        console.error(e);
        logger.write(e.message);
      });
  }
};

//render local video
const showLocalVideo = () => {
  const isShow = document.getElementById('show-local-video-switch').checked;
  try {
    if (isShow) {
      sdk.showLocalVideo(true);
      document.querySelector('.white-circle').classList.add('hidden');
    } else {
      sdk.showLocalVideo(false);
      document.querySelector('.white-circle').classList.remove('hidden');
    }
  } catch (e) {
    logger.write('ERROR Local video already displayed');
    console.error('Reject showLocalVideo', e);
  }
};

// start showing video if it was not started when call was initialized, or stop it if it is now showing
const sendingVideo = () => {
  const isSendingVideo =
    document.getElementById('show-local-video-switch').checked ||
    document.getElementById('start-sending-video').checked;
  if (currentCall) {
    currentCall
      .sendVideo(isSendingVideo)
      .then(() => {
        logger.write(`Resolved sendVideo(${isSendingVideo})`);
      })
      .catch((e) => {
        logger.write(`ERROR Reject sendVideo(${isSendingVideo})`);
        console.error(`Reject sendVideo(${isSendingVideo})`, e);
      });
  }
};

// mute/unmute audio
const muteAudio = () => {
  if (document.getElementById('mute').checked) {
    currentCall && currentCall.muteMicrophone();
    console.log('Muted');
  } else {
    currentCall && currentCall.unmuteMicrophone();
    console.log('Unmuted');
  }
};
