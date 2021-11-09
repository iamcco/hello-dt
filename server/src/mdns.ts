import { NetworkInterfaceInfo, networkInterfaces } from 'os';
import Bonjour from 'bonjour-service';

function checkIfInLocalNetwork() {
  const res = networkInterfaces();
  for (const item of Object.values(res)) {
    const inLocalNetwork = (item as NetworkInterfaceInfo[]).some((info) => {
      console.log(`Info: ${JSON.stringify(info)}`);
      if (info.family === 'IPv4' && info.address?.startsWith('192')) {
        return true;
      }
      return false;
    });
    if (inLocalNetwork) {
      return true;
    }
  }
  return false;
}

export async function startMdns(port: number) {
  if (!checkIfInLocalNetwork()) {
    return setTimeout(startMdns, 10000);
  }
  console.log('Start publish DevTerm');
  const instance = new Bonjour();
  instance.publish({ name: 'DevTerm', type: 'http', port });
}
