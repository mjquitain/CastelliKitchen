import { v4 as uuidv4 } from "uuid";
import { bucket } from "../config/firebase.js";

/**
 * Upload a file to Firebase Storage
 * @param {Object} file - Multer file object
 * @param {string} folder - Folder path in storage (e.g., 'recipes', 'profiles')
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadFileToStorage = async (file, folder = 'recipes') => {
    try {
        const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const stream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
            },
        });

        return new Promise((resolve, reject) => {
            stream.on('error', (error) => {
                reject(error);
            });

            stream.on('finish', async () => {
                await fileUpload.makePublic();

                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
                resolve(publicUrl);
            });

            stream.end(file.buffer);
        });
    } catch (error) {
        throw new Error(`File upload failed: ${error.message}`);
    }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} fileUrl - Public URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFileFromStorage = async (fileUrl) => {
    try {
        const baseUrl = `https://storage.googleapis.com/${bucket.name}/`;
        if (!fileUrl.startsWith(baseUrl)) {
            throw new Error('Invalid file URL');
        }

        const filePath = fileUrl.replace(baseUrl, '');
        const file = bucket.file(filePath);

        await file.delete();
    } catch (error) {
        console.error('Error deleting file:', error);
        throw new Error(`File deletion failed: ${error.message}`);
    }
};

/**
 * Validate file type for images
 * @param {Object} file - Multer file object
 * @returns {boolean}
 */
export const isValidImageFile = (file) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedMimeTypes.includes(file.mimetype);
};
