const pool = require("../config/db");
const { assignTaskToUsers } = require("../services/assignment_service");
const { createTask, markAssignmentCompleted } = require("../services/task_service");
const { pushApprovedSubmissionToMongo } = require("../services/mongo_service");

const initializeValidation = async ({ datasetId, validation }) => {
    const enabled = validation?.enabled === true;

    const result = await pool.query(
        `
        INSERT INTO validation_configs (
            dataset_id,
            enabled,
            required_validators,
            approval_percentage
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
            datasetId,
            enabled,
            validation?.requiredValidators ?? 1,
            validation?.approvalPercentage ?? 67,
        ]
    );

    return result.rows[0];
};

const createValidationTask = async ({ submission }) => {
    const result = await createTask({
        datasetId: submission.dataset_id,
        submissionId: submission.id,
        taskType: "validation",
        title: "Validate Dataset Submission",
        description: "Check whether this submission is valid.",
        targetCount: 1,
    });

    return result;
};

const initializeSubmissionValidation = async ({ submission }) => {
    const result = await pool.query(
        `
        SELECT *
        FROM validation_configs
        WHERE dataset_id = $1
        `,
        [submission.dataset_id]
    );

    const config = result.rows[0];

    if (!config || !config.enabled) {
        await pool.query(
            `
            UPDATE submissions
            SET
                status = 'approved',
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [submission.id]
        );

        await pushApprovedSubmissionToMongo({
            ...submission,
            status: "approved",
        });

        return {
            validationRequired: false,
            status: "approved",
        };
    }

    const validationTask = await createValidationTask({ submission });

    const assignments = await assignTaskToUsers({
        taskId: validationTask.id,
        userCount: config.required_validators,
        excludeUserId: submission.user_id,
    });

    return {
        validationRequired: true,
        task: validationTask,
        assignments,
    };
};

const submitValidation = async ({
    submissionId,
    validatorId,
    decision,
    feedback = null,
    taskId = null,
}) => {
    const normalizedDecision = String(decision).toLowerCase();

    if (!["yes", "no"].includes(normalizedDecision)) {
        throw new Error("Decision must be either yes or no");
    }

    const assignmentResult = await pool.query(
        `
        SELECT ta.id, t.id AS task_id
        FROM task_assignments ta
        JOIN tasks t ON ta.task_id = t.id
        WHERE t.submission_id = $1
          AND t.task_type = 'validation'
          AND ta.user_id = $2
          AND ($3::uuid IS NULL OR t.id = $3)
        `,
        [submissionId, validatorId, taskId]
    );

    if (assignmentResult.rows.length === 0) {
        throw new Error("You are not assigned to validate this submission");
    }

    let review;
    try {
        const result = await pool.query(
            `
            INSERT INTO validation_reviews (
                submission_id,
                validator_id,
                decision,
                feedback
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [submissionId, validatorId, normalizedDecision, feedback]
        );
        review = result.rows[0];
    } catch (error) {
        if (error.code === "23505") {
            throw new Error("You have already reviewed this submission");
        }
        throw error;
    }

    await markAssignmentCompleted(
        assignmentResult.rows[0].task_id,
        validatorId
    );

    const validationResult = await verifyValidationThreshold({
        submissionId,
    });

    return {
        review,
        validation: validationResult,
    };
};

const verifyValidationThreshold = async ({ submissionId }) => {
    const submissionResult = await pool.query(
        `
        SELECT *
        FROM submissions
        WHERE id = $1
        `,
        [submissionId]
    );

    if (submissionResult.rows.length === 0) {
        throw new Error("Submission not found");
    }

    const submission = submissionResult.rows[0];

    if (submission.status !== "pending") {
        return {
            status: submission.status,
            alreadyDecided: true,
        };
    }

    const configResult = await pool.query(
        `
        SELECT *
        FROM validation_configs
        WHERE dataset_id = $1
        `,
        [submission.dataset_id]
    );

    if (configResult.rows.length === 0) {
        throw new Error("Validation configuration not found");
    }

    const config = configResult.rows[0];

    const reviewsResult = await pool.query(
        `
        SELECT decision
        FROM validation_reviews
        WHERE submission_id = $1
        `,
        [submissionId]
    );

    const reviews = reviewsResult.rows;

    if (reviews.length < config.required_validators) {
        return {
            status: "pending",
            reviewsCompleted: reviews.length,
            requiredValidators: config.required_validators,
        };
    }

    const yesVotes = reviews.filter((review) => review.decision === "yes").length;
    const approvalPercentage = (yesVotes / reviews.length) * 100;

    if (approvalPercentage >= config.approval_percentage) {
        await pool.query(
            `
            UPDATE submissions
            SET
                status = 'approved',
                reviewed_at = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [submissionId]
        );

        await pushApprovedSubmissionToMongo({
            ...submission,
            status: "approved",
        });

        return {
            status: "approved",
            approvalPercentage,
            reviewsCompleted: reviews.length,
        };
    }

    await pool.query(
        `
        UPDATE submissions
        SET
            status = 'rejected',
            reviewed_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [submissionId]
    );

    return {
        status: "rejected",
        approvalPercentage,
        reviewsCompleted: reviews.length,
    };
};

const submitValidationHandler = async (req, res) => {
    try {
        const { taskId, decision, feedback } = req.body;

        if (!taskId || !decision) {
            return res.status(400).json({
                message: "taskId and decision are required",
            });
        }

        const taskResult = await pool.query(
            `
            SELECT *
            FROM tasks
            WHERE id = $1
              AND task_type = 'validation'
            `,
            [taskId]
        );

        const task = taskResult.rows[0];

        if (!task || !task.submission_id) {
            return res.status(404).json({
                message: "Validation task not found",
            });
        }

        const result = await submitValidation({
            submissionId: task.submission_id,
            validatorId: req.user.userId,
            decision,
            feedback,
            taskId,
        });

        return res.status(200).json({
            message: "Validation submitted",
            ...result,
        });
    } catch (error) {
        console.error("Validation submit failed:", error);
        return res.status(400).json({
            message: error.message || "Failed to submit validation",
        });
    }
};

module.exports = {
    initializeValidation,
    createValidationTask,
    initializeSubmissionValidation,
    submitValidation,
    verifyValidationThreshold,
    submitValidationHandler,
};
