CREATE TABLE validation_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id UUID NOT NULL
        REFERENCES datasets(id)
        ON DELETE CASCADE,

    enabled BOOLEAN NOT NULL DEFAULT false,

    required_validators INTEGER NOT NULL DEFAULT 1,

    approval_percentage INTEGER NOT NULL DEFAULT 67,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(dataset_id)
);