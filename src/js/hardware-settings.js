// get the output and input devices to create dropdown list to let user to use additional devices
const setHardwareSettings = async () => {
  const cams = (await getCameras()) || [];
  if (!cams.map(cam => cam.id).includes('default')) {
    cams.unshift({ id: 'default', name: 'default' });
  }
  const selectElementCamera = document.getElementById('change-camera');
  const camItems = document.querySelector('.camera-items');
  const selectedCamera = document.querySelector('.selected-camera');
  selectedCamera.addEventListener('click', toggleDropdown);
  cams
    .forEach((cam) => {
      addToDropdown(cam, selectElementCamera, selectedCamera, camItems)
    });

  const cameraGroups = new Set(cams.map((cam) => cam.group));
  const mics = (await getMicrophones()) || [];
  if (!mics.map(mic => mic.id).includes('default')) {
    mics.unshift({ id: 'default', name: 'default' })
  }
  const selectElementMicrophone = document.getElementById('change-microphone');
  const micItems = document.querySelector('.microphone-items');
  const selectedMic = document.querySelector('.selected-microphone');
  selectedMic.addEventListener('click', toggleDropdown);
  mics
    .filter((mic) => !cameraGroups.has(mic.group))
    .forEach((mic) => {
      addToDropdown(mic, selectElementMicrophone, selectedMic, micItems);
    });

  const speakers = (await getSpeakers()) || [];
  if (!speakers.map(speaker => speaker.id).includes('default')) {
    speakers.unshift({ id: 'default', name: 'default' });
  }
  const selectElementSpeaker = document.getElementById('change-speaker');
  const speakerItems = document.querySelector('.speaker-items');
  const selectedSpeaker = document.querySelector('.selected-speaker');
  selectedSpeaker.addEventListener('click', toggleDropdown);
  speakers
    .forEach((speaker) => {
      addToDropdown(speaker, selectElementSpeaker, selectedSpeaker, speakerItems);
    });

  document.onclick = (e) => {
    const allOptionItems = document.getElementsByClassName('select-items');
    for (const optionItems of allOptionItems) {
      if (!optionItems.classList.contains('hidden') && optionItems.previousElementSibling !== e.target) {
        optionItems.classList.add('hidden');
      }
    }
    const allSelected = document.getElementsByClassName('select-selected');
    for (const selected of allSelected) {
      if (selected.classList.contains('opened') && selected !== e.target) {
        selected.classList.remove('opened');
      }
    }
  }

  // add event listeners to select elements
  document.getElementById('change-microphone').onclick = (e) => {
    if (e.target.value === 'default') return;
    changeMicrophone(e.target.value);
  };

  document.getElementById('change-camera').onclick = (e) => {
    if (e.target.value === 'default') return;
    changeCamera(e.target.value);
  };

  document.getElementById('change-speaker').onclick = (e) => {
    if (e.target.value === 'default') return;
    changeSpeaker(e.target.value);
  }
};

// set up a device according to audio/video settings
// default settings may be set without current call and are used when a new call is created. They change with current call settings during this call
const changeMicrophone = (inputId) => {
  const outputId = VoxImplant.Hardware.AudioDeviceManager.get().getDefaultAudioSettings().outputId;
  const audioParams = { inputId };
  if (outputId) audioParams.outputId = outputId;
  if (currentCall) {
    VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(currentCall, audioParams);
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings(audioParams);
};

const changeCamera = (cameraId) => {
  if (currentCall) {
    VoxImplant.Hardware.CameraManager.get().setCallVideoSettings(currentCall, { cameraId });
  }
  VoxImplant.Hardware.CameraManager.get().setDefaultVideoSettings({ cameraId });
};

const changeSpeaker = (outputId) => {
  const inputId = VoxImplant.Hardware.AudioDeviceManager.get().getDefaultAudioSettings().inputId;
  const audioParams = { outputId };
  if (inputId) audioParams.inputId = inputId;
  if (currentCall) {
    VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(currentCall, audioParams);
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings(audioParams);
}

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
