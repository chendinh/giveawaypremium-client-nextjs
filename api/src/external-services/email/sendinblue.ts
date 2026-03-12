import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import logger from '../../plugins/logger';
import { SENDINBLUE_CONFIGS } from '../../settings/email';
import {IMailData, IEmailFactory, IMailOptions} from './interface';

export class SendInBlueMailerFactory implements IEmailFactory {
	private apiInstance: any;
	private from: string;
	constructor(options: IMailOptions) {
		this.from = options.from;
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    // Configure API key authorization: api-key
    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = SENDINBLUE_CONFIGS.apiKey;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
	}

	public async send(data: IMailData): Promise<void> {
    try {
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { email: this.from };
      sendSmtpEmail.to = [
        {
          email: data.mailTo,
          name: data.mailTo.split('@')[0],
        },
      ];
      sendSmtpEmail.subject = data.title;
      sendSmtpEmail.htmlContent = data.html;
      this.apiInstance.sendTransacEmail(sendSmtpEmail).then(
        function (data) {
          logger.info(`Message send successfully. Returned data: %s ${JSON.stringify(data)}`);
        },
        function (error) {
          logger.error(`Message send failed. error: %s ${JSON.stringify(error)}`);
        }
      );
      // logger.info('Message sent: %s', info);
			return;
    } catch (error: any) {
      logger.error(`SendInBlueMailerFactory error: ${JSON.stringify(error)}`);
			throw error;
    }
	}
};