import {createTransport, Transporter} from 'nodemailer';
import logger from '../../plugins/logger';
import {IMailData, IEmailFactory, IMailOptions } from './interface';
export class NodemailerFactory implements IEmailFactory {
	private transporter: Transporter;
	private from: string;
	constructor(options: IMailOptions) {
		this.from = options.from;
		this.transporter = createTransport({
			service: options.service,
			host: options.host,
			port: options.port,
			secure: options.secure,
			auth: options.auth,
			pool: options.pool || true,
		});
	}

	public async send(data: IMailData): Promise<void> {
		try {
			const info = await this.transporter.sendMail({
				from: this.from, // sender address
				to: data.mailTo, // list of receivers
				subject: data.title, // Subject line
				html: data.html // html body
			});

			logger.info('Message sent: %s', info.messageId);
			return;
		} catch (error: any) {
			logger.error(error, '++++++++++++++++++');
			throw error;
		}
	}
};