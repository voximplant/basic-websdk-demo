// the object stores endpoints as keys and arrays with media kinds of each endpoint as values to track
// if there are current video streams to render in remote video container or black window should be rendering
// to show that there is a participant in conference without video stream

const endpointsMedia = {};

// handles endpoint added
const onEndpointAdded = ({ endpoint }) => {
  endpointsMedia[endpoint.id] = [];

  // create an element that represents a table row
  const endpointTableRow = `<tr class="endpoint-row ${endpoint.id}">
              <td rowspan="1" class="endpoint-cell ${endpoint.id}-id">${endpoint.id}</td>
              <td class="endpoint-cell ${endpoint.id}-video"></td>
              <td class="endpoint-cell ${endpoint.id}-audio"></td>
            </tr>`;
  document.getElementById('endpoints-table').insertAdjacentHTML('beforeend', endpointTableRow);
  endpoint.addEventListener(VoxImplant.EndpointEvents.RemoteMediaAdded, onRemoteMediaAdded);

  endpoint.addEventListener(VoxImplant.EndpointEvents.RemoteMediaRemoved, onRemoteMediaRemoved);

  endpoint.addEventListener(VoxImplant.EndpointEvents.Removed, onEndpointRemoved);
};

// handle remote media stream added
const onRemoteMediaAdded = ({ endpoint, mediaRenderer }) => {
  // replacing screen share with video so both of them are shown as video streams in the endpoint table
  const mediaRendererKind = mediaRenderer.kind.replace('sharing', 'video');

  // user endpoint in a conference who has a flag isDefault, which is true, should not be rendering in remote video holder
  if (!endpoint.isDefault || !currentCall.settings.isConference) {
    document.getElementById('remote_video_holder').classList.remove('empty');

    // render media in the container
    endpointsMedia[endpoint.id].push(mediaRendererKind);

    // add a black window if we have only audio stream on this endpoint
    if (mediaRendererKind === 'audio' && !endpointsMedia[endpoint.id].includes('video')) {
      addNoVideoContainer(endpoint.id);
    }

    // remove the black window if a video stream is added
    if (
      mediaRendererKind === 'video' &&
      document.querySelector(`.participant-${CSS.escape(endpoint.id)}`) !== null
    ) {
      document.querySelector(`.participant-${CSS.escape(endpoint.id)}`).remove();
    }
    if (mediaRendererKind === 'video') {
      // render a video stream in the remote video holder
      const videoContainer = document.createElement('div');
      videoContainer.classList.add(
        'video_container',
        `video_container_${endpoint.id}`,
        `video_container_${mediaRenderer.id}`
      );
      document.querySelector('.remote-video-holder').appendChild(videoContainer);
      mediaRenderer.render(videoContainer);
      const fullScreenIcon = document.createElement('div');
      fullScreenIcon.classList.add('full_screen_icon');
      videoContainer.appendChild(fullScreenIcon);
      fullScreenIcon.addEventListener('click', (event) => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
          mediaRenderer.element.classList.remove('full_screen');
        } else {
          mediaRenderer.element.parentElement.requestFullscreen();
          mediaRenderer.element.classList.add('full_screen');
        }
      });
    }
  }

  mediaRenderer.element.addEventListener('click', (event) => {
    if (event.ctrlKey || event.altKey) {
      if (event.shiftKey) {
        // Requests the specified video size for the video stream
        // The stream resolution may be changed to the closest to the specified width and height
        mediaRenderer.requestVideoSize(1920, 1080);
      } else {
        if (
          mediaRenderer.videoSize &&
          mediaRenderer.videoSize.width &&
          mediaRenderer.videoSize.height
        ) {
          // request to the server to reduce the size of the received video stream size, which will cause simulcast layer to switch to the closest to the specified values
          mediaRenderer.requestVideoSize(
            mediaRenderer.videoSize.width / 2,
            mediaRenderer.videoSize.height / 2
          );
        } else {
          mediaRenderer.requestVideoSize(1920, 1080);
        }
      }
    } else {
      if (mediaRenderer.enabled) {
        // enable/disable video stream reception from remote participants
        mediaRenderer.disable();
      } else {
        mediaRenderer.enable();
      }
    }
  });

  // add a media id in the endpoint table
  let endpointCell = document.querySelector(
    `.${CSS.escape(`${endpoint.id}-${mediaRendererKind}`)}`
  );
  if (endpointCell === null) {
    const endpointTableRow = `<tr class="endpoint-row ${endpoint.id}">
              <td class="endpoint-cell ${endpoint.id}-video"></td>
              <td class="endpoint-cell ${endpoint.id}-audio"></td>
            </tr>`;
    const rowWithEndpointDataWidth =
      +document.querySelector(`.${CSS.escape(endpoint.id)}-id`).getAttribute('rowspan') + 1;
    document
      .querySelector(`.${CSS.escape(endpoint.id)}-id`)
      .setAttribute('rowspan', rowWithEndpointDataWidth);
    if (document.querySelector(`.${CSS.escape(`${endpoint.id}`)}`)) {
      const endpointRow = document.querySelectorAll(`.${CSS.escape(endpoint.id)}`);
      endpointRow[endpointRow.length - 1].insertAdjacentHTML('afterend', endpointTableRow);
    } else {
      document.getElementById('endpoints-table').insertAdjacentHTML('beforeend', endpointTableRow);
    }

    endpointCell = document.querySelector(`.${CSS.escape(`${endpoint.id}-${mediaRendererKind}`)}`);
  }
  endpointCell.innerText = mediaRenderer.id;
  endpointCell.classList.add(mediaRenderer.id);
  endpointCell.classList.remove(`${endpoint.id}-${mediaRendererKind}`);
};

// handle the remote media removed
const onRemoteMediaRemoved = ({ endpoint, mediaRenderer }) => {
  // if this is not user's endpoint, check if there is no more video streams and show black window
  if (!endpoint.isDefault || !currentCall.settings.isConference) {
    const indexMedia = endpointsMedia[endpoint.id].indexOf(mediaRenderer.kind);
    endpointsMedia[endpoint.id].splice(indexMedia, 1);
    if (
      endpointsMedia[endpoint.id].length &&
      endpointsMedia[endpoint.id].every((media) => media === 'audio')
    ) {
      addNoVideoContainer(endpoint.id);
    }
    if (mediaRenderer.kind !== 'audio') {
      document.querySelector(`.video_container_${CSS.escape(mediaRenderer.id)}`).remove();
    }
  }
  // make a cell with removed media stream inactive
  const removedMedia = document.querySelector(`.${CSS.escape(mediaRenderer.id)}`);
  removedMedia && removedMedia.classList.add('inactive');
};

// handle an endpoint removed
const onEndpointRemoved = ({ endpoint }) => {
  // show an empty remote video container
  if (Object.values(endpointsMedia).every((endpoint) => endpoint.length === 0)) {
    document.getElementById('remote_video_holder').classList.add('empty');
  }
  // remove the black window
  document.querySelector(`.participant-${CSS.escape(endpoint.id)}`) !== null &&
    document.querySelector(`.participant-${CSS.escape(endpoint.id)}`).remove();
  document
    .querySelectorAll(`.video_container_${CSS.escape(endpoint.id)}`)
    .forEach((container) => container.remove());
  // make the endpoint id cell inactive
  document.querySelector(`.${CSS.escape(endpoint.id)}-id`).classList.add('inactive');
};

// create a black window with "no-camera" sign
const addNoVideoContainer = (endpointId) => {
  const participantContainer = document.createElement('div');
  participantContainer.classList.add('participant-container', `participant-${endpointId}`);
  const noVideoSign = document.createElement('div');
  noVideoSign.classList.add('white-circle');
  participantContainer.appendChild(noVideoSign);
  document.querySelector('.remote-video-holder').appendChild(participantContainer);
};
