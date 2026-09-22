-- Backfill createdById for existing tasks
-- This sets createdById to the project owner for all existing tasks

UPDATE tasks 
SET "createdById" = projects."ownerId"
FROM projects 
WHERE tasks."projectId" = projects.id
AND tasks."createdById" IS NULL;

-- Verify the update
SELECT COUNT(*) as tasks_with_null_createdby FROM tasks WHERE "createdById" IS NULL;
-- Should return 0
