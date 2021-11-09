import http from 'http';
import { doActions } from './actions';

export async function startHttp(): Promise<number> {
  return new Promise((resolve) => {
    // http server
    const server = http.createServer(doActions);

    server.on('error', (err) => {
      console.error(`http server error: `, err);
      process.exit(1);
    });

    server.listen(0, '0.0.0.0', () => {
      const address = server.address();

      const port = typeof address === 'string' ? address.split(':')[1] : address?.port;

      console.log(`Running at: ${port}`);

      resolve(parseFloat(port as any));
    });
  });
}
