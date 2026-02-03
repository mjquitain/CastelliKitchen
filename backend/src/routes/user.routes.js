import { Router } from "express";
import { deleteUser, getAllUsers, getCurrentUser, getUserById, loginUser, logoutUser, registerUser, updateUser, updateUserPassword } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(authMiddleware, logoutUser);

router.route('/').get(authMiddleware, getAllUsers);
router.route('/:id/profile').get(authMiddleware, getCurrentUser);
router.route('/:id').get(authMiddleware, getUserById);
router.route('/:id/profile').patch(authMiddleware, updateUser);
router.route('/:id/profile/password').patch(authMiddleware, updateUserPassword);
router.route('/:id/profile').delete(authMiddleware, deleteUser);


export default router;
