const express = require("express");

const {
    login,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, getMe);
router.post("/change-password", authenticate, changePassword);

module.exports = router;
