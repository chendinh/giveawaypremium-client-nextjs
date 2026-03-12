import * as cloudinary from 'cloudinary';
import { cloudinaryConfigs } from '../../config/cloudinary.config';

const cloudinaryV2 = cloudinary.v2;
cloudinaryV2.config(cloudinaryConfigs);

export { cloudinaryV2 };
