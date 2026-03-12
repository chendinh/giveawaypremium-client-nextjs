import schedule from 'node-schedule';
import { PARSE_SERVER_PROPERTY } from '@/server/config/parse';
import { SCHEDULE_SETTINGS } from '@/server/config/schedule';

export const jobScheduleActiveCampaign = schedule.scheduleJob(
  SCHEDULE_SETTINGS.ACTIVE_CAMPAIN, 
  function() {
    Parse.Cloud.httpRequest({
      url: `${PARSE_SERVER_PROPERTY.serverURL}/jobs/ActiveCampaign`,
      method: 'post',
      headers: {
        'X-Parse-Application-Id': PARSE_SERVER_PROPERTY.appId,
        'X-Parse-Master-Key': PARSE_SERVER_PROPERTY.masterKey,
      }
    })
    .then(httpResponse => console.log(`[Request] [Jobs] ActiveCampaign success: ${httpResponse.text}`))
    .catch(httpResponse => console.error(
      `[Request] [Jobs] ActiveCampaign failed ${httpResponse.status} ${httpResponse}`)
    );
  }
);
