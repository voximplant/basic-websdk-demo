let currentCall; // call object (instance of the Call class) with methods
let isConference; // stores info if the all is a conference, used to manage remoteMedia endpoints (./js/endpoints.js)
let transferCall; // call object which stores the instance of transfer call
const logger = new Logger(document.getElementById('logarea')); // creates a Logger instance with write method

const sdk = VoxImplant.getInstance();

// login
document.getElementById('login-btn').onclick = async () => {
  await login(); // initialize, connect, login to Voximplant Cloud (./js/login.js)
  await setHardwareSettings(); // get available cameras, microphones and output devices and create a dropdown for selection (./js/hardware-settings.js)
  accessFunctionality(); // add event listeners to interactive elements ('./js/actions.js')
  manageConnectingView(); // changes connection window interactive elements, depending on chosen option (./js/action.js)
};

// handle incoming call
sdk.on(VoxImplant.Events.IncomingCall, (e) => {
  handleIncomingCall(e);
});
