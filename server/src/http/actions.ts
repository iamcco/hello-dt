import { exec } from 'child_process';
import { createWriteStream, readFileSync, renameSync } from 'fs';
import { IncomingMessage, ServerResponse } from 'http';
import multiparty from 'multiparty';

type nextCb = (params?: {
  method?: string;
  action?: string;
  value?: string;
  fields?: Record<string, any[]>;
  files?: Record<string, any>;
}) => void;

type cb = (req: IncomingMessage, res: ServerResponse, next: nextCb) => nextCb;

const secret = process.argv[2]?.trim();

const actions: cb[] = [];

const use = function (action: cb) {
  actions.unshift(action);
};

// cross origin
use((req, res, next) => (params) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization');

  if (req.method === 'OPTIONS') {
    return res.end();
  }

  next({
    ...(params || {}),
    method: req.method?.toLowerCase(),
  });
});

// auth
use((req, res, next) => (params) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer')) {
    console.log('no auth');
    res.statusCode = 401;
    return res.end();
  }
  const token = auth.split(' ')[1];
  if (token !== secret) {
    console.log('no token', req.headers['authorization']);
    res.statusCode = 401;
    return res.end();
  }
  next(params);
});

// parse data
use((req, res, next) => (params) => {
  // url => /:action/:value
  const pattern = /^\/(\w+)(\/(\w+))?$/;
  const m = req.url?.match(pattern);
  if (!m) {
    res.statusCode = 404;
    return res.end();
  }

  if (req.headers['content-type'] !== undefined) {
    const formParser = new multiparty.Form();
    formParser.parse(req, (err, fields, files) => {
      if (err) {
        console.error(err);
      }
      next({
        ...(params || {}),
        action: m[1],
        value: m[3],
        fields,
        files,
      });
    });
  } else {
    next({
      ...(params || {}),
      action: m[1],
      value: m[3],
    });
  }
});

use((_req, res, next) => (params) => {
  if (params?.action === 'brightness') {
    if (params?.method === 'post') {
      const access = createWriteStream('/sys/class/backlight/backlight@0/brightness');
      access.write(params?.value || 1);
      access.close();
      return res.end();
    } else if (params?.method === 'get') {
      const level = readFileSync('/sys/class/backlight/backlight@0/actual_brightness').toString().trim();
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ level: parseFloat(level) }));
    }
  }
  next(params);
});

use((_req, res, next) => (params) => {
  if (params?.method === 'post' && params?.action === 'shutdown') {
    exec('shutdown now');
    return res.end();
  }
  next(params);
});

use((_req, res, next) => (params) => {
  if (params?.method === 'post' && params?.action === 'reboot') {
    exec('reboot');
    return res.end();
  }
  next(params);
});

use((_req, res, next) => (params) => {
  const target = (params?.files?.target || [])[0];
  const size = (params?.fields?.size || [])[0];
  if (params?.method === 'post' && params?.action === 'print' && target !== undefined && size !== undefined) {
    const targetName = '/tmp/hello-dt-print-target.png';
    renameSync(target.path, targetName);
    exec(`lp -d devterm_printer -o media=Custom.${size}mm -o scaling=100 -o print-quality=5 ${targetName}`);
    return res.end();
  }
  next(params);
});

export function doActions(req: IncomingMessage, res: ServerResponse) {
  return actions.reduce<nextCb>(
    (next, action) => action(req, res, next),
    () => {
      // no action match
      res.statusCode = 404;
      res.end();
    },
  )();
}
