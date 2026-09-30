const pool = require("../config/db");

const {createDatasetRecord,} = require("../services/dataset_service");
const { createDatasetSchema,} = require("../services/schema_service");
const { createMongoCollection,} = require("../services/mongo_service");
const {generateDatasetData,} = require("../controllers/dataset_generation_controller");
const {initializeValidation,}=require("../controllers/validation_controller");



const createDataset = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.userId;

        const {
            dataset,
            columns,
            generation,
            humanPrompts,
            validation,
        } = req.body;


        if (
            !dataset ||
            !columns ||
            !generation
        ) {
            return res.status(400).json({
                message:
                    "Incomplete dataset configuration",
            });
        }


        await client.query("BEGIN");


        // STEP 1
        const createdDataset =
            await createDatasetRecord(
                client,
                userId,
                dataset
            );


        // STEP 2
        const schema =
            await createDatasetSchema(
                client,
                createdDataset.id,
                columns
            );


        // STEP 3
      const generationResult =
            await generateDatasetData({
                datasetId:
                    createdDataset.id,

                columns,

                generation,

                humanPrompts,
            });


        // STEP 4
    const validationConfig =
    await initializeValidation({
        datasetId: createdDataset.id,
        validation,
    });

        await client.query("COMMIT");


        // STEP 5
        const mongoCollection =
            await createMongoCollection(
                createdDataset
            );


        return res.status(201).json({
            message:
                "Dataset created successfully",

            dataset: createdDataset,

            schema,

            generationTasks,

            validationWorkflow,

            mongoCollection,
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Dataset creation failed:",
            error
        );

        return res.status(500).json({
            message:
                "Failed to create dataset",
        });

    } finally {
        client.release();
    }
};


module.exports = {
    createDataset,
};