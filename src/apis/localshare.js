const net = require('net');
const debug = require('debug')('localshare:client');
const axios = require('axios');

const createSockets = (options) => {
  const remote = net.connect(options.remote);
  const local = net.connect(options.local);

  remote.pipe(local);
  local.pipe(remote);

  [remote, local].forEach((socket) => {
    socket.on('error', () => {});
    socket.on('close', () => setTimeout(() => createSockets(options), 500));
  });
};

module.exports = async (options) => {
  const { data } = await axios.post('https://localshare.me/hello', {
    subdomain: options.subdomain ? options.subdomain : undefined,
  });

  if (data.url) {
    createSockets({
      remote: data,
      local: options,
    });
  }

  return data;
};
