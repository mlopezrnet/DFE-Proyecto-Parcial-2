export const apiURL = 'https://653485e2e1b6f4c59046c7c7.mockapi.io/api';

export const isValidUrl = urlString => {
  try {
    return Boolean(new URL(urlString));
  }
  catch (e) {
    return false;
  }
}

export function fetchAPI(endpointOrUrl, method = 'GET', data = null) {

  let url = '';

  if (isValidUrl(endpointOrUrl)) {
    url = endpointOrUrl;
  } else {
    url = `${apiURL}/${endpointOrUrl}`;
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
  };

  if (data !== null && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la solicitud: ' + response.status);
      }
      return response.json();
    })
    .catch(error => {
      if (error instanceof TypeError) {
        console.error('Error de red:', error.message);
      } else {
        console.error('Error general:', error.message);
      }
    });

}
