import * as listingService from "#services/listing.service.js";
import * as userService from "#services/user.service.js";
import { formatValidationError } from "#src/utils/format.js";
import { catchAsync } from "#src/utils/catchAsync.js";
import {
  createListingSchema,
  listingIdSchema,
  updateListingSchema,
} from "#src/validations/listing.validation.js";
import { AppError } from "#src/utils/AppError.js";
import * as factory from "./handlerFactory.js";

export const createListing = catchAsync(async (req, res) => {
  const sellerId = req.user.id;

  const validationResult = createListingSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(
      "Invalid listing data",
      400,
      formatValidationError(validationResult.error)
    );
  }

  // Validate minimum 1 image
  if (!req.files || req.files.length < 1) {
    throw new AppError("At least 1 image is required", 400);
  }

  if (req.files.length > 5) {
    throw new AppError("A maximum of 5 images is allowed", 400);
  }

  const imageUrls = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
  }));

  const listing = await listingService.createListing({
    ...validationResult.data,
    sellerId,
    images: imageUrls,
  });

  res.status(201).json({
    message: "Listing created successfully",
    data: listing,
  });
});

export const fetchListingById = factory.getOne({
  schema: listingIdSchema,
  service: listingService.getListingById,
  resourceName: "Listing",
});

export const softDeleteListingById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const validationResult = listingIdSchema.safeParse({ id: req.params.id });

  const { id } = validationResult.data;

  const listing = await listingService.softDeleteListing(id, userId);
  res.status(200).json({
    message: "Listing deleted successfully",
    data: listing,
  });
});

export const updateListingById = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const IdValidation = listingIdSchema.safeParse({ id: req.params.id });

  if (!IdValidation.success) {
    throw new AppError(
      "Invalid listing ID",
      400,
      formatValidationError(IdValidation.error)
    );
  }

  const updateValidation = updateListingSchema.safeParse(req.body);
  if (!updateValidation.success) {
    throw new AppError(
      "Invalid listing data",
      400,
      formatValidationError(updateValidation.error)
    );
  }
  const { id } = IdValidation.data;

  const updatedListing = await listingService.updateListing(
    id,
    userId,
    updateValidation.data,
    req.files
  );

  res.status(200).json({
    message: "Listing updated successfully",
    data: updatedListing,
  });
});

export const fetchAllListings = factory.getAll({
  service: listingService.getAllListings,
  resourceName: "Listings",
});

export const fetchMyListings = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const listings = await listingService.getListingsByUser(userId);

  res.status(200).json({
    message: "User listings fetched successfully",
    data: listings,
  });
});

export const fetchListingsByUser = catchAsync(async (req, res) => {
  const userId = Number(req.params.userId);

  if (isNaN(userId)) {
    throw new AppError("Invalid user ID", 400);
  }

  await userService.getUserById(userId);

  const result = await listingService.getListingsByUserId(userId, req.query);

  res.status(200).json({
    message: "User listings fetched successfully",
    result,
  });
});

export const fetchRelatedListings = catchAsync(async (req, res) => {
  const listingId = Number(req.params.id);
  if (isNaN(listingId)) throw new AppError("Invalid listing ID", 400);

  const limit = Number(req.query.limit) || 10;
  const type = req.query.type === "advanced" ? "advanced" : "basic";

  const result = await listingService.getRelatedListings(listingId, {
    limit,
    type,
  });

  res.status(200).json({
    message: `Related listings (${type}) fetched successfully`,
    data: result.data,
  });
});
