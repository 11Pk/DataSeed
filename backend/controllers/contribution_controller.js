const pool = require("../config/db");
const {
  createSubmission,
  getSubmissionsByUser,
  getDashboardStats,
} = require("../services/submission_service");
const {
  getAssignedTaskForUser,
  getTasksForUser,
  markAssignmentStarted,
  markAssignmentCompleted,
} = require("../services/task_service");
const { getDatasetColumns } = require("../services/dataset_service");
const { initializeSubmissionValidation } = require("./validation_controller");

const parseCategories = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const contribute = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { taskId, data } = req.body;

    if (!taskId || !data || typeof data !== "object") {
      return res.status(400).json({
        message: "taskId and submitted data are required",
      });
    }

    const assignment = await getAssignedTaskForUser(taskId, userId);

    if (!assignment) {
      return res.status(403).json({
        message: "You are not assigned to this task",
      });
    }

    if (assignment.assignment_status === "completed") {
      return res.status(409).json({
        message: "This task has already been completed",
      });
    }

    if (assignment.task_type !== "human_generation") {
      return res.status(400).json({
        message: "This task is not a contribution task",
      });
    }

    const submission = await createSubmission({
      taskId,
      userId,
      datasetId: assignment.dataset_id,
      data,
      source: "human",
      status: "pending",
    });

    const validation = await initializeSubmissionValidation({
      submission,
    });
    await markAssignmentCompleted(taskId, userId);

    return res.status(201).json({
      message: "Contribution submitted",
      submission,
      validation,
    });
  } catch (error) {
    console.error("Contribute failed:", error);
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This task has already been submitted",
      });
    }
    return res.status(500).json({
      message: error.message || "Failed to submit contribution",
    });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await getTasksForUser(req.user.userId);
    return res.status(200).json({ tasks });
  } catch (error) {
    console.error("Get tasks failed:", error);
    return res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

const getTask = async (req, res) => {
  try {
    const assignment = await getAssignedTaskForUser(
      req.params.taskId,
      req.user.userId,
    );

    if (!assignment) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!assignment.started_at) {
      await markAssignmentStarted(assignment.assignment_id);
    }

    const columns = await getDatasetColumns(assignment.dataset_id);
    let submission = null;

    if (assignment.submission_id) {
      const result = await pool.query(
        `
                SELECT id, data, source, status
                FROM submissions
                WHERE id = $1
                `,
        [assignment.submission_id],
      );
      submission = result.rows[0] || null;
    }

    return res.status(200).json({
      task: assignment,
      columns: columns.map((column) => ({
        id: column.id,
        name: column.name,
        type: column.data_type,
        role: column.role,
        categories: parseCategories(column.categories),
      })),
      submission,
      labelled: columns.some((column) => column.role === "label"),
    });
  } catch (error) {
    console.error("Get task failed:", error);
    return res.status(500).json({ message: "Failed to load task" });
  }
};

const getMyContributions = async (req, res) => {
  try {
    const contributions = await getSubmissionsByUser(req.user.userId);
    return res.status(200).json({ contributions });
  } catch (error) {
    console.error("Get contributions failed:", error);
    return res.status(500).json({
      message: "Failed to fetch contributions",
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const stats = await getDashboardStats(req.user.userId);
    return res.status(200).json({ stats });
  } catch (error) {
    console.error("Dashboard stats failed:", error);
    return res.status(500).json({
      message: "Failed to fetch dashboard stats",
    });
  }
};

module.exports = {
  contribute,
  getMyTasks,
  getTask,
  getMyContributions,
  getDashboard,
};
