CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id UUID NOT NULL,

    task_type VARCHAR(50) NOT NULL,

    prompt TEXT NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE,

    CONSTRAINT check_task_type
        CHECK (
            task_type IN (
                'generation',
                'classification',
                'verification',
                'ranking',
                'conversation'
            )
        ),

    CONSTRAINT check_task_status
        CHECK (
            status IN (
                'active',
                'paused',
                'completed',
                'archived'
            )
        )
);