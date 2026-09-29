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
                'label',
                'metadata'
            )
        ),

    CONSTRAINT unique_dataset_column_name
        UNIQUE (dataset_id, name)
);