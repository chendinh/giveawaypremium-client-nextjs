import * as cloudinary from 'cloudinary';
import { CLOUDINARY_CONFIGS } from '../../settings/coudinary';
const cloudinaryV2 = cloudinary.v2;

cloudinaryV2.config(CLOUDINARY_CONFIGS);

export {
  cloudinaryV2
};
