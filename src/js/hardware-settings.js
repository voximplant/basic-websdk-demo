const getMicrophones = async () => {
  const devises = await VoxImplant.Hardware.AudioDeviceManager.get().getInputDevices();
  console.log('Mic', devises);
  const micDevices = devises.filter(
    (mic) => !~mic.id.indexOf('default') && !~mic.id.indexOf('communications')
  );
  if (micDevices.length < 2) return console.error("You don't have an another microphone");
  return micDevices;
};

const getCameras = async () => {
  const devises = await VoxImplant.Hardware.CameraManager.get().getInputDevices();
  if (devises.length < 2) return console.error("You don't have an another camera");
  return devises;
};

const setHardwareSettings = async () => {
  const cams = (await getCameras()) || [];
  console.log('Cams: ', cams);
  const selectCamera = document.getElementById('change-camera');
  const defaultCam = document.createElement('option');
  defaultCam.innerHTML = 'Default';
  defaultCam.id = 'Default';
  selectCamera.appendChild(defaultCam);
  cams.length &&
    cams.forEach((cam) => {
      const option = document.createElement('option');
      option.value = cam.id;
      option.innerText = cam.name;
      selectCamera.appendChild(option);
    });

  const cameraGroups = new Set(cams.map((cam) => cam.group));
  const mics = (await getMicrophones()) || [];
  console.log('Mics: ', mics);
  const selectMicrophone = document.getElementById('change-microphone');
  const defaultMic = document.createElement('option');
  defaultMic.innerHTML = 'Default';
  defaultMic.id = 'Default';
  selectMicrophone.appendChild(defaultMic);
  mics.length &&
    mics
      .filter((mic) => !cameraGroups.has(mic.group))
      .forEach((mic) => {
        const option = document.createElement('option');
        option.value = mic.id;
        option.innerText = mic.name;
        selectMicrophone.appendChild(option);
      });
  document.getElementById('change-microphone').onclick = (e) => {
    changeMicrophone(e.target.value);
  };

  document.getElementById('change-camera').onclick = (e) => {
    changeCamera(e.target.value);
  };

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
