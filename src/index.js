let currentCall; // call object (instance of class Call) with methods
let isConference; // stores info if call is conference, is used when managing endpoints remoteMedia (./js/endpoints.js)
let transferCall; // call object storing instance of transfer call
const logger = new cLogger(document.getElementById('logarea')); // create instance of cLogger with method write

const sdk = VoxImplant.getInstance();

// login
document.getElementById('login-btn').onclick = async () => {
  await login(); // initialize, connect, login to Voximplant Cloud (./js/login.js)
  await setHardwareSettings(); // get available cameras, microphones and output devices and create dropdown for selecting (./js/hardware-settings.js)
  accessFunctionality(); // add event listeners to interactive elements ('./js/actions.js')
  manageConnectingView(); // changes connecting window interactive elements depending on chosen option (./js/action.js)
};

// handle incoming call
sdk.on(VoxImplant.Events.IncomingCall, (e) => {
  handleIncomingCall(e);
});
