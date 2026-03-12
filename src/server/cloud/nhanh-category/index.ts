import { CategoryResponse } from "@/server/external-services/nhanh/interface";
import { NhanhCategoryService } from "@/server/external-services/nhanh/nhanh.categories";
import { NHANH_CONFIGS } from "@/server/config/nhanh";

const findAll = async (): Promise<CategoryResponse[]> => {
  const nhanhCategoryService = new NhanhCategoryService(NHANH_CONFIGS);
  return nhanhCategoryService.findAll();
}

export {
  findAll,
};
