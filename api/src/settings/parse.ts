export const PARSE_SERVER_PROPERTY = {
  // Connection string for your MongoDB database
  databaseURI: process.env.DATABASE_URI,
  cloud: process.env.CLOUD || './build/server/cloud/main.js', // Path to your Cloud Code
  appId: process.env.APP_ID || 'myAppId',
  // Keep this key secret!
  masterKey: process.env.MASTER_KEY || 'myMasterKey',
  clientKey: process.env.CLIENT_KEY || 'myClientKey',
  javascriptKey: process.env.JAVASCRIPT_KEY || 'myJavascriptKey',
  restAPIKey: process.env.REST_API_KEY || 'myRestAPIKey',
  // Don't forget to change to https if needed
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/api',
  liveQuery: {
    classNames: ['Channel'],
  },
};

export const PARSE_DASHBOARD_PROPERTY = {
  apps: [
    {
      serverURL: process.env.SERVER_URL || 'http://localhost:1337/api',
      appId: process.env.APP_ID || 'myAppId',
      masterKey: process.env.MASTER_KEY || 'myMasterKey',
      appName: process.env.APP_NAME || 'Lime',
    },
  ],
  users: [
    {
      user: process.env.PARSE_DASHBOARD_USERNAME || 'administrator',
      pass: process.env.PARSE_DASHBOARD_PASSWORD,
    },
  ],
  trustProxy: parseInt(process.env.PARSE_DASHBOARD_TRUST_PROXY || '1'),
  useEncryptedPasswords: process.env.PARSE_DASHBOARD_ENCRYPTED === 'true',
};

export const PARSE_DASHBOARD_OPTIONS = {
  allowInsecureHTTP:
    process.env.PARSE_DASHBOARD_INSECURE_HTTP === 'false' ? false : true,
  cookieSessionSecret:
    process.env.PARSE_DASHBOARD_COOKIE_SESSION_SECRET ||
    'myCookieSessionSecret',
};
