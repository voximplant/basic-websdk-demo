// add an item to the available hardware devices dropdown list
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
  // place a device item into the selected field, close dropdown and trigger a native select element event to change hardware settings
  divOption.onclick = () => {
    items.classList.add('hidden');
    selected.classList.remove('opened');
    selected.textContent = device.name;
    selected.id = device.id;
    option.click();
  }
}

// hide/show the list of devices
const toggleDropdown = (e) => {
  e.target.nextElementSibling.classList.toggle('hidden');
  e.target.classList.toggle('opened');
}

// disable another device selection
const disableDropdownSelect = () => {
  for (const element of document.getElementsByClassName('select-selected')) {
    element.classList.add('disabled');
    element.removeEventListener('click', toggleDropdown);
  }
}

// enable another device selection
const enableDropdownSelect = () => {
  for (const element of document.getElementsByClassName('select-selected')) {
    element.classList.remove('disabled');
    element.addEventListener('click', toggleDropdown);
  }
}
