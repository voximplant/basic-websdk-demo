const callConference = () => {
  let destination = document.getElementById('input-number').value.trim();
  if (!destination) return;
  cleanData();
  currentCall = sdk.callConference({
    number: destination,
    video: {
      sendVideo: document.getElementById('input-send_video_call').checked,
      receiveVideo: true,
    },
    H264first: document.getElementById('input-h264_call').checked,
    simulcast: document.getElementById('input-simulcast').checked,
  });
  disableConnectingSettings();
  setUpCall({ currentCall, isConf: true, destination });
};

const joinAsViewer = () => {
  let destination = document.getElementById('input-number').value.trim();
  if (!destination) return;
  cleanData();
  if (sdk.joinAsViewer) {
    currentCall = sdk.joinAsViewer(destination);
    setUpCall({ currentCall, isConf: true, destination });
  } else {
    logger.write("This SDK version doesn't allow to call as viewer");
  }
};
