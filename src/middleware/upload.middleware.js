import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "#config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campus_deals/listings",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { width: 1000, height: 1000, crop: "limit", quality: "auto:low" },
    ],
  },
});

export const upload = multer({
  storage,
  limits: { files: 5 }, // max 5 images
});
