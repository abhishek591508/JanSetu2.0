const cloudinary = require("cloudinary").v2;


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//THIS FUNCTION UPLOADS THE IMAGE TO CLOUDINARY WITH THE FOLDER NAME "jansetu/posts" AND RESOURCE TYPE "IMAGE"
function uploadPostImage(buffer) {
  return new Promise((resolve, reject) => {//this is callBack, not a promise, so we convert it to promise first.
        console.log("Reached 11");
        console.log("api key : ", process.env.CLOUDINARY_API_KEY);
    const stream = cloudinary.uploader.upload_stream(//stream is used to upload the image to cloudinary, as we are not first saving it as a file in the server
      { 
        folder: "jansetu/posts", 
        resource_type: "image" 
      },
      (error, result) => {
        console.log("Reached 12");
        if (error || !result) {
          reject(error || new Error("Image upload failed"));
          return;
        }
        console.log("Reached 13");
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);//
  });
}

module.exports = { cloudinary, uploadPostImage };