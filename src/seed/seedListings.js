import { db } from "#config/database.js";
import { listings } from "#models/listing.model.js";
import { listingImages } from "#models/listing_image.model.js";
import cloudinary from "#config/cloudinary.js"; // your configured cloudinary instance
import sampleListings from "#seed/sampleListings.js"; // path to your sample data
import logger from "#config/logger.js";

async function seedListings() {
  try {
    for (const listing of sampleListings) {
      const {
        title,
        description,
        price,
        categoryId,
        sellerId,
        campusId,
        condition,
        images,
      } = listing;

      // 1️⃣ Insert the listing first
      const [newListing] = await db
        .insert(listings)
        .values({
          title,
          description,
          price,
          categoryId,
          sellerId,
          campusId,
          condition,
        })
        .returning();

      if (!newListing) {
        logger.error(`Failed to create listing: ${title}`);
        continue;
      }

      // 2️⃣ Upload images to Cloudinary if not already hosted
      const imageRecords = [];
      for (const img of images) {
        let uploadedImage = img;

        // If your sample URLs are local paths, upload them
        if (!img.url.startsWith("http")) {
          const result = await cloudinary.uploader.upload(img.url, {
            folder: "listings",
          });
          uploadedImage = {
            url: result.secure_url,
            publicId: result.public_id,
          };
        }

        imageRecords.push({
          listingId: newListing.id,
          url: uploadedImage.url,
          publicId: uploadedImage.publicId,
        });
      }

      // 3️⃣ Insert listing images
      await db.insert(listingImages).values(imageRecords);

      logger.info(
        `✅ Created listing: ${newListing.title} with ${images.length} images`
      );
    }

    logger.info("All sample listings seeded successfully!");
    process.exit(0);
  } catch (error) {
    logger.error("❌ Error seeding listings:", error);
    process.exit(1);
  }
}

seedListings();
