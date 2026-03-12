// import * as ejs from 'ejs';
import * as moment from 'moment';
import { MailFactory } from "../../external-services/email";
import { MAIL_TYPE } from "../../external-services/email/constants";
import { MAIL_CONFIGS } from "../../settings/email";
import { Consignment } from "../models/consignment";
import { ConsignmentGroup } from "../models/consignment.group";
import { Email } from '../models/email';

const emailFactory = MailFactory.getMail(MAIL_TYPE.SENDINBLUE, MAIL_CONFIGS);
// const templatesPath = './templates/email';

const getEmailTemplates = async (): Promise<Email[]> => {
	const query = new Parse.Query(Email);
	const emails = await query.find();
	return emails; 
}

const reminderEmail = async (consignment: Consignment): Promise<string> => {
	const remainNumConsignment = consignment.get('remainNumConsignment') as number;
	const isTransferMoneyWithBank = consignment.get('isTransferMoneyWithBank') as boolean;
	const timeGetMoneyStr = consignment.get('timeGetMoney') as string;
	const timeGetMoney = moment(timeGetMoneyStr, "DD-MM-YYYY").subtract(3, 'days').format("DD-MM-YYYY");
	// let templatePath = '';
	const emails = await getEmailTemplates();
	let email: Email | undefined;
	// const data: { timeGetMoney: string, remainNumConsignment?: number } = {
	// 	timeGetMoney: moment(timeGetMoney, "DD-MM-YYYY").subtract(3, 'days').format("DD-MM-YYYY"),
	// }

	switch (isTransferMoneyWithBank) {
		case false:
			if (remainNumConsignment === 0) {
				// templatePath = `${templatesPath}/reminder1.ejs`;
				email = emails.find(el => el.get('key') === 'REMINDER1')
			} else {
				// templatePath = `${templatesPath}/reminder2.ejs`;
				// data.remainNumConsignment = remainNumConsignment;
				email = emails.find(el => el.get('key') === 'REMINDER2')
			}
			break;
		case true:
			if (remainNumConsignment === 0) {
				// templatePath = `${templatesPath}/reminder3.ejs`;
				email = emails.find(el => el.get('key') === 'REMINDER3')
			} else {
				// templatePath = `${templatesPath}/reminder4.ejs`;
				// data.remainNumConsignment = remainNumConsignment;
				email = emails.find(el => el.get('key') === 'REMINDER4')
			}
			break;
		default:
			email = undefined;
			break;
			
	}

	if (!email) {
		throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `Reminder Template Not Found.`);
	}

	const content = (email.get('content') as string) ?? '';

	return content.replace('{{remainNumConsignment}}', `${remainNumConsignment}`).replace('{{timeGetMoney}}', `${timeGetMoney}`)
}

const remiderConsignment = async (consignment: Consignment): Promise<void> => {
	try {
		const consigner = consignment.getConsigner();
		const email = consigner.get('mail') as string;

		if (!email) throw new Parse.Error(Parse.Error.EMAIL_NOT_FOUND, `emai consigner ${consigner.id} not found`);

		const html = await reminderEmail(consignment);

		await emailFactory.send({
			mailTo: email,
			title: `Give Away Premium thông báo: đơn hàng ${consignment.id}`, // Subject line
			html,
		});

		return;
	} catch (error) {
		console.error(`[Error] remiderConsignment`, error);
		return;
	}
}

export const reminderConsignmentGroup = async (
  	request: Parse.Cloud.FunctionRequest<{ groupId: string; }>
): Promise<any> => {
	const { groupId } = request.params;
	const pointerConsignmentGroup = new ConsignmentGroup();
	pointerConsignmentGroup.id = groupId;

	const query = new Parse.Query(Consignment);
	const consignments = await query.equalTo('group', pointerConsignmentGroup)
			.include('consigner')
			.limit(1000)
			.find();
	
	const promises = consignments.map((consignment) => remiderConsignment(consignment));

	Promise.all(promises);

	return { success: true };
}; 

export const remiderIndividualConsignment  = async (
	  request: Parse.Cloud.FunctionRequest<{ objectId: string; }>
): Promise<any> => {
	const { objectId } = request.params;
	const query = new Parse.Query(Consignment);
	const consignment = await query
		.equalTo('objectId', objectId)
		.include('consigner')
		.first();

	if (!consignment) throw new Parse.Error(Parse.Error.VALIDATION_ERROR, `invalid consignment ${objectId}`);

	remiderConsignment(consignment);

	return { success: true };
}; 