const getMicrophones = async () => {
  return await VoxImplant.Hardware.AudioDeviceManager.get().getInputDevices();
};

const getCameras = async () => {
  return  await VoxImplant.Hardware.CameraManager.get().getInputDevices();
};

const getSpeakers = async () => {
  return await VoxImplant.Hardware.AudioDeviceManager.get().getOutputDevices();
};

const setHardwareSettings = async () => {
  const cams = (await getCameras()) || [];
  const selectCamera = document.getElementById('change-camera');
  if (!cams.map(cam => cam.id).includes('default')) {
    cams.unshift({id: 'default', name: 'default'});
  }
    cams.forEach((cam) => {
      const option = document.createElement('option');
      option.value = cam.id;
      option.innerText = cam.name;
      selectCamera.appendChild(option);
    });

  const cameraGroups = new Set(cams.map((cam) => cam.group));
  const mics = (await getMicrophones()) || [];
  const selectMicrophone = document.getElementById('change-microphone');
  if (!mics.map(mic => mic.id).includes('default')) {
    mics.unshift({id: 'default', name: 'default'})
  }
    mics
      .filter((mic) => !cameraGroups.has(mic.group))
      .forEach((mic) => {
        const option = document.createElement('option');
        option.value = mic.id;
        option.innerText = mic.name;
        selectMicrophone.appendChild(option);
      });

  const speakers = (await getSpeakers()) || [];
  const selectSpeaker = document.getElementById('change-speaker');
  if (!speakers.map(speaker => speaker.id).includes('default')) {
    speakers.unshift({id: 'default', name: 'default'});
  }
  speakers.forEach((speaker) => {
    const option = document.createElement('option');
    option.value = speaker.id;
    option.innerText = speaker.name;
    selectSpeaker.appendChild(option);
  });
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
  dropdown();
};

const changeMicrophone = (inputId) => {
  if (currentCall) {
    VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(currentCall, { inputId });
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings({ inputId });
};

const changeCamera = (cameraId) => {
  if (currentCall) {
    VoxImplant.Hardware.CameraManager.get().setCallVideoSettings(currentCall, { cameraId });
  }
  VoxImplant.Hardware.CameraManager.get().setDefaultVideoSettings({ cameraId });
};

const changeSpeaker = (outputId) => {
  if (currentCall) {
    VoxImplant.Hardware.AudioDeviceManager.get().setCallAudioSettings(currentCall, { outputId });
  }
  VoxImplant.Hardware.AudioDeviceManager.get().setDefaultAudioSettings({ outputId });
}
