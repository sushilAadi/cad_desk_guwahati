# courses_v2

Original-wording version of the course catalogue. The old `courses` table is never modified, and the site falls
back to it if `courses_v2` is missing, empty or fails (`COURSES_SOURCE=legacy` forces the old table).

1. Run `01_schema.sql` in the Supabase SQL editor.
2. `node supabase/courses_v2/load.cjs` loads the 66 rows and verifies them (`--check` only verifies).

## What changed in the text
- Every caption, description and module list is newly written; all topics from the old syllabi are still covered.
- Dropped on purpose: "Introduction to CAD DESK" lines, marketing promises (lifetime access, student dashboard,
  centres across India), the per-course student count (6689 on every course), and Google+ topics (service closed).
- Course titles are unchanged so existing URLs keep working (typos you may want to fix later: "Sketch up",
  "Solidworks", "Tekla Structure", "Data Structures & Algorithm").

## Please verify against what is actually taught
- **Rhinoceros**: the old record had no syllabus at all, so its modules follow the standard beginner syllabus (`needs_review = true`).
- Gaps in the old data, now simply absent: 3DS Max (module 4), Revit Architecture (modules 4 and 5), SketchUp (module 6),
  ArtCAM ("Modifying 3D Model" and "Post-Processing Tool Paths" had no topics). Add the real topics if you teach them.
- STAAD Pro modules 4 to 12 had titles but no topics; they appear as titled modules with one line each.
- Core Java and PHP "Project" modules had no topics; they appear as "Project work".
