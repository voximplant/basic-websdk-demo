let lastDataFromLocalStorage;
const serverIpInput = document.getElementById('input-server-ip');
const debugInfoInput = document.getElementById('input-debug');
const logger = new cLogger(document.getElementById('logarea'));
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
      userNameInput.value = lastDataFromLocalStorage.username;
      passwordInput.value = lastDataFromLocalStorage.password;
      serverIpInput.value = lastDataFromLocalStorage.serverIp || '';
      if (lastDataFromLocalStorage.isDebugInfo) debugInfoInput.checked = 'checked';

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
  let serverIps =
    lastDataFromLocalStorage && lastDataFromLocalStorage.serverIps.length
      ? lastDataFromLocalStorage.serverIps
      : [];
  const lastData = {
    username: userNameInput.value,
    password: passwordInput.value,
    serverIp: serverIpInput.value,
    serverIps: Array.from(new Set([...serverIps, serverIpInput.value].filter((i) => i.length > 1))),
    isDebugInfo: debugInfoInput.checked,
  };
  localStorage.setItem('lastData', JSON.stringify(lastData));

  if (sdk.alreadyInitialized && sdk.getClientState() === VoxImplant.ClientState.CONNECTED) {
    await signIn(userNameInput.value, passwordInput.value);
  } else if (sdk.alreadyInitialized) {
    await signIn(userNameInput.value, passwordInput.value);
    // await connectToVoxCloud();
  } else {
    await init();
  }
};

const init = async () => {
  try {
    await sdk.init({
      // TODO: @irgalamarr clear when calls finished
      localVideoContainerId: 'local_video_holder', // Id of HTMLElement that will be used as a default container for local video elements
      serverIp: serverIpInput.value, // IP address of particular media gateway for connection, if it's not specified IP address will be chosen automatically
      showDebugInfo: debugInfoInput.checked, // Show debug info in console
    });
  } catch (e) {
    console.error('Failed to initialize');
  }
  await connectToVoxCloud();
};

const connectToVoxCloud = async (isRepeated = false) => {
  try {
    await sdk.connect();
    localStorage.setItem('lastConnection', JSON.stringify({ connected: true }));
  } catch (e) {
    localStorage.setItem('lastConnection', JSON.stringify({ connected: false }));
    window.location.reload();
    return;
  }
  let user = isRepeated ? currentUser : userNameInput.value;
  let pass = isRepeated ? currentPass : passwordInput.value;
  await signIn(user, pass);
};

const signIn = async (user, pass) => {
  try {
    await sdk.login(user, pass);
    currentPass = pass;
    currentUser = user;
    logger.write(`Signed in as ${user}`);
    userNameInput.value = '';
    passwordInput.value = '';
    serverIpInput.value = '';

    document.querySelector('.page_login').classList.add('hidden');
    document.querySelector('.page_action').classList.remove('hidden');

    document.querySelector('.action_auth-data').innerHTML = `<h2>Logged in as ${user}</h2>`;
    if (serverIpInput.value.length)
      document.querySelector(
        '.action_auth-data'
      ).innerHTML = `<h2>Logged in as ${user} at ${serverIpInput.value}</h2>`;
  } catch (e) {
    console.log(e);
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
