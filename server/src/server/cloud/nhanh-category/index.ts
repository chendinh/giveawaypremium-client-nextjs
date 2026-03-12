import { CategoryResponse } from "../../../external-services/nhanh/interface";
import { NhanhCategoryService } from "../../../external-services/nhanh/nhanh.categories";
import { NHANH_CONFIGS } from "../../../settings/nhanh";

const findAll = async (): Promise<CategoryResponse[]> => {
  const nhanhCategoryService = new NhanhCategoryService(NHANH_CONFIGS);
  return nhanhCategoryService.findAll();
}

export {
  findAll,
};
