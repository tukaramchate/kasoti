-- Fix User ID Auto-Generation for PostgreSQL
-- Run this script in your PostgreSQL database to fix the ID generation issue

-- Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS user_id_seq START WITH 1 INCREMENT BY 1;

-- Get the max ID from existing data and set the sequence
SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 0) + 1, false);

-- Alter the user table to use the sequence for the id column
ALTER TABLE "user" ALTER COLUMN id SET DEFAULT nextval('user_id_seq');

-- Make sure id is NOT NULL
ALTER TABLE "user" ALTER COLUMN id SET NOT NULL;

-- Same for quiz table if needed
CREATE SEQUENCE IF NOT EXISTS quiz_id_seq START WITH 1 INCREMENT BY 1;
SELECT setval('quiz_id_seq', COALESCE((SELECT MAX(id) FROM quiz), 0) + 1, false);
ALTER TABLE quiz ALTER COLUMN id SET DEFAULT nextval('quiz_id_seq');

-- Same for question table if needed  
CREATE SEQUENCE IF NOT EXISTS question_id_seq START WITH 1 INCREMENT BY 1;
SELECT setval('question_id_seq', COALESCE((SELECT MAX(id) FROM question), 0) + 1, false);
ALTER TABLE question ALTER COLUMN id SET DEFAULT nextval('question_id_seq');

-- Same for quiz_attempt table (new table)
CREATE SEQUENCE IF NOT EXISTS quiz_attempt_id_seq START WITH 1 INCREMENT BY 1;
