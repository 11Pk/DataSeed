CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    creator_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    domain VARCHAR(100),

    purpose TEXT,

    target_rows INTEGER,

    visibility VARCHAR(20) NOT NULL DEFAULT 'public',

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dataset_creator
        FOREIGN KEY (creator_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_target_rows
        CHECK (target_rows IS NULL OR target_rows > 0),

    CONSTRAINT check_visibility
        CHECK (visibility IN ('public', 'link_only', 'invite_only', 'private')),

    CONSTRAINT check_dataset_status
        CHECK (status IN ('draft', 'active', 'completed', 'archived'))
);