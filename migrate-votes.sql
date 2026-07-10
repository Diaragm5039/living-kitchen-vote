-- Migration: 3 vote types → 2 (accept / dislike) + add dietary preferences table
-- Run this in Supabase SQL Editor BEFORE deploying the new code

-- 1. Clear old votes (they used like/dislike/no_idea which are no longer valid)
TRUNCATE votes RESTART IDENTITY;

-- 2. Drop old CHECK constraint and add new one
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;
ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check CHECK (vote_type IN ('accept', 'dislike'));

-- 3. Create dietary preferences table
CREATE TABLE IF NOT EXISTS user_dietary (
    user_name TEXT PRIMARY KEY,
    disliked_ingredients TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
