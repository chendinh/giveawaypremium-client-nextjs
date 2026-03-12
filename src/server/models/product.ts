import { NhanhProductDetail } from "@/server/external-services/nhanh/interface";

enum ProductStatusEnums {
  NEW = 'NEW',
  AVAILABLE = 'AVAILABLE',
  ACTIVE = 'ACTIVE',
};

interface ProductInventory {
  remain: number;
  available: number;
  offline: number;
  active: number;
  delivered: number;
  shipping: number;
};

class Product extends Parse.Object {
  constructor() {
    // Pass the ClassName to the Parse.Object constructor
    super('Product');
    // All other initialization
    // this.status = this.get('status') || 'New';

  }

  public getNhanhProduct(): NhanhProductDetail {
    const data = this.get('nhanhProduct');

    return {
      id: this.id,
      ...data,
    }
  }
};

Parse.Object.registerSubclass('Product', Product);

export { Product, ProductStatusEnums };
export type { ProductInventory };