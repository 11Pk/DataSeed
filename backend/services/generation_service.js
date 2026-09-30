const pool = require("../config/db");

const createGenerationWorkflow = async (
    datasetId,
    generation,
    humanPrompts
) => {
    const workflows = [];

    if (generation.humanRows > 0) {
        const result = await pool.query(
            `
            INSERT INTO tasks (
                dataset_id,
                task_type,
                title,
                description,
                target_count,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING *
            `,
            [
                datasetId,
                "human_generation",
                "Generate dataset row",
                "Contributor generates a dataset row based on the configured prompts.",
                generation.humanRows,
                "active",
            ]
        );

        workflows.push(result.rows[0]);
    }

    if (generation.aiRows > 0) {
        const result = await pool.query(
            `
            INSERT INTO tasks (
                dataset_id,
                task_type,
                title,
                description,
                target_count,
                status
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING *
            `,
            [
                datasetId,
                "ai_generation",
                "AI generate dataset rows",
                generation.aiPrompt,
                generation.aiRows,
                "active",
            ]
        );

        workflows.push(result.rows[0]);
    }

    return workflows;
};

module.exports = {
    createGenerationWorkflow,
};