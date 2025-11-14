import * as favoriteService from "#services/favorite.service.js";
import { listingIdSchema } from "#src/validations/listing.validation.js";
import { catchAsync } from "#utils/catchAsync.js";
import { AppError } from "#src/utils/AppError.js";
import { formatValidationError } from "#src/utils/format.js";

export const addFavorite = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const IdValidation = listingIdSchema.safeParse({ id: req.params.listingId });
  console.log("Validation Result:", IdValidation);

  if (!IdValidation.success) {
    throw new AppError(
      `Invalid listing  ID`,
      400,
      formatValidationError(IdValidation.error)
    );
  }

  const { id: listingId } = IdValidation.data;

  const favorite = await favoriteService.addFavorite(userId, listingId);
  res
    .status(201)

    .json({
      message: "Listing added to favorites",
      data: favorite,
    });
});

export const removeFavorite = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { listingId } = req.params;
  const result = await favoriteService.removeFavorite(userId, listingId);
  res.status(200).json({
    status: "success",
    message: result.message,
  });
});

export const getUserFavorites = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const favorites = await favoriteService.getUserFavorites(userId);
  res.status(200).json({
    status: "success",
    length: favorites.length,
    data: favorites,
  });
});
