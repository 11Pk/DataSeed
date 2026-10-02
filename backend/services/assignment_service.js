const pool = require("../config/db");

const getRandomUsers = async (count, excludeUserId) => {
    const result = await pool.query(
        `
        SELECT id
        FROM users
        WHERE ($2::uuid IS NULL OR id <> $2)
        ORDER BY RANDOM()
        LIMIT $1
        `,
        [count, excludeUserId || null]
    );

    return result.rows;
};

const assignTaskToUsers = async ({
    taskId,
    userCount,
    excludeUserId = null,
}) => {
    let users = await getRandomUsers(userCount, excludeUserId);

    if (users.length === 0 && excludeUserId) {
        users = [{ id: excludeUserId }];
    }

    const assignments = [];

    for (const user of users) {
        const result = await pool.query(
            `
            INSERT INTO task_assignments (
                task_id,
                user_id
            )
            VALUES ($1, $2)
            ON CONFLICT (task_id, user_id) DO NOTHING
            RETURNING *
            `,
            [taskId, user.id]
        );

        if (result.rows[0]) {
            assignments.push(result.rows[0]);
        }
    }

    return assignments;
};

module.exports = {
    assignTaskToUsers,
};
