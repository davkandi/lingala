ALTER TABLE "courses" ADD COLUMN "source_language" varchar(10) DEFAULT 'en' NOT NULL;
ALTER TABLE "modules" ADD COLUMN "source_language" varchar(10) DEFAULT 'en' NOT NULL;
ALTER TABLE "lessons" ADD COLUMN "source_language" varchar(10) DEFAULT 'en' NOT NULL;
ALTER TABLE "user" ADD COLUMN "preferred_language" varchar(10) DEFAULT 'en' NOT NULL;

UPDATE "modules"
SET "source_language" = c."source_language"
FROM "courses" c
WHERE "modules"."course_id" = c."id";

UPDATE "lessons"
SET "source_language" = m."source_language"
FROM "modules" m
WHERE "lessons"."module_id" = m."id";
