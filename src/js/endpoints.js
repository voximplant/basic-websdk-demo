// an object stores endpoints as keys and arrays with media kinds of each endpoint as values to track
// if there are current video streams to render in remote video container or black window should be rendering
// to show that there is a participant in conference without video stream
const endpointsMedia = {};

// handles endpoint added
const onEndpointAdded = ({ endpoint }) => {
  endpointsMedia[endpoint.id] = [];

  // create an element representing a table row
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
  // replacing sharing with video as both of them will be shown as video streams in table with endpoints
  const mediaRendererKind = mediaRenderer.kind.replace('sharing', 'video');

  // endpoint of user in conference has a flag isDefault which is true and it should not be rendering in remote video holder
  if (!endpoint.isDefault || !isConference) {
    document.getElementById('remote_video_holder').classList.remove('empty');

    // render media in container
    endpointsMedia[endpoint.id].push(mediaRendererKind);

    // add black window if we have only audio stream on this endpoint
    if (mediaRendererKind === 'audio' && !endpointsMedia[endpoint.id].includes('video')) {
      addNoVideoContainer(endpoint.id);
    }

    // remove black window if a video stream is added
    if (mediaRendererKind === 'video' && document.querySelector(`.participant-${CSS.escape(endpoint.id)}`) !== null) {
      document.querySelector(`.participant-${CSS.escape(endpoint.id)}`).remove();
    }

    // render video stream in remote video holder
    const videoHolder = document.querySelector('.remote-video-holder');
    mediaRenderer.render(videoHolder);
  }

  mediaRenderer.element.addEventListener('click', (event) => {
    if (event.ctrlKey || event.altKey) {
      if (event.shiftKey) {
        mediaRenderer.requestVideoSize(1920, 1080)
      } else {
        if (mediaRenderer.videoSize && mediaRenderer.videoSize.width && mediaRenderer.videoSize.height) { mediaRenderer.requestVideoSize(mediaRenderer.videoSize.width / 2, mediaRenderer.videoSize.height / 2) } else { mediaRenderer.requestVideoSize(1920, 1080) }
      }
    } else {
      if (mediaRenderer.enabled) { mediaRenderer.disable(); } else { mediaRenderer.enable(); }
    }
  })
  mediaRenderer.placed = true;

  // add media id in table with endpoints
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

// handle remote media removed
const onRemoteMediaRemoved = ({ endpoint, mediaRenderer }) => {
  // if this is not user's endpoint, check if there is no more video streams and show black window in this case
  if (!endpoint.isDefault || !isConference) {
    const indexMedia = endpointsMedia[endpoint.id].indexOf(mediaRenderer.kind);
    endpointsMedia[endpoint.id].splice(indexMedia, 1);
    if (endpointsMedia[endpoint.id].length && endpointsMedia[endpoint.id].every(media => media === 'audio')) {
      addNoVideoContainer(endpoint.id);
    }
    if (!endpointsMedia[endpoint.id].length) {
      document.getElementById('remote_video_holder').classList.add('empty');
    }
  };

  // make inactive a cell with removed media stream
  const removedMedia = document.querySelector(`.${CSS.escape(mediaRenderer.id)}`);
  removedMedia && removedMedia.classList.add('inactive');
};

// handle an endpoint removed
const onEndpointRemoved = ({ endpoint }) => {
  // show empty remote video container
  document.getElementById('remote_video_holder').classList.add('empty');
  // remove black window
  document.querySelector(`.participant-${CSS.escape(endpoint.id)}`) !== null && document.querySelector(`.participant-${CSS.escape(endpoint.id)}`).remove();
  // make inactive a cell with endpoint id
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
