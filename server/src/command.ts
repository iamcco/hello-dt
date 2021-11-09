/* eslint-disable @typescript-eslint/no-var-requires */
import { exec } from 'child_process';
import qrcode from 'qrcode-terminal';
import { program } from 'commander';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { nanoid } from 'nanoid';
import packageInfo from '../package.json';

const secret = nanoid();

const scriptPath = process.argv[1];
const serviceTemplate = `[Unit]
Description=hello-dt service
After=multi-user.target

[Service]
Type=simple
StandardOutput=file:/tmp/hello-dt.log
StandardError=file:/tmp/hello-dt.err.log
ExecStart=${join(dirname(scriptPath), 'hello-dt.service')} ${secret}
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
`;

program.showSuggestionAfterError();

program.version(packageInfo.version);

program.option('-i, --install', 'install hello-dt service');
program.option('-u, --uninstall', 'uninstall hello-dt service');
program.option('-e, --enable', 'enable hello-dt service');
program.option('-d, --disable', 'disable hello-dt service');
program.option('--start', 'start hello-dt service');
program.option('--stop', 'stop hello-dt service');

program.parse();

const options = program.opts();

if (options.install) {
  try {
    writeFileSync('/etc/systemd/system/hello-dt.service', serviceTemplate);
    exec('systemctl daemon-reload');
    exec('systemctl status hello-dt.service', (err) => {
      if (!err) {
        exec('systemctl restart hello-dt.service');
      }
      console.log(`Secret token: ${secret}`);
      qrcode.generate(secret, { small: true });
      console.log('Scan above QRCode use hello-dt app');
      console.log('hello-dt service install success!');
    });
  } catch (e) {
    console.error(e);
  }
} else if (options.uninstall) {
  exec('systemctl stop hello-dt.service');
  exec('rm /etc/systemd/system/hello-dt.service', (err, _stdout, stderr) => {
    if (err) {
      console.error(err);
      console.log(stderr);
      return;
    }
    console.log('hello-dt service uninstall success!');
  });
}

['enable', 'disable', 'start', 'stop'].forEach((command) => {
  if (options[command]) {
    exec(`systemctl ${command} hello-dt.service`, (err, _stdout, stderr) => {
      if (err) {
        console.error(err);
        console.log(stderr);
        return;
      } else {
        console.log(`hello-dt ${command} success!`);
      }
    });
  }
});

if (Object.keys(options).length === 0) {
  program.help();
}
