let lastDataFromLocalStorage;
const lastData = {};
const serverIpInput = document.getElementById('input-server-ip');
const debugInfoInput = document.getElementById('input-debug');
const connectivityCheckInput = document.getElementById('input-connectivity');
const userNameInput = document.getElementById('input-username');
const passwordInput = document.getElementById('input-password');
const loginButton = document.getElementById('login-btn');

const errorMessageOutput = document.querySelector('.error-message');

const nodeSelect = document.getElementById('select-node');
const selectedNode = document.querySelector('.selected-node');
const nodeItems = document.querySelector('.node-items');

document.addEventListener('DOMContentLoaded', () => {
  // get authorisation parameters from url to login in sdk skipping form filling
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
    const lastDataRaw = localStorage.getItem('lastData');
    if (lastDataRaw) {
      loginButton.disabled = false;
      try {
        lastDataFromLocalStorage = JSON.parse(lastDataRaw);
        authDataFill(lastDataFromLocalStorage);
      } catch (e) {
      }
    }
  }
  document.querySelector('.page_login').classList.remove('hidden');
  inputAuthDataProcessing();
});

const authDataFill = ({
                        node,
                        username,
                        password,
                        serverIp,
                        serverIps,
                        isDebugInfo,
                        connectivityCheck,
                      }) => {
  selectedNode.textContent = node || '';
  selectedNode.id = node || '';

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

const resetErrorState = () => {
  errorMessageOutput.innerText = null;
  nodeSelect.classList.remove('invalid');
  serverIpInput.classList.remove('invalid');
  connectivityCheckInput.classList.remove('invalid');
  userNameInput.classList.remove('invalid');
  passwordInput.classList.remove('invalid');
}

const login = async () => {
  resetErrorState();

  const serverIps =
    lastDataFromLocalStorage && lastDataFromLocalStorage.serverIps.length
      ? lastDataFromLocalStorage.serverIps
      : [];
  const username = userNameInput.value;
  const password = passwordInput.value;
  const node = selectedNode.id;
  lastData.node = node;
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
    await init(username, password, node);
  }

  if (sdk.getClientState() === VoxImplant.ClientState.LOGGED_IN) {
    lastData.serverIps = Array.from(new Set([...serverIps, lastData.serverIp])).filter(
      (server) => server.length
    );
  }
  localStorage.setItem('lastData', JSON.stringify(lastData));
};

const init = async (username, password, node) => {
  try {
    await sdk.init({
      node, // the Voximplant account node.
      localVideoContainerId: 'local_video_holder', // Id of HTMLElement that is used as a default container for local video elements
      serverIp: serverIpInput.value, // IP address of a particular media gateway for connection. If it's not specified, IP address will be chosen automatically
      showDebugInfo: debugInfoInput.checked, // Show debug info in the console
    });
    await connectToVoxCloud(username, password, connectivityCheckInput.checked);

    // Cant change initialize config after sdk already initialized. Disable config fields.
    debugInfoInput.disabled = true;
    connectivityCheckInput.disabled = true;
    serverIpInput.disabled = true;
    nodeSelect.disabled = true;
  } catch (e) {
    if (e.message.includes('"node"')) {
      nodeSelect.classList.add('invalid');
    }
    errorMessageOutput.innerText = e.message;
    console.error(e);
  }
};

const connectToVoxCloud = async (username, password, connectivityCheck = false) => {
  try {
    const connectionResult = await sdk.connect(connectivityCheck);
    if (!connectionResult) {
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
      errorMessageOutput.innerText = errorMessage;
      return
    }
    localStorage.setItem('lastConnection', JSON.stringify({connected: connectionResult}));

    if (!username) username = userNameInput.value;
    if (!password) password = passwordInput.value;
    await signIn(username, password);
  } catch (e) {
    errorMessageOutput.innerText = e.message;
    console.error(e)
  }
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
    const { code } = e;
    switch (code) {
      case 401:
        errorMessageOutput.innerText = 'Password invalid';
        passwordInput.classList.add('invalid');
        break;
      case 404:
        errorMessageOutput.innerText = 'User not Found';
        userNameInput.classList.add('invalid');
        break;
      default:
        return `Authentication failed with code ${code}`;
    }

    console.error(e)
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


const nodes = Object.entries(VoxImplant.ConnectionNode)
  ?.map(([name, node]) => ({
    id: node,
    name: name,
  })) ?? [];
nodes.forEach((node) => {
  addToDropdown(node, nodeSelect, selectedNode, nodeItems);
});