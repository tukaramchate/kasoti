-- Migration Script for Enhanced Search Features
-- Run this script to add difficulty and tags columns to the quiz table

-- Add difficulty column
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10);

-- Add tags column
ALTER TABLE quiz ADD COLUMN IF NOT EXISTS tags VARCHAR(500);

-- Optional: Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_quiz_difficulty ON quiz(difficulty);

-- Note: For PostgreSQL full-text search on tags, uncomment below:
-- CREATE INDEX IF NOT EXISTS idx_quiz_tags ON quiz USING gin(to_tsvector('english', tags));

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'quiz' 
AND column_name IN ('difficulty', 'tags');
