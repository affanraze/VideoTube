import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const delVideo = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });
    // file has been uploaded successfully
    console.log("Delete video", response);
    return response;
  } catch (error) {
    throw new ApiError(500, error?.message || "image deletion failed");
  }
};

export { delVideo };
