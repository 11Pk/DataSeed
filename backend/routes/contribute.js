const express = require("express");
const authMiddleware = require("../middlewares/auth_middleware");
const {
    contribute,
    getMyTasks,
    getTask,
    getMyContributions,
    getDashboard,
} = require("../controllers/contribution_controller");
const {
    submitValidationHandler,
} = require("../controllers/validation_controller");

const router = express.Router();

router.post("/contribute", authMiddleware, contribute);
router.post("/validation", authMiddleware, submitValidationHandler);
router.get("/my-tasks", authMiddleware, getMyTasks);
router.get("/tasks/:taskId", authMiddleware, getTask);
router.get("/my-contributions", authMiddleware, getMyContributions);
router.get("/dashboard", authMiddleware, getDashboard);

module.exports = router;
