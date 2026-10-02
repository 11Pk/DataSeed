const pool = require("../config/db");

const createSubmission = async ({
    taskId = null,
    userId = null,
    datasetId,
    data,
    source,
    status = "pending",
}) => {
    const result = await pool.query(
        `
        INSERT INTO submissions (
            task_id,
            user_id,
            dataset_id,
            data,
            source,
            status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            taskId,
            userId,
            datasetId,
            JSON.stringify(data),
            source,
            status,
        ]
    );

    return result.rows[0];
};

const getSubmissionsByUser = async (userId) => {
    const result = await pool.query(
        `
        SELECT
            s.id,
            s.dataset_id,
            s.source,
            s.status,
            s.created_at,
            d.name AS dataset_name
        FROM submissions s
        JOIN datasets d ON d.id = s.dataset_id
        WHERE s.user_id = $1
        ORDER BY s.created_at DESC
        LIMIT 25
        `,
        [userId]
    );

    return result.rows;
};

const getDashboardStats = async (userId) => {
    const [contributions, today, tasks, datasets] = await Promise.all([
        pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM submissions
            WHERE user_id = $1
            `,
            [userId]
        ),
        pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM submissions
            WHERE user_id = $1
              AND created_at::date = CURRENT_DATE
            `,
            [userId]
        ),
        pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM task_assignments ta
            JOIN tasks t ON t.id = ta.task_id
            WHERE ta.user_id = $1
              AND ta.status <> 'completed'
              AND t.status = 'active'
            `,
            [userId]
        ),
        pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM datasets
            WHERE creator_id = $1
              AND status = 'active'
            `,
            [userId]
        ),
    ]);

    return {
        totalContributions: contributions.rows[0].total,
        contributionsToday: today.rows[0].total,
        myTasks: tasks.rows[0].total,
        activeDatasets: datasets.rows[0].total,
    };
};

module.exports = {
    createSubmission,
    getSubmissionsByUser,
    getDashboardStats,
};
