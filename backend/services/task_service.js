const pool = require("../config/db");

const createTask = async ({
    datasetId,
    taskType,
    title,
    description,
    targetCount,
    submissionId = null,
}) => {
    const result = await pool.query(
        `
        INSERT INTO tasks (
            dataset_id,
            submission_id,
            task_type,
            title,
            description,
            target_count
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            datasetId,
            submissionId,
            taskType,
            title,
            description,
            targetCount,
        ]
    );

    return result.rows[0];
};

const getTaskById = async (taskId) => {
    const result = await pool.query(
        `
        SELECT *
        FROM tasks
        WHERE id = $1
        `,
        [taskId]
    );

    return result.rows[0] || null;
};

const getAssignedTaskForUser = async (taskId, userId) => {
    const result = await pool.query(
        `
        SELECT
            t.*,
            d.name AS dataset_name,
            d.description AS dataset_description,
            ta.id AS assignment_id,
            ta.status AS assignment_status,
            ta.started_at
        FROM task_assignments ta
        JOIN tasks t ON t.id = ta.task_id
        JOIN datasets d ON d.id = t.dataset_id
        WHERE ta.task_id = $1
          AND ta.user_id = $2
        `,
        [taskId, userId]
    );

    return result.rows[0] || null;
};

const getTasksForUser = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            t.id,
            t.dataset_id,
            t.task_type,
            t.title,
            t.description,
            t.target_count,
            t.status,
            t.submission_id,
            d.name AS dataset_name,
            ta.status AS assignment_status,
            ta.assigned_at,
            ta.started_at
        FROM task_assignments ta
        JOIN tasks t ON t.id = ta.task_id
        JOIN datasets d ON d.id = t.dataset_id
        WHERE ta.user_id = $1
          AND t.status = 'active'
          AND ta.status <> 'completed'
        ORDER BY ta.assigned_at DESC
        `,
        [userId]
    );

    return result.rows;
};

const markAssignmentStarted = async (assignmentId) => {
    await pool.query(
        `
        UPDATE task_assignments
        SET
            status = 'started',
            started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
        WHERE id = $1
        `,
        [assignmentId]
    );
};

const markAssignmentCompleted = async (taskId, userId) => {
    await pool.query(
        `
        UPDATE task_assignments
        SET
            status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE task_id = $1
          AND user_id = $2
        `,
        [taskId, userId]
    );
};

module.exports = {
    createTask,
    getTaskById,
    getAssignedTaskForUser,
    getTasksForUser,
    markAssignmentStarted,
    markAssignmentCompleted,
};
