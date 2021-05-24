let lastDataFromLocalStorage;
const lastData = {};
const serverIpInput = document.getElementById('input-server-ip');
const debugInfoInput = document.getElementById('input-debug');
const connectivityCheckInput = document.getElementById('input-connectivity');
const userNameInput = document.getElementById('input-username');
const passwordInput = document.getElementById('input-password');
const loginButton = document.getElementById('login-btn');

document.addEventListener('DOMContentLoaded', () => {
  // get authorisation parameters from url to login in sdk skipping form filling
  // получаем параметры авторизации из url чтобы не заполнять форму вручную
  const urlHashParams = location.hash;
  const parsedParams = urlHashParams
    .substr(1)
    .split('&')
    .reduce((object, keyValue) => {
      const [key, value] = keyValue.split('=');
      object[key] = value;
      return object;
    }, {});
  if (urlHashParams) {
    loginButton.disabled = false;
    authDataFill(parsedParams);
    loginButton.click();
  } else {
    // get authorisation parameters storing in localStorage from last login to fill form automatically
    // получаем авторизационные параметры из localStorage от последнего входа чтобы не заполнять форму вручную
    const lastDataRaw = localStorage.getItem('lastData');
    if (lastDataRaw) {
      loginButton.disabled = false;
      try {
        lastDataFromLocalStorage = JSON.parse(lastDataRaw);
        authDataFill(lastDataFromLocalStorage);
      } catch (e) {}
    }
  }
  document.querySelector('.page_login').classList.remove('hidden');
  inputAuthDataProcessing();
});

const authDataFill = ({
  username,
  password,
  serverIp,
  serverIps,
  isDebugInfo,
  connectivityCheck,
}) => {
  userNameInput.value = username || '';
  passwordInput.value = password || '';
  serverIpInput.value = serverIp || '';
  debugInfoInput.checked = isDebugInfo || false;
  connectivityCheckInput.checked = connectivityCheck || false;
  const table = document.querySelector('.server-list');
  if (serverIps && serverIps.length) {
    table.classList.remove('hidden');
    serverIps.forEach((serverIp) => {
      const serverListItem = `
            <div class="server-list_item">
                <span>${serverIp}</span>
                <button class="btn" onclick="serverIpInput.value = '${serverIp}'">Apply</button>
            </div>`;
      table.insertAdjacentHTML('beforeend', serverListItem);
    });
  }
};

const login = async () => {
  const serverIps =
    lastDataFromLocalStorage && lastDataFromLocalStorage.serverIps.length
      ? lastDataFromLocalStorage.serverIps
      : [];
  const username = userNameInput.value;
  const password = passwordInput.value;
  lastData.username = username;
  lastData.password = password;
  lastData.serverIp = serverIpInput.value;
  lastData.serverIps = serverIps;
  lastData.isDebugInfo = debugInfoInput.checked;
  lastData.connectivityCheck = connectivityCheckInput.checked;
  // reconnect to Voximplant Cloud if connection was closed because of network issues
  sdk.on(VoxImplant.Events.ConnectionClosed, () => {
    connectToVoxCloud(username, password, connectivityCheckInput.checked);
  });
  if (sdk.alreadyInitialized) {
    await signIn(username, password);
  } else {
    await init(username, password);
  }

  if (sdk.getClientState() === VoxImplant.ClientState.LOGGED_IN) {
    lastData.serverIps = Array.from(new Set([...serverIps, lastData.serverIp])).filter(
      (server) => server.length
    );
  }
  localStorage.setItem('lastData', JSON.stringify(lastData));
};

const init = async (username, password) => {
  try {
    await sdk.init({
      localVideoContainerId: 'local_video_holder', // Id of HTMLElement that is used as a default container for local video elements
      serverIp: serverIpInput.value, // IP address of a particular media gateway for connection. If it's not specified, IP address will be chosen automatically
      showDebugInfo: debugInfoInput.checked, // Show debug info in the console
    });
  } catch (e) {}
  await connectToVoxCloud(username, password, connectivityCheckInput.checked);
};

const connectToVoxCloud = async (username, password, connectivityCheck = false) => {
  try {
    await sdk.connect(connectivityCheck);
    localStorage.setItem('lastConnection', JSON.stringify({ connected: true }));
  } catch (e) {
    // disable inputs if the server IP is incorrect or if it's impossible to connect to the server with connectivity check on
    serverIpInput.classList.add('invalid');
    connectivityCheckInput.checked && connectivityCheckInput.classList.add('invalid');
    serverIpInput.disabled = true;
    userNameInput.disabled = true;
    passwordInput.disabled = true;
    debugInfoInput.disabled = true;
    connectivityCheckInput.disabled = true;
    loginButton.disabled = true;
    document.querySelectorAll('.form_group').forEach((input) => input.classList.add('disabled'));
    const errorMessage = connectivityCheckInput.checked
      ? 'Cannot connect to the server with the chosen parameters. Please reload the page and try again.'
      : 'Cannot connect to the server. Please reload the page and try again.';
    document.querySelector('.auth-error').innerText = errorMessage;
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

    const authData = document.querySelector('.action_auth-data');
    authData.querySelector('h2').innerText = `Logged in as ${username}`;
    authData.querySelector('h3').innerText = `You're using Web SDK version ${sdk.version}`;
    if (serverIpInput.value.length) {
      authData.querySelector('h2').innerText = `Logged in as ${username} at ${serverIpInput.value}`;
    }
  } catch (e) {
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
        loginButton.disabled = false;
      } else {
        loginButton.disabled = true;
      }
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        login();
      }
    });
  });
};
