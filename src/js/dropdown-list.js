// add item to dropdown list of available hardware devices
const addToDropdown = (device, selectElement, selected, items) => {
  const option = document.createElement('option');
  option.value = device.id;
  selectElement.appendChild(option);
  const divOption = document.createElement('div');
  divOption.innerText = device.name;
  divOption.id = device.id;
  if (device.id === 'default') {
    selected.textContent = device.name;
    selected.id = device.id;
  } else {
    items.appendChild(divOption);
  }
  // place an device item into a selected field, close dropdown and trigger an native select element event to change hardware settings
  divOption.onclick = () => {
    items.classList.add('hidden');
    selected.classList.remove('opened');
    selected.textContent = device.name;
    selected.id = device.id;
    option.click();
  }
}

// hide/show a list of devices
const toggleDropdown = (e) => {
  console.log('Not disabled', e.target);
  e.target.nextElementSibling.classList.toggle('hidden');
  e.target.classList.toggle('opened');
}

// disable selecting another device
const disableDropdownSelect = () => {
  for (let element of document.getElementsByClassName('select-selected')) {
    element.classList.add('disabled');
    element.removeEventListener('click', toggleDropdown);
  }
}

// enable selecting another device
const enableDropdownSelect = () => {
  for (let element of document.getElementsByClassName('select-selected')) {
    element.classList.remove('disabled');
    element.addEventListener('click', toggleDropdown);
  }
}