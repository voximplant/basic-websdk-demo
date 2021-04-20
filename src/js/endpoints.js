const onEndpointAdded = ({ endpoint }) => {
  console.warn('Endpoint added: ', endpoint);

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
  console.log('Endpoint: ', endpoint);
  console.warn('MediaRenderer added: ', mediaRenderer);

  // render media in container
  const mediaRendererKind = mediaRenderer.kind.replace('sharing', 'video');
  if (
    mediaRendererKind === 'video' &&
    document.getElementById('remote_video_holder').classList.contains('empty')
  ) {
    document.getElementById('remote_video_holder').classList.remove('empty');
  }
  const remoteVideoHolder = document.getElementById('remote_video_holder');
  mediaRenderer.render(remoteVideoHolder);

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
      const endpointRow = document.querySelectorAll(`.${CSS.escape(`${endpoint.id}`)}`);
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

const onRemoteMediaRemoved = ({ mediaRenderer }) => {
  console.warn('MediaRenderer removed: ', mediaRenderer);
  const removedMedia = document.querySelector(`.${CSS.escape(mediaRenderer.id)}`);
  removedMedia && removedMedia.classList.add('inactive');
};

const onEndpointRemoved = ({ endpoint }) => {
  console.log('Endpoint removed', endpoint);
  document.querySelector(`.${CSS.escape(endpoint.id)}-id`).classList.add('inactive');
  console.log(document.querySelector('.remote-video-holder').querySelector('video'));
  if (!document.getElementById('remote_video_holder').querySelector('video')) {
    document.getElementById('remote_video_holder').classList.add('empty');
  }
};
