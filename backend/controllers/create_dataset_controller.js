const { createDatasetRecord } = require("../services/dataset_service");
const { createDatasetSchema } = require("../services/schema_service");
const { createMongoCollection } = require("../services/mongo_service");
const { generateDatasetData } = require("./dataset_generation_controller");
const {
    initializeValidation,
    initializeSubmissionValidation,
} = require("./validation_controller");

const createDataset = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { dataset, columns, generation, humanPrompts, validation } =
            req.body;

        if (!dataset || !columns || !generation) {
            return res.status(400).json({
                message: "Incomplete dataset configuration",
            });
        }

        const createdDataset = await createDatasetRecord(userId, dataset);

        const schema = await createDatasetSchema(createdDataset.id, columns);

        const mongoCollection = await createMongoCollection(createdDataset);

        const generationResult = await generateDatasetData({
            datasetId: createdDataset.id,
            columns,
            generation,
            humanPrompts,
            creatorId: userId,
        });

        const validationConfig = await initializeValidation({
            datasetId: createdDataset.id,
            validation,
        });

        for (const submission of generationResult.aiSubmissions) {
            await initializeSubmissionValidation({ submission });
        }

        return res.status(201).json({
            message: "Dataset successfully created",
            dataset: createdDataset,
            schema,
            generation: generationResult,
            validationConfig,
            mongoCollection,
        });
    } catch (error) {
        console.error("Dataset creation failed:", error);
        return res.status(500).json({
            message: error.message || "Failed to create dataset",
        });
    }
};

module.exports = {
    createDataset,
};
