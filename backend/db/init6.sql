ALTER TABLE dataset_columns
ADD COLUMN IF NOT EXISTS categories TEXT;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS validation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    submission_id UUID NOT NULL
        REFERENCES submissions(id)
        ON DELETE CASCADE,

    validator_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    decision VARCHAR(10) NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_validation_decision
        CHECK (decision IN ('yes', 'no')),

    CONSTRAINT unique_submission_validator
        UNIQUE (submission_id, validator_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_task_assignment
ON task_assignments (task_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_human_task_submission
ON submissions (task_id, user_id)
WHERE task_id IS NOT NULL
    AND user_id IS NOT NULL
    AND source = 'human';
