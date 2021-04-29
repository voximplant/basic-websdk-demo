// create a call to conference
const callConference = () => {
  let number = document.getElementById('input-number').value.trim();
  if (!number) return;
  cleanData();
  currentCall = sdk.callConference({
    number,
    video: {
      sendVideo: document.getElementById('input-send_video_call').checked,
      receiveVideo: true,
    },
    H264first: document.getElementById('input-h264_call').checked,
    simulcast: document.getElementById('input-simulcast').checked,
  });
  isConference = true;
  disableConnectingSettings();
  setUpCall({ currentCall, number });
};

// create a call to conference as a viewer
const joinAsViewer = () => {
  let number = document.getElementById('input-number').value.trim();
  if (!number) return;
  cleanData();
  if (sdk.joinAsViewer) {
    currentCall = sdk.joinAsViewer(number);
    setUpCall({ currentCall, number, viewer: true });
  } else {
    logger.write("This SDK version doesn't allow to call as viewer");
  }

};
