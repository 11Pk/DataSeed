const express = require("express");
const authMiddleware = require("../middlewares/auth_middleware");
const { createDataset } = require("../controllers/create_dataset_controller");
const {
    getMyDatasets,
    getDataset,
    downloadDataset,
} = require("../controllers/datasets_controller");

const router = express.Router();

router.post("/create_dataset", authMiddleware, createDataset);
router.get("/my-datasets", authMiddleware, getMyDatasets);
router.get("/datasets/:datasetId/download", authMiddleware, downloadDataset);
router.get("/datasets/:datasetId", authMiddleware, getDataset);

module.exports = router;
