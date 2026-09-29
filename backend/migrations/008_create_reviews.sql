CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contribution_id UUID NOT NULL,

    reviewer_id UUID NOT NULL,

    decision VARCHAR(30) NOT NULL,

    comment TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_contribution
        FOREIGN KEY (contribution_id)
        REFERENCES contributions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_review_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT check_review_decision
        CHECK (
            decision IN (
                'approve',
                'reject',
                'needs_review'
            )
        )
);