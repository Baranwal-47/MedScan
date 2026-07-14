const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () =>
  process.env.CLOUDINARY_API_KEY &&
  !process.env.CLOUDINARY_API_KEY.startsWith('your_');

// Upload an in-memory buffer (from multer memoryStorage) to Cloudinary.
// ponytail: without real Cloudinary keys, falls back to a data URI so the
// feature is testable in dev; swap in real keys for production.
const uploadBuffer = (buffer, folder, mimetype = 'image/png') => {
  if (!isConfigured()) {
    return Promise.resolve({
      secure_url: `data:${mimetype};base64,${buffer.toString('base64')}`,
      public_id: null,
    });
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
};

module.exports = { cloudinary, uploadBuffer };
