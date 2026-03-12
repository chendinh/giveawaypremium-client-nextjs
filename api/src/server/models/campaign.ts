export enum CampaignStatusEnums {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
};

export class Campaign extends Parse.Object {
  constructor() {
    // Pass the ClassName to the Parse.Object constructor
    super('Campaign');
    // All other initialization
    // this.sound = 'Rawr';
  }
};