CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    creator_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    domain VARCHAR(100),

    target_rows INTEGER,

    purpose TEXT,

    visibility VARCHAR(20) NOT NULL DEFAULT 'public',

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_dataset_creator
        FOREIGN KEY (creator_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_visibility
        CHECK (visibility IN ('public', 'link_only', 'invite_only', 'private')),

    CONSTRAINT check_dataset_status
        CHECK (status IN ('draft', 'active', 'completed'))
);

CREATE TABLE dataset_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    data_type VARCHAR(50) NOT NULL,

    role VARCHAR(30) NOT NULL,

    required BOOLEAN NOT NULL DEFAULT TRUE,

    column_order INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_column_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE,

    CONSTRAINT check_column_type
        CHECK (
            data_type IN (
                'text',
                'number',
                'boolean',
                'category',
                'image',
                'audio',
                'video',
                'json'
            )
        ),

    CONSTRAINT check_column_role
        CHECK (
            role IN (
                'input',
                'label'
            )
        ),

    CONSTRAINT unique_dataset_column_name
        UNIQUE (dataset_id, name),

    CONSTRAINT unique_dataset_column_order
        UNIQUE (dataset_id, column_order)
);