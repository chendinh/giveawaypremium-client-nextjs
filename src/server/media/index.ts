import * as express from 'express';
import * as multer from 'multer';
import * as fs from 'fs';
import { cloudinaryV2 } from '@/server/external-services/cloudinary';
import { Media } from '../models/media';
import { BaseError } from '../common/error';
import { PARSE_SERVER_PROPERTY } from '@/server/config/parse';
const upload = multer({ dest: './tmp/' });
const router: express.Router = express.Router();

router.post('/', upload.single('media'), async function (
  req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
) {
  try {
    const headers = req.headers;
  
    if (headers['x-parse-application-id'] !== PARSE_SERVER_PROPERTY.appId ||
      headers['x-parse-rest-api-key'] !== PARSE_SERVER_PROPERTY.restAPIKey ||
      !headers['x-parse-session-token']
    ) {
      throw new Parse.Error(Parse.Error.OPERATION_FORBIDDEN, 'forbidden');
    }
    const file = req.file;
    if (file) {
      const [_, resourceFormat] =file.mimetype.split('/');
      fs.renameSync(`${file.path}`, `${file.path}.${resourceFormat}`);
      const response = await cloudinaryV2.uploader.upload(`${file.path}.${resourceFormat}`);
      const media = new Media();
      const result = await media.save(
        { data: response, cloud: 'Cloudinary',  isDraft: true, type: response.signature },
        { useMasterKey: true, sessionToken: headers['x-parse-session-token'] as string }
      )

      return res.json(result);
    }

    throw new BaseError('Please push media');
  } catch (error) {
    next(error);
  }
  
  
  

});

export { router };