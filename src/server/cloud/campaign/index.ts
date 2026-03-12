import { SCHEDULE_SETTINGS } from "@/server/config/schedule";
import { 
  Campaign,
  // CampaignStatusEnums 
} from "@/server/models/campaign";
// import { ProductStatusEnums } from "@/server/models/product";
import { jobScheduleActiveCampaign } from "@/server/schedule";

// const handleStatusCampaign = async (request: Parse.Cloud.AfterSaveRequest<Campaign>) => {
//   const campaign = request.object;
//   const status: CampaignStatusEnums = campaign.get('status');
//   if (status === CampaignStatusEnums.ACTIVE) {
//     const products = campaign.get('products');
//     products.forEach(async productObject => {
      
//       const product = await productObject.fetch();
//       const campaigns = product.get('campaigns') || [];
//       campaigns.push(campaign.toPointer());
//       product.save(
//         { status: ProductStatusEnums.ACTIVE, campaigns: campaigns },
//         { useMasterKey: true }
//       )
//     });

//   }
// };

const beforeSave = async (request: Parse.Cloud.BeforeSaveRequest<Campaign>) => {
  try {
    const campaign = request.object;
    if (campaign.isNew()) {
      request.context.isNew = true ;
      jobScheduleActiveCampaign.reschedule(SCHEDULE_SETTINGS.ACTIVE_CAMPAIN);
    }
    if (campaign.dirty('status')) {
      request.context.dirtyStatus = true;
    }

  } catch (error) {
    throw error;
  }
};

// const afterSave = async (request: Parse.Cloud.AfterSaveRequest<Campaign>) => {
  
// }


export {
  beforeSave,
  // afterSave
};