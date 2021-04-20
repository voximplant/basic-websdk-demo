// stop share screen
const stopShare = (call) => {
  document.querySelector('.white-circle').classList.contains('hidden') &&
    document.querySelector('.white-circle').classList.remove('hidden');
  if (call !== null) {
    call
      .stopSharingScreen()
      .then((e) => {
        changeAccessToSharingElements();
        logger.write('Sharing detached');
      })
      .catch((e) => console.log(e));
  }
};

// start share screen, with options: replacing current video, showing shared screen in local video, depending on user settings selected
const startShare = (call) => {
  if (call !== null) {
    const showLocalVideo = document.getElementById('input-show-local-video').checked;
    const replaceVideo = document.getElementById('input-replace-video').checked;
    showLocalVideo && document.querySelector('.white-circle').classList.add('hidden');
    call
      .shareScreen(showLocalVideo, replaceVideo)
      .then((e) => {
        logger.write('Sharing attached');
        changeAccessToSharingElements(true);
        document.getElementById('stop-sharing').onclick = () => stopShare(call);

        const transceivers = call.peerConnection.getTransceivers();
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
const sendingVideo = (call, logger) => {
  const isSendingVideo =
    document.getElementById('show-local-video-switch').checked ||
    document.getElementById('start-sending-video').checked;
  if (call) {
    call
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
const muteAudio = (call) => {
  if (document.getElementById('mute').checked) {
    call && call.muteMicrophone();
    console.log('Muted');
  } else {
    call && call.unmuteMicrophone();
    console.log('Unmuted');
  }
};
