const express = require("express");

const { signup, login, getCurrentUser, logout } = require("../controllers/auth_controller");
const authMiddleware = require("../middlewares/auth_middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me",authMiddleware,getCurrentUser);
router.post("/logout", logout);

module.exports = router;