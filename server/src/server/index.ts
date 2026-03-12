import * as express from 'express';
// import * as helmet from "helmet";
import * as cors from 'cors';
import * as ParseDashboard from 'parse-dashboard';
import { ParseServer } from 'parse-server';
import { 
  PARSE_SERVER_PROPERTY, 
  PARSE_DASHBOARD_PROPERTY, 
  PARSE_DASHBOARD_OPTIONS 
} from '../settings/parse';
import { BaseError } from './common/error';
import * as hook from './hooks';
import * as media from './media';

const corsOptions = {
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  preflightContinue: false,
  origin: '*',
  optionsSuccessStatus: 204 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.get('/', function (_: express.Request, res: express.Response) {
  res.send('Permission denied')
})

const api = new ParseServer(PARSE_SERVER_PROPERTY);
const dashboard = new ParseDashboard(
	PARSE_DASHBOARD_PROPERTY, 
	PARSE_DASHBOARD_OPTIONS
);

// Serve the Parse API on the /parse URL prefix
app.use('/api', api);

// make the Parse Dashboard available at /dashboard
app.use('/dashboard', dashboard);

app.use('/hooks', hook.router);
app.use('/media', media.router);

// error handler
app.use(
  (
    err: BaseError,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('error', JSON.stringify(err));
    console.error('stack', err.stack)
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.json(err);
  }
);

// app.listen(process.env.PORT || 1337, function () {
//   console.log('parse-server-example running on port 1337.');
//   // jobScheduleActiveCampaign.invoke();
// });
const httpServer = require('http').createServer(app);
httpServer.listen(process.env.PORT || 1337);

// const parseLiveQueryServer = 
ParseServer.createLiveQueryServer(httpServer);
