import { startHttp } from './http';
import { startMdns } from './mdns';

process.on('uncaughtException', (err) => {
  console.error('UncaughtException: ', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection: ', reason);
});

async function main() {
  const port = await startHttp();
  startMdns(port);
}

main();
