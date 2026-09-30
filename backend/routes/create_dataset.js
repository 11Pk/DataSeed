const express = require("express");

const router = express.Router();

const {createDataset} =require("../controllers/create_dataset_controller")

router.post("/create",createDataset);
module.exports = router;