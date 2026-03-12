import { Request, Response } from 'express';

const updateProduct = async (req: Request, res: Response) => {
  const body = req.body;
  const nhanhProducts = body.data ? JSON.parse(body.data) : undefined ;
  if (!nhanhProducts || !Object.keys(nhanhProducts).length) return res.json({ success: true });

  // for (const key in nhanhProducts) {
  //   const nhanhProduct: NhanhProductDetail = nhanhProducts[key];
  //   const idNhanh = nhanhProduct.idNhanh
  //   if (idNhanh) {
  //     const query = new Parse.Query(Product);
  //     query.equalTo('nhanhProduct.idNhanh', idNhanh);
  //     const product = await query.first();
  //     if (!product) { console.error(`Not Found product with idNhanh: ${idNhanh}`); }
  //     if (product) product.save(
  //       { nhanhProduct, hookSyncedAt: new Date() }, 
  //       { useMasterKey: true }
  //     );
  //   }
  // }

  return res.json({ success: true });
};

export {
  updateProduct
};
