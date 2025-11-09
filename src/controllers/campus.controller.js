import * as campusService from "#src/services/campus.service.js";
import * as factory from "./handlerFactory.js";
import {
  campusIdSchema,
  createCampusSchema,
  updateCampusSchema,
} from "#src/validations/campus.validation.js";

export const createCampus = factory.createOne({
  schema: createCampusSchema,
  service: campusService.createCampus,
  resourceName: "Campus",
});

export const fetchAllCampuses = factory.getAll({
  service: campusService.getAllCampuses,
  resourceName: "Campus",
});

export const fetchCampusById = factory.getOne({
  schema: campusIdSchema,
  service: campusService.getCampusById,
  resourceName: "Campus",
});

export const fetchCampusBySlug = factory.getSlug({
  service: campusService.getCampusBySlug,
  resourceName: "Campus",
});

export const deleteCampusById = factory.deleteOne({
  schema: campusIdSchema,
  service: campusService.deleteCampus,
  resourceName: "Campus",
});

export const updateCampusById = factory.updateOne({
  idSchema: campusIdSchema,
  updateSchema: updateCampusSchema,
  service: campusService.updateCampus,
  resourceName: "Campus",
});
