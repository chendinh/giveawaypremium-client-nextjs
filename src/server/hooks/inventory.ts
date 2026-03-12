import { Request, Response } from 'express';

const listenInventory = async (req: Request, res: Response) => {
  const body = req.body;
  console.log("hook inventoy", body);
  const inventories = body.data ? JSON.parse(body.data) : [] ;
  console.log("hook inventoy data", JSON.stringify(inventories));
  if (!inventories || !Object.keys(inventories).length) return res.json({ success: false });

  // for (const inventory of inventories) {
  //   const idNhanh = inventory.idNhanh;
  //   if (idNhanh) {
  //     const query = new Parse.Query(Product);
  //     query.equalTo('nhanhProduct.idNhanh', idNhanh);
  //     const product = await query.first();
  //     if (!product) { console.error(`Not Found product with idNhanh: ${idNhanh}`); }
  //     if (product) {
  //       const nhanhProductService = new NhanhProductService(NHANH_CONFIGS);
  //       const nhanhDetail = await nhanhProductService.findByNhanhId(idNhanh);
  //       product.save({
  //         nhanhProduct: nhanhDetail,
  //       }, { useMasterKey: true });
  //     }
  //   }
  // }
  return res.json({ success: true });
};

export {
  listenInventory
};
