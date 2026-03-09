import { Router } from "express";
import { deleteUser, forgotPassword, getAllUsers, getCurrentUser, getUserById, loginUser, logoutUser, registerUser, resendVerification, resetPassword, updateUser, updateUserPassword, uploadProfilePic, verifyEmail } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";
import uploadMiddleware from "../middleware/upload.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(authMiddleware, logoutUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/reset-password').post(resetPassword);
router.route('/verify-email').post(verifyEmail);
router.route('/resend-verification').post(resendVerification);
router.route('/').get(authMiddleware, getAllUsers);
router.route('/:id/profile').get(authMiddleware, getCurrentUser);
router.route('/:id').get(authMiddleware, getUserById);
router.route('/:id/profile').patch(authMiddleware, updateUser);
router.route('/:id/profile/password').patch(authMiddleware, updateUserPassword);
router.route('/:id/profile').delete(authMiddleware, deleteUser);
router.route('/upload-profile').post(authMiddleware, uploadMiddleware.single("image"), uploadProfilePic)

export default router;
