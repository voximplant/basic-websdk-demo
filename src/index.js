let currentCall; // call object (instance of class Call) with methods
let transferCall; // call object storing instance of transfer call
const logger = new Logger(document.getElementById('logarea')); // create instance of Logger with method write

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
