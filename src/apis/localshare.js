const net = require('net');
const axios = require('axios');
const { EventEmitter } = require('events');
const debug = require('debug')('localshare:client');

const MAX_SOCKETS = 10;

class Tunnel extends EventEmitter {
  constructor(options) {
    super();

    this.remote = net.connect(options.remote, () => {
      debug('remote socket connected');

      this.local = net.connect(options.local, () => {
        debug('local socket connected');
      });

      this.local.on('error', () => {
        debug('local socket errored');
      });

      this.local.on('close', () => {
        this.emit('close');
      });

      this.remote.pipe(this.local);
      this.local.pipe(this.remote);
    });

    this.remote.on('error', () => {
      debug('remote socket errored');
    });

    this.remote.on('close', () => {
      this.emit('close');
    });
  }
}

class TunnelCluster {
  constructor(options) {
    this.options = options;
    this.tunnels = [];
  }

  start() {
    const count = MAX_SOCKETS - this.tunnels.length;

    for (let i = 0; i < count; i++) {
      const tunnel = new Tunnel(this.options);

      tunnel.once('close', () => {
        debug('tunnel closed');

        this.tunnels.splice(this.tunnels.indexOf(tunnel), 1);
        this.start();
      });

      this.tunnels.push(tunnel);
    }
  }
}

module.exports = async (options) => {
  const { protocol, host } = new URL(options.api);

  const { data } = await axios.get(options.api, {
    params: {
      create: true,
      subdomain: options.subdomain,
    },
  });

  debug('tunnel created', data);

  if (!data.subdomain) {
    return;
  }

  new TunnelCluster({
    remote: {
      host,
      port: data.port,
    },
    local: {
      host: options.host,
      port: options.port,
    },
  }).start();

  return {
    url: `${protocol}//${data.subdomain}.${host}`,
  };
};
