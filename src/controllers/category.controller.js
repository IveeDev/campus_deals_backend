import * as categoryService from "../services/category.service.js";
import {
  createCategorySchema,
  categoryIdSchema,
  updateCategorySchema,
} from "../validations/category.validation.js";
import * as factory from "./handlerFactory.js";

export const createCategory = factory.createOne({
  schema: createCategorySchema,
  service: categoryService.createCategory,
  resourceName: "Category",
});

export const fetchAllCategories = factory.getAll({
  service: categoryService.getAllCategories,
  resourceName: "Category",
});

export const fetchCategoryById = factory.getOne({
  schema: categoryIdSchema,
  service: categoryService.getCategoryById,
  resourceName: "Category",
});

export const fetchCategoryBySlug = factory.getSlug({
  service: categoryService.getCategoryBySlug,
  resourceName: "Category",
});

export const deleteCategoryById = factory.deleteOne({
  schema: categoryIdSchema,
  service: categoryService.deleteCategory,
  resourceName: "Category",
});

export const updateCategoryById = factory.updateOne({
  idSchema: categoryIdSchema,
  updateSchema: updateCategorySchema,
  service: categoryService.updateCategory,
  resourceName: "Category",
});
