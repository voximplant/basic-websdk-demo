let currentCall;
let transferCall;
let currentUser;
let currentPass;

const sdk = VoxImplant.getInstance();

// login
document.getElementById('login-btn').onclick = async () => {
  await login();
  setHardwareSettings();
  accessFunctionality();
  manageConnectingView();
  getServerSDP(sdk);
};

// reconnect to Voximplant Cloud if connection was closed because of network problems
sdk.on(VoxImplant.Events.ConnectionClosed, () => {
  connectToVoxCloud(true);
});

// handle incoming call
sdk.on(VoxImplant.Events.IncomingCall, (e) => {
  handleIncomingCall(e);
});
