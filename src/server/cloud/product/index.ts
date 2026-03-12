// import { NhanhProductService } from '../../../external-services/nhanh';
// import { NHANH_CONFIGS } from '../../../settings/nhanh';

import { Consignment } from '@/server/models/consignment';
import { Media } from '@/server/models/media';
import { Product, ProductStatusEnums } from '@/server/models/product';
import sum from 'lodash/sum';


// const afterCreate = async (request: Parse.Cloud.AfterSaveRequest<Product>) => {
//   const product = request.object;
//   const nhanhProductService = new NhanhProductService(NHANH_CONFIGS);
//   nhanhProductService.create([
//     {
//       id: product.id,
//       name: product.get('name'),
//       price: product.get('price'),
//       status: 'New',
//       code: product.get('code'),
//       categoryId: product.get('nhanhCategoryId')
//     }
//   ]).then(async (result) => {
//     const nhanhDetail = await nhanhProductService.findByNhanhId(result.ids[product.id]);
//     product.save({
//       nhanhProduct: nhanhDetail,
//       nhanhSyncStatus: 'SUCCESS'
//     }, { useMasterKey: true });
//   }).catch((error) => {
//     product.save({
//       nhanhSyncStatus: 'FAILED',
//       nhanhSyncError:  {
//         error: JSON.stringify(error),
//         stack: error.stack
//       },
//     }, { useMasterKey: true });
//   })
// };

// const updateNhanhProduct = async (request: Parse.Cloud.BeforeSaveRequest<Product>) => {
//   const product = request.object;
//   const data = product.getNhanhProduct();
//   const nhanhProductService = new NhanhProductService(NHANH_CONFIGS);
//   const result = await nhanhProductService.update([data]);
//   const nhanhDetail = await nhanhProductService.findByNhanhId(result.ids[product.id]);
//   product.set('nhanhProduct', nhanhDetail);
// };

// const afterCreate = async (request: Parse.Cloud.AfterSaveRequest<Product>) => {
//   const product = request.object;
//   const inventory = new Inventory();
//   const data = {
//     status: InventoryStatusEnums.AVAILABLE,
//     amount: product.get('count'),
//     createdBy: product.get('consignee'),
//     product: product,
//   }
//   inventory.save(data, { useMasterKey: true });
// }

const syncConsignment = async (request: Parse.Cloud.AfterSaveRequest<Product>) => {
  const query = new Parse.Query(Consignment);
  const consignmentPointer = request.object.get('consignment');
  const consignmentId = consignmentPointer.id;
  const consignment = await query
    .equalTo('objectId', consignmentId)
    .greaterThan('createdAt', new Date("2022-08-04T15:04:06.196Z"))
    .first();

  if (!consignment) { return }

  const prodQuery = new Parse.Query(Product);
  const products = await prodQuery.equalTo('consignment', consignmentPointer).find();
  const productList = products.map((product) => {
    const productJson = product.toJSON();
    return { 
      ...productJson,
      subCategoryId: product.get('subCategory')?.id ?? null,
      categoryId: product.get('category')?.id ?? null
    }
  });
  const soldNumberProducts = products.map((product) => product.get('soldNumberProduct') ?? 0);
  const numSoldConsignment = sum(soldNumberProducts);
  const remainNumberProducts = products.map((product) => product.get('remainNumberProduct') ?? 0);
  const remainNumConsignment = sum(remainNumberProducts);
  const counts = products.map((product) => product.get('count') ?? 0);
  const numberOfPoducts = sum(counts);
  const moneyBackForFullSolds = products.map((product) => {
    const productPrice = product.get('price') ?? 0;
    const count = product.get('count') ?? 0;
    let moneyBackSold = productPrice;

    if (productPrice > 0) {
      if (productPrice < 1000) {
        moneyBackSold = productPrice * 74 / 100
      } else if (productPrice >= 1000 && productPrice <= 10000) {
        moneyBackSold = productPrice * 77 / 100
      } else if (productPrice > 10000) {
        moneyBackSold = productPrice * 80 / 100
      }
    }
    return moneyBackSold * count;
  });
  const moneyBackForFullSold = sum(moneyBackForFullSolds);
  const totalMoneys = products.map((product) => {
    const productPrice = product.get('price') ?? 0;
    const count = product.get('count') ?? 0;

    return productPrice * count;
  });
  const totalMoney = sum(totalMoneys);
  const moneyBackProduct = products.map((product) => {
    const productPrice = product.get('price') ?? 0;
    const soldNumberProduct = product.get('soldNumberProduct') ?? 0
    let moneyBackSold = productPrice;

    if (productPrice > 0) {
      if (productPrice < 1000) {
        moneyBackSold = productPrice * 74 / 100
      } else if (productPrice >= 1000 && productPrice <= 10000) {
        moneyBackSold = productPrice * 77 / 100
      } else if (productPrice > 10000) {
        moneyBackSold = productPrice * 80 / 100
      }
    }
    return moneyBackSold * soldNumberProduct;
  });
  const moneyBack = sum(moneyBackProduct);
  consignment.save({
    productList,
    numSoldConsignment,
    remainNumConsignment,
    numberOfPoducts,
    moneyBackForFullSold,
    totalMoney,
    moneyBack,
  }, { useMasterKey: true });
}

const afterUpdate = async (request: Parse.Cloud.AfterSaveRequest<Product>) => {

}

const beforeCreate = async(request: Parse.Cloud.BeforeSaveRequest<Product>) => {
  const product = request.object;
  product.set('status', ProductStatusEnums.NEW);
  product.set('soldNumberProduct', 0);
}

const handleProductMedias = async (request: Parse.Cloud.BeforeSaveRequest<Product>) => {
  const product = request.object;
  const medias = product.get('medias') as Media[] || [];
  medias.forEach(media => {
    media.save({ isDraft: false }, { useMasterKey: true })
  })
};

const beforeSave = async(request: Parse.Cloud.BeforeSaveRequest<Product>) => {
  const product = request.object;

  if (product.dirty('consignment') && !product.get('consignment')) {
    throw new Error('Invalid Consignment Pointer')
  }

  if (product.dirty('medias')) {
    request.context.dirtyMedias = true;
  }

  if (product.isNew()) {
    beforeCreate(request);
    request.context.isNew = true ;
  }
};

const afterSave = async (request: Parse.Cloud.AfterSaveRequest<Product>) => {
  const context = request.context;
  syncConsignment(request);
  if (context.isNew) {
    // afterCreate(request);
  } else {
    afterUpdate(request)
  }
  if (context.dirtyMedias) {
    handleProductMedias(request);
  }

}

export {
  beforeSave,
  afterSave
};
