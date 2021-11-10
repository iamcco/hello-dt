import { exec } from 'child_process';
import { createWriteStream, readFileSync, renameSync, unlinkSync } from 'fs';
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

  const formParser = new multiparty.Form({
    maxFieldsSize: 20971520,
  });
  if (req.headers['content-type'] !== undefined) {
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
    const access = createWriteStream('/sys/class/backlight/backlight@0/brightness');
    access.write(params?.value || 1);
    access.close();
    return res.end();
  }
  next(params);
});

use((_req, res, next) => (params) => {
  if (params?.action === 'shutdown') {
    exec('shutdown now');
    return res.end();
  }
  next(params);
});

use((_req, res, next) => (params) => {
  if (params?.action === 'reboot') {
    exec('reboot');
    return res.end();
  }
  next(params);
});

use((_req, res, next) => (params) => {
  if (params?.method === 'get' && params?.action === 'getBrightness') {
    const level = readFileSync('/sys/class/backlight/backlight@0/actual_brightness').toString().trim();
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ level: parseFloat(level) }));
  }
  next(params);
});

use((_req, res, next) => (params) => {
  const targets = params?.files?.target || [];
  if (params?.action === 'print' && targets[0] !== undefined && params?.fields?.size[0] !== undefined) {
    const target = `${targets[0].path}.png`;
    renameSync(targets[0].path, target);
    exec(
      `lp -d devterm_printer -o media=Custom.${params.fields.size[0]}mm -o scaling=100 -o print-quality=5 ${target}`,
    );
    unlinkSync(target);
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
