import multer from "multer";

const storage = multer.memoryStorage();

const uploadMiddleware = multer({
  storage,
  // limit file size to 5mb
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default uploadMiddleware;