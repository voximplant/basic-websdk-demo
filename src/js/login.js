let lastDataFromLocalStorage;
const lastData = {};
const serverIpInput = document.getElementById('input-server-ip');
const debugInfoInput = document.getElementById('input-debug');
const connectivityCheckInput = document.getElementById('input-connectivity');
const userNameInput = document.getElementById('input-username');
const passwordInput = document.getElementById('input-password');

document.addEventListener('DOMContentLoaded', () => {
  try {
    const lastConnectionRaw = JSON.parse(localStorage.getItem('lastConnection'));
    const lastConnection = lastConnectionRaw.connected || false;
    if (!lastConnection) {
      serverIpInput.classList.add('invalid');
    }
  } catch (e) {}

  const lastDataRaw = localStorage.getItem('lastData');
  if (lastDataRaw) {
    document.getElementById('login-btn').disabled = false;
    try {
      lastDataFromLocalStorage = JSON.parse(lastDataRaw);
      userNameInput.value = lastDataFromLocalStorage.username || '';
      passwordInput.value = lastDataFromLocalStorage.password || '';
      serverIpInput.value = lastDataFromLocalStorage.serverIp || '';
      debugInfoInput.checked = lastDataFromLocalStorage.isDebugInfo || false;
      connectivityCheckInput.checked = lastDataFromLocalStorage.connectivityCheck || false;

      const table = document.querySelector('.server-list');
      if (lastDataFromLocalStorage.serverIps && lastDataFromLocalStorage.serverIps.length) {
        table.classList.remove('hidden');

        lastDataFromLocalStorage.serverIps.forEach((serverIp) => {
          const tmpl = `
            <div class="server-list_item">
                <span>${serverIp}</span>
                <button class="btn" onclick="serverIpInput.value = '${serverIp}'">Apply</button>
            </div>`;
          table.insertAdjacentHTML('beforeend', tmpl);
        });
      }
    } catch (e) {}
  }

  document.querySelector('.page_login').classList.remove('hidden');
  inputAuthDataProcessing();
});

const login = async () => {
  const serverIps =
    lastDataFromLocalStorage && lastDataFromLocalStorage.serverIps.length
      ? lastDataFromLocalStorage.serverIps
      : [];
  const username = userNameInput.value;
  const password = passwordInput.value
  lastData.username = username;
  lastData.password = password;
  lastData.serverIp = serverIpInput.value;
  lastData.serverIps = serverIps;
  lastData.isDebugInfo = debugInfoInput.checked;
  lastData.connectivityCheck = connectivityCheckInput.checked;
// reconnect to Voximplant Cloud if connection was closed because of network problems
  sdk.on(VoxImplant.Events.ConnectionClosed, () => {
    connectToVoxCloud(username, password);
  });
  if (sdk.alreadyInitialized) {
    await signIn(username, password);
  } else {
    await init(username, password);
  }

  if (sdk.getClientState() === VoxImplant.ClientState.LOGGED_IN) {
    lastData.serverIps = Array.from(new Set([...serverIps, lastData.serverIp]));
  }
    localStorage.setItem('lastData', JSON.stringify(lastData));
};


const init = async (username, password) => {
  try {
    await sdk.init({
      localVideoContainerId: 'local_video_holder', // Id of HTMLElement that will be used as a default container for local video elements
      serverIp: serverIpInput.value, // IP address of particular media gateway for connection, if it's not specified IP address will be chosen automatically
      showDebugInfo: debugInfoInput.checked, // Show debug info in console
    });
  } catch (e) {
    console.error('Failed to initialize');
  }
  await connectToVoxCloud(username, password);
};

const connectToVoxCloud = async (username, password) => {
  try {
    await sdk.connect();
    localStorage.setItem('lastConnection', JSON.stringify({ connected: true }));
  } catch (e) {
    localStorage.setItem('lastConnection', JSON.stringify({ connected: false }));
    window.location.reload();
    return;
  }
  if (!username) username = userNameInput.value;
  if (!password) password = passwordInput.value;
  await signIn(username, password);
};

const signIn = async (username, password) => {
  try {
    await sdk.login(username, password);
    logger.write(`Signed in as ${username}`);
    userNameInput.value = '';
    passwordInput.value = '';
    serverIpInput.value = '';

    document.querySelector('.page_login').classList.add('hidden');
    document.querySelector('.page_action').classList.remove('hidden');

    document.querySelector('.action_auth-data').innerHTML = `<h2>Logged in as ${username}</h2>`;
    if (serverIpInput.value.length)
      document.querySelector(
        '.action_auth-data'
      ).innerHTML = `<h2>Logged in as ${username} at ${serverIpInput.value}</h2>`;
  } catch (e) {
    console.log('Login failed, error code', e.code);
    userNameInput.classList.add('invalid');
    passwordInput.classList.add('invalid');
  }
};


const inputAuthDataProcessing = () => {
  document.querySelector('.visibility').addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
    } else {
      passwordInput.type = 'password';
    }
  });

  const inputsAuth = document.querySelector('.form').querySelectorAll('input');
  inputsAuth.forEach((input) => {
    input.addEventListener('keyup', () => {
      if (userNameInput.value && passwordInput.value) {
        document.getElementById('login-btn').disabled = false;
      } else {
        document.getElementById('login-btn').disabled = true;
      }
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        login();
      }
    });
  });
};
