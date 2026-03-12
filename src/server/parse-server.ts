import express from 'express';
import cors from 'cors';
import { ParseServer } from 'parse-server';
import ParseDashboard from 'parse-dashboard';
import {
  PARSE_SERVER_PROPERTY,
  PARSE_DASHBOARD_PROPERTY,
  PARSE_DASHBOARD_OPTIONS,
  PARSE_INTERNAL_URL,
} from '@/server/config/parse';
import { BaseError } from '@/server/common/error';
import * as hook from '@/server/hooks';
import * as media from '@/server/media';

let isStarted = false;

export async function startParseServer(): Promise<void> {
  if (isStarted) return;
  isStarted = true;

  const port = process.env.PARSE_INTERNAL_PORT || '4000';

  const corsOptions: cors.CorsOptions = {
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    preflightContinue: false,
    origin: '*',
    optionsSuccessStatus: 204,
  };

  const app = express();
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  app.get('/', function (_: express.Request, res: express.Response) {
    res.send('Parse Server is running inside Next.js');
  });

  const api = new ParseServer(PARSE_SERVER_PROPERTY);
  const dashboard = new ParseDashboard(
    PARSE_DASHBOARD_PROPERTY,
    PARSE_DASHBOARD_OPTIONS,
  );

  // Serve the Parse API on the /api URL prefix
  app.use('/api', api);

  // Make the Parse Dashboard available at /dashboard
  app.use('/dashboard', dashboard);

  // Hooks and media
  app.use('/hooks', hook.router);
  app.use('/media', media.router);

  // Error handler
  app.use(
    (
      err: BaseError,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('error', JSON.stringify(err));
      console.error('stack', err.stack);
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};
      res.status(err.status || 500);
      res.json(err);
    },
  );

  const httpServer = require('http').createServer(app);
  httpServer.listen(port, () => {
    console.log(`[Parse Server] Running internally on port ${port}`);
    console.log(`[Parse Server] API: ${PARSE_INTERNAL_URL}/api`);
    console.log(`[Parse Server] Dashboard: ${PARSE_INTERNAL_URL}/dashboard`);
  });

  ParseServer.createLiveQueryServer(httpServer);
}
