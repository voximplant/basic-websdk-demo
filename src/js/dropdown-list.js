// add an item to the available hardware devices dropdown list
const addToDropdown = ({ device, selected, selectElement, selectedElement, itemsElement }) => {
  const option = document.createElement('option');
  option.value = device.id;
  selectElement.appendChild(option);
  const divOption = document.createElement('div');
  divOption.innerText = device.name;
  divOption.id = device.id;

  if (selected) {
    selectedElement.textContent = device.name;
    selectedElement.id = device.id;
  } else {
    itemsElement.appendChild(divOption);
  }
  // place a device item into the selected field, close dropdown and trigger a native select element event to change hardware settings
  divOption.onclick = () => {
    itemsElement.classList.add('hidden');
    selectedElement.classList.remove('opened');
    selectedElement.textContent = device.name;
    selectedElement.id = device.id;
    option.click();
  };
};

// hide/show the list of devices
const toggleDropdown = (e) => {
  e.target.nextElementSibling.classList.toggle('hidden');
  e.target.classList.toggle('opened');
};

// disable another device selection
const disableDropdownSelect = (viewer) => {
  if (viewer) {
    document.querySelector('.selected-microphone').classList.add('disabled');
    document.querySelector('.selected-microphone').removeEventListener('click', toggleDropdown);
    document.querySelector('.selected-speaker').classList.add('disabled');
    document.querySelector('.selected-speaker').removeEventListener('click', toggleDropdown);
  }
  document.querySelector('.selected-camera').classList.add('disabled');
  document.querySelector('.selected-camera').removeEventListener('click', toggleDropdown);
};

// enable another device selection
const enableDropdownSelect = () => {
  for (const element of document.getElementsByClassName('select-selected')) {
    element.classList.remove('disabled');
    element.addEventListener('click', toggleDropdown);
  }
};

const closeDropdown = (event) => {
  const allOptionItems = document.getElementsByClassName('select-items');
  for (const optionItems of allOptionItems) {
    if (
      !optionItems.classList.contains('hidden') &&
      optionItems.previousElementSibling !== event.target
    ) {
      optionItems.classList.add('hidden');
    }
  }
  const allSelected = document.getElementsByClassName('select-selected');

  for (const selected of allSelected) {
    if (selected.classList.contains('opened') && selected !== event.target) {
      selected.classList.remove('opened');
    }
  }
};
