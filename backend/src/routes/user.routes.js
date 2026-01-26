import { Router } from "express";
import { deleteUser, getAllUsers, getCurrentUser, getUserById, loginUser, logoutUser, registerUser, updateUser, updateUserPassword } from "../controllers/user.controller.js";

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').post(logoutUser);

router.route('/').get(getAllUsers);
router.route('/:id/profile').get(getCurrentUser);
router.route('/:id').get(getUserById);
router.route('/:id/profile').patch(updateUser);
router.route(':id/profile/password').patch(updateUserPassword);
router.route('/:id/profile').delete(deleteUser);


export default router;
