const selectElementCamera = document.getElementById('change-camera');
const camItems = document.querySelector('.camera-items');
const selectedCamera = document.querySelector('.selected-camera');

const selectElementMicrophone = document.getElementById('change-microphone');
const micItems = document.querySelector('.microphone-items');
const selectedMic = document.querySelector('.selected-microphone');

const selectElementSpeaker = document.getElementById('change-speaker');
const speakerItems = document.querySelector('.speaker-items');
const selectedSpeaker = document.querySelector('.selected-speaker');

let currentCameras = [];
let currentMicrophones = [];
let currentSpeakers = [];

let currentCamera = null;
let currentMicrophone = null;
let currentSpeaker = null;

// get the output and input devices to create dropdown list to let user to use additional devices
const setHardwareSettings = async () => {
  await requestPermissions();
  await initDevices();
  updateDeviceLists();
  setDeviceChangeLister();

  selectedCamera.addEventListener('click', toggleDropdown);
  selectedMic.addEventListener('click', toggleDropdown);
  selectedSpeaker.addEventListener('click', toggleDropdown);

  // add event listeners to select elements
  selectElementMicrophone.onclick = async (e) => {
    currentMicrophone = currentMicrophones.find((m) => m.id === e.target.value);
    await changeMicrophone(e.target.value);
    updateMicrophonesList();
  };

  selectElementCamera.onclick = async (e) => {
    currentCamera = currentCameras.find((c) => c.id === e.target.value);
    await changeCamera(e.target.value);
    updateCamerasList();
  };

  selectElementSpeaker.onclick = async (e) => {
    currentSpeaker = currentSpeakers.find((s) => s.id === e.target.value);
    await changeSpeaker(e.target.value);
    updateSpeakersList();
  };
};

const initDevices = async () => {
  try {
    const promises = [getCameras(), getMicrophones(), getSpeakers()];
    const [cameras, microphones, speakers] = await Promise.all(promises);

    currentCameras = cameras || [];
    currentCamera = autoSelectDevice(currentCameras);

    currentMicrophones = microphones || [];
    currentMicrophone = autoSelectDevice(currentMicrophones);

    currentSpeakers = speakers || [];
    currentSpeaker = autoSelectDevice(currentSpeakers);

    await changeCamera(currentCamera?.id);
    await changeAudioSettings({
      inputId: currentMicrophone?.id,
      outputId: currentSpeaker?.id,
    });
  } catch (err) {
    logger.write(`Error getting devices: ${err.message}`);
  }
};

const updateDeviceLists = () => {
  updateCamerasList();
  updateMicrophonesList();
  updateSpeakersList();
};

const updateCamerasList = () => {
  removeChildren(selectElementCamera);
  removeChildren(camItems);

  if (!currentCameras.length) {
    selectElementCamera.disabled = true;
    return;
  }
  selectElementCamera.disabled = false;

  currentCameras.forEach((cam) => {
    addToDropdown({
      device: cam,
      selected: cam.id === currentCamera?.id,
      selectElement: selectElementCamera,
      selectedElement: selectedCamera,
      itemsElement: camItems,
    });
  });
};

const updateMicrophonesList = () => {
  removeChildren(selectElementMicrophone);
  removeChildren(micItems);

  const microphonesToUse = currentMicrophones.filter(
    (mic) => !isCameraMicrophone(mic, currentCameras)
  );

  if (!microphonesToUse.length) {
    selectElementMicrophone.disabled = true;
    return;
  }
  selectElementMicrophone.disabled = false;

  microphonesToUse.forEach((mic) => {
    addToDropdown({
      device: mic,
      selected: mic.id === currentMicrophone?.id,
      selectElement: selectElementMicrophone,
      selectedElement: selectedMic,
      itemsElement: micItems,
    });
  });
};

const updateSpeakersList = () => {
  removeChildren(selectElementSpeaker);
  removeChildren(speakerItems);

  if (!currentSpeakers?.length) {
    selectElementSpeaker.disabled = true;
    return;
  }
  selectElementSpeaker.disabled = false;

  currentSpeakers.forEach((speaker) => {
    addToDropdown({
      device: speaker,
      selected: speaker.id === currentSpeaker?.id,
      selectElement: selectElementSpeaker,
      selectedElement: selectedSpeaker,
      itemsElement: speakerItems,
    });
  });
};

// set up a device according to audio/video settings
// default settings may be set without current call and are used when a new call is created. They change with current call settings during this call
const changeMicrophone = async (inputId) => {
  if (!inputId) return;

  const outputId = VoxImplant.Hardware.AudioDeviceManager.get().getDefaultAudioSettings().outputId;
  const audioParams = { inputId };
  if (outputId) audioParams.outputId = outputId;
  if (currentCall) {
    await VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(
      currentCall,
      audioParams
    );
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings(audioParams);
};

const changeCamera = async (cameraId) => {
  if (!cameraId) return;

  if (currentCall) {
    await VoxImplant.Hardware.CameraManager.get().setCallVideoSettings(currentCall, { cameraId });
  }
  VoxImplant.Hardware.CameraManager.get().setDefaultVideoSettings({ cameraId });
};

const changeSpeaker = async (outputId) => {
  if (!outputId) return;

  const inputId = VoxImplant.Hardware.AudioDeviceManager.get().getDefaultAudioSettings().inputId;
  const audioParams = { outputId };
  if (inputId) audioParams.inputId = inputId;
  if (currentCall) {
    await VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(
      currentCall,
      audioParams
    );
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings(audioParams);
};

const changeAudioSettings = async ({ inputId, outputId }) => {
  if (!inputId && !outputId) return;

  const defaultSettings = VoxImplant.Hardware.AudioDeviceManager.get().getDefaultAudioSettings();

  const audioParams = {
    inputId: inputId || defaultSettings.inputId,
    outputId: outputId || defaultSettings.outputId,
  };

  if (currentCall) {
    await VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(
      currentCall,
      audioParams
    );
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings(audioParams);
};

// get available microphones
const getMicrophones = async () => {
  return await VoxImplant.Hardware.AudioDeviceManager.get().getInputDevices();
};

// get available cameras
const getCameras = async () => {
  return await VoxImplant.Hardware.CameraManager.get().getInputDevices();
};

// get available speakers
const getSpeakers = async () => {
  return await VoxImplant.Hardware.AudioDeviceManager.get().getOutputDevices();
};

const requestPermissions = async () => {
  const [micPermission, cameraPermission] = await Promise.all([
    navigator.permissions.query({ name: 'microphone' }),
    navigator.permissions.query({ name: 'camera' }),
  ]);

  if (!isFirefox() && micPermission.state === 'granted' && cameraPermission.state === 'granted') {
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: isFirefox() ? true : micPermission.state !== 'granted',
      video: isFirefox() ? true : cameraPermission.state !== 'granted',
    });

    stream.getTracks().forEach((track) => {
      track.stop();
    });
  } catch (err) {
    logger.write(`Error requesting permissions: ${err.message}`);
  }
};

const setDeviceChangeLister = () => {
  VoxImplant.Hardware.StreamManager.get().addEventListener(
    VoxImplant.Hardware.HardwareEvents.DevicesUpdated,
    async (event) => {
      const { audioOutputDevices, audioInputDevices, videoInputDevices } = event;

      let audioSettings;
      let cameraSettings;

      if (currentCall) {
        audioSettings =
          VoxImplant.Hardware.AudioDeviceManager.get().getCallAudioSettings(currentCall);
        cameraSettings = VoxImplant.Hardware.CameraManager.get().getCallVideoSettings(currentCall);
      } else {
        audioSettings = VoxImplant.Hardware.AudioDeviceManager.get().getDefaultAudioSettings();
        cameraSettings = VoxImplant.Hardware.CameraManager.get().getDefaultVideoSettings();
      }

      const sdkMic = audioInputDevices.find((d) => d.id === audioSettings?.inputId);
      const micsDiff = getDevicesDiff(currentMicrophones, audioInputDevices);
      const micsToUse = (micsDiff.added.length ? micsDiff.added : currentMicrophones).filter(
        (mic) => !isCameraMicrophone(mic, videoInputDevices)
      );
      const mic = autoSelectDevice(micsToUse);

      const sdkSpeaker = audioOutputDevices.find((d) => d.id === audioSettings?.outputId);
      const speakersDiff = getDevicesDiff(currentSpeakers, audioOutputDevices);
      const speakersToUse = speakersDiff.added.length ? speakersDiff.added : currentSpeakers;
      const speaker = autoSelectDevice(speakersToUse);

      const sdkCamera = videoInputDevices.find((d) => d.id === cameraSettings?.cameraId);

      currentCameras = videoInputDevices;
      currentMicrophones = audioInputDevices;
      currentSpeakers = audioOutputDevices;

      if (sdkCamera && !isSameDevice(sdkCamera, currentCamera)) {
        currentCamera = sdkCamera;
      }

      await changeAudioSettings({
        inputId: mic && !isSameDevice(mic, sdkMic) ? mic.id : null,
        outputId: speaker && !isSameDevice(speaker, sdkSpeaker) ? speaker.id : null,
      });
      if (mic) currentMicrophone = mic;
      if (speaker) currentSpeaker = speaker;

      updateDeviceLists();
    }
  );
};

const autoSelectDevice = (list) => {
  return list.find((device) => device.id === 'default') || list[0];
};

const isSameDevice = (device1, device2) => {
  if (!device1 || !device2) return false;
  return ['id', 'group', 'name'].every((property) => device1[property] === device2[property]);
};

const getDevicesDiff = (oldList, newList) => {
  const added = newList.filter(
    (newDevice) => !oldList.find((oldDevice) => isSameDevice(newDevice, oldDevice))
  );
  const removed = oldList.filter(
    (oldDevice) => !newList.find((newDevice) => isSameDevice(oldDevice, newDevice))
  );

  return {
    added,
    removed,
  };
};
