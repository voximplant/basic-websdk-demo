const endpointsMedia = {};
const onEndpointAdded = ({ endpoint }) => {
  console.warn('Endpoint added: ', endpoint);
  endpointsMedia[endpoint.id] = [];
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
const onRemoteMediaAdded = ({ endpoint, mediaRenderer }) => {
  console.warn('MediaRenderer added: ', mediaRenderer);

  const mediaRendererKind = mediaRenderer.kind.replace('sharing', 'video');
  if (!endpoint.isDefault || !isConference) {
    document.getElementById('remote_video_holder').classList.remove('empty');

    // render media in container
    endpointsMedia[endpoint.id].push(mediaRendererKind);
    if (mediaRendererKind === 'audio' && !endpointsMedia[endpoint.id].includes('video')) {
      addNoVideoContainer(endpoint.id);
    }
    if(mediaRendererKind === 'video' && document.querySelector(`.participant-${CSS.escape(endpoint.id)}`) !== null) {
      document.querySelector(`.participant-${CSS.escape(endpoint.id)}`).remove();
    }
    const videoHolder = document.querySelector('.remote-video-holder');
    mediaRenderer.render(videoHolder);
  }

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

const onRemoteMediaRemoved = ({ endpoint, mediaRenderer }) => {
  console.warn('MediaRenderer removed: ', mediaRenderer);
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
  const removedMedia = document.querySelector(`.${CSS.escape(mediaRenderer.id)}`);
  removedMedia && removedMedia.classList.add('inactive');
};

const onEndpointRemoved = ({ endpoint }) => {
  document.getElementById('remote_video_holder').classList.add('empty');
  document.querySelector(`.participant-${CSS.escape(endpoint.id)}`) !== null && document.querySelector(`.participant-${CSS.escape(endpoint.id)}`).remove();
  document.querySelector(`.${CSS.escape(endpoint.id)}-id`).classList.add('inactive');
};

const addNoVideoContainer = (endpointId) => {
  const participantContainer = document.createElement('div');
  participantContainer.classList.add('participant-container', `participant-${endpointId}`);
  const noVideoSign = document.createElement('div');
  noVideoSign.classList.add('white-circle');
  participantContainer.appendChild(noVideoSign);
  document.querySelector('.remote-video-holder').appendChild(participantContainer);
};