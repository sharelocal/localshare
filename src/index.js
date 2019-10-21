#!/usr/bin/env node

const program = require('commander');
const { localshare } = require('./apis');

const start = async () => {
  const tunnel = await localshare({
    host: program.host,
    port: program.port,
    api: program.api,
    subdomain: program.subdomain,
  });

  if (!tunnel.url) {
    console.error(`Proxy creation is failed: ${JSON.stringify(tunnel)}`);
  } else {
    console.log(`Your proxy is ${tunnel.url}`);
  }
};

program
  .name('share')
  .option('-a, --api <api>', 'Proxy server', 'https://localshare.me')
  .option('-h, --host <host>', 'Host to share', '127.0.0.1')
  .option('-p, --port <port>', 'Port to share')
  .option('-s, --subdomain <domain>', 'Custom subdomain')
  .helpOption('--help', 'Show help')
  .parse(process.argv);

if (!program.port) {
  program.outputHelp();
} else {
  start();
}
