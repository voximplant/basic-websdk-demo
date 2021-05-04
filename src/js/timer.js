let interval;
// start counting duration of session
const startTimer = () => {
  let time = 0;
  const second = 1;
  interval = setInterval(() => {
    time = time + second;
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    const currentTime = `${hours < 10 ? `0${hours}` : hours}:${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    document.querySelector('.timer').innerText = currentTime;
  }, 1000)
}

// stop counting duration of session
const stopTimer = () => {
  clearInterval(interval);
}
