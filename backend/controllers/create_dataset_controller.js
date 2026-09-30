const pool = require("../config/db");

const {createDatasetRecord,} = require("../services/dataset.service");
const { createDatasetSchema,} = require("../services/schema.service");
const { createMongoCollection,} = require("../services/mongo.service");
const { createGenerationWorkflow,} = require("../services/generation.service");
const {createValidationWorkflow,} = require("../services/validation.service");


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
        const generationTasks =
            await createGenerationWorkflow(
                client,
                createdDataset.id,
                generation,
                humanPrompts
            );


        // STEP 4
        const validationWorkflow =
            await createValidationWorkflow(
                client,
                createdDataset.id,
                validation
            );


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