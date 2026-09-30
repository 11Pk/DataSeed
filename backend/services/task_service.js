const pool = require("../config/db");

const createTask = async ({
    datasetId,
    taskType,
    title,
    description,
    targetCount,
}) => {
    const result = await pool.query(
        `
        INSERT INTO tasks (
            dataset_id,
            task_type,
            title,
            description,
            target_count
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
            datasetId,
            taskType,
            title,
            description,
            targetCount,
        ]
    );

    return result.rows[0];
};

module.exports = {
    createTask,
};