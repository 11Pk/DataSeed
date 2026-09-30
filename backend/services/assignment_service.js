const pool = require("../config/db");

const getRandomUsers = async (count) => {
    const result = await pool.query(
        `
        SELECT id
        FROM users
        ORDER BY RANDOM()
        LIMIT $1
        `,
        [count]
    );

    return result.rows;
};


const assignTaskToUsers = async ({
    taskId,
    userCount,
}) => {

    const users = await getRandomUsers(
        userCount
    );

    if (users.length < userCount) {
        throw new Error(
            "Not enough users available"
        );
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
            RETURNING *
            `,
            [
                taskId,
                user.id,
            ]
        );

        assignments.push(
            result.rows[0]
        );
    }

    return assignments;
};


module.exports = {
    assignTaskToUsers,
};
