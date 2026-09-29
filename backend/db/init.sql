
-- Create database
CREATE DATABASE dataseeds;

-- After creating the database, connect to it
-- In pgAdmin, select the dataseeds database
-- and run the remaining commands.

-- USERS

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    reputation INTEGER DEFAULT 0,

    points INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DATASETS


CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    creator_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    domain VARCHAR(100),

    target_rows INTEGER,

    visibility VARCHAR(20) DEFAULT 'public',

    status VARCHAR(30) DEFAULT 'draft',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (creator_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- DATASET COLUMNS / SCHEMA


CREATE TABLE dataset_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    data_type VARCHAR(50) NOT NULL,

    role VARCHAR(30) NOT NULL,

    required BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE
);


-- TASKS


CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    dataset_id UUID NOT NULL,

    task_type VARCHAR(50) NOT NULL,

    prompt TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE
);

-- CONTRIBUTIONS


CREATE TABLE contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    task_id UUID NOT NULL,

    user_id UUID NOT NULL,

    status VARCHAR(30) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- REVIEWS


CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contribution_id UUID NOT NULL,

    reviewer_id UUID NOT NULL,

    decision VARCHAR(30) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contribution_id)
        REFERENCES contributions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);