# Software Requirement Specification (SRS)
## Assessment & Examination Feature

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Feature:** Assessment & Examination - Quiz Management System  
**Status:** In Development

---

## Table of Contents
1. [Feature Overview](#31-feature-overview)
2. [Function Specifications](#32-function-specifications)
3. [Screen Functions](#33-screen-functions)
4. [Data Models & Enums](#34-data-models--enums)
5. [Validation Rules Matrix](#35-validation-rules-matrix)
6. [Business Rules Matrix](#36-business-rules-matrix)
7. [Business Rules Categorization](#37-business-rules-categorization)

---

## §3.1 Feature Overview

**Feature Name:** Assessment & Examination (Quản lý Bài Thi & Kiểm Tra)

**Description:**
The Assessment & Examination feature enables administrators and trainers to create, manage, and conduct online quizzes/tests. It supports:
- Creating and managing quizzes with multiple question types (single-choice, multiple-choice)
- Time-limited quiz attempts
- Automatic grading based on configurable passing scores
- Multiple attempt management with attempt counting
- Real-time answer saving during quiz sessions
- Detailed result tracking and performance analytics

**Scope:**
- Quiz CRUD management (Create, Read, Update, Delete)
- Quiz question association and bulk question assignment
- Quiz attempt lifecycle (start, save answers, submit)
- Result calculation and performance reporting
- Time limit enforcement for quiz sessions

**Related Features:**
- Question Bank - Stores all question items
- Courses - Quizzes are organized by courses
- Curriculum Items - Quizzes are linked to curriculum items for delivery
- User Management - User identification for attempt tracking

---

## §3.2 Function Specifications

### §3.2.1 Get All Quizzes

**Function Trigger:**
- Navigation: Dashboard → Courses → Quizzes section
- Manual page navigation to `/quizzes`
- Auto-triggered on quiz list page load
- Filter/search interactions on quiz list

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Trainer, Manager, Admin |
| **Purpose** | Retrieve paginated list of quizzes with search & filter capabilities |
| **Interface** | Quiz list page with pagination controls, search field, course filter dropdown |
| **Preconditions** | User must be authenticated with VIEW_QUIZ permission |
| **Postconditions** | Filtered quiz list displayed with metadata (title, description, question count, status) |

**Function Details:**

**Actors & Purpose:**
- Trainer views quizzes they created for their courses
- Manager oversees quizzes across multiple courses
- Admin manages all quizzes in the system

**Purpose:** 
Display quiz inventory with efficient browsing through pagination and search to quickly find specific quizzes for management or reference.

**Interface Components:**
- Quiz list table with columns: ID, Title, Course, Questions, Time Limit, Passing Score, Max Attempts, Status, Actions
- Pagination controls (page size: 10, 25, 50, 100)
- Search input field for quiz title search
- Course filter dropdown
- Action buttons: View Details, Edit, Delete, Manage Questions

**Data Processing:**
1. Extract parameters from request: `page` (default: 1), `limit` (default: 100), `query` (search text), `course_id` (optional filter)
2. Calculate `offset = (page - 1) * limit`
3. Execute two queries:
   - Main query: SELECT quizzes ordered by created_at DESC with LIMIT/OFFSET
   - Count query: Count total matching quizzes for pagination
4. Map quiz_questions count for each quiz
5. Return paginated result with total count

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-01, VR-02, VR-03)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-01, BR-02, BR-03, BR-04, BR-05, BR-06)

**Database Operations:**

```sql
-- Main Query (with filters)
SELECT 
  q.id, q.course_id, q.title, q.description,
  q.time_limit_minutes, q.passing_score, q.max_attempts,
  q.available_from, q.available_until, q.created_at, q.updated_at,
  (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
FROM quizzes q
WHERE q.is_deleted = false
  AND (course_id = $course_id OR $course_id IS NULL)
  AND (title ILIKE '%' || $query || '%' OR $query IS NULL)
ORDER BY q.created_at DESC
LIMIT $limit OFFSET $offset;

-- Count Query
SELECT COUNT(*) as total
FROM quizzes q
WHERE q.is_deleted = false
  AND (course_id = $course_id OR $course_id IS NULL)
  AND (title ILIKE '%' || $query || '%' OR $query IS NULL);
```

**Normal Case Flow:**
1. User navigates to quizzes list page
2. System checks authentication and VIEW_QUIZ permission
3. System loads first page (page=1, limit=100) with no filters
4. System executes queries and retrieves quiz list
5. System calculates pagination metadata
6. System displays quiz list with full metadata
7. User can search by title, filter by course, change page
8. Each interaction triggers new query with updated parameters

**Abnormal Case Flow:**
1. User lacks VIEW_QUIZ permission → Display "Access Denied" message
2. No quizzes match search criteria → Display "No quizzes found"
3. Database timeout → Display error message, allow retry
4. Invalid page number → Default to page 1
5. Search query with special characters → Escape and sanitize, allow search
6. Network error during fetch → Show offline message with auto-retry

**Response Payload:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "course_id": 5,
      "title": "Midterm Exam",
      "description": "Chapter 1-5 comprehensive exam",
      "time_limit_minutes": 90,
      "passing_score": 70,
      "max_attempts": 3,
      "available_from": "2026-03-10T00:00:00Z",
      "available_until": "2026-03-31T23:59:59Z",
      "created_at": "2026-03-01T10:30:00Z",
      "updated_at": "2026-03-01T10:30:00Z",
      "question_count": 50
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 100
}
```

---

### §3.2.2 Get Quiz By ID

**Function Trigger:**
- Click "View Details" button from quiz list
- Direct URL navigation to `/quizzes/{id}`
- Click on quiz title in related components (courses, curriculum items)
- Page load with quiz ID parameter

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Trainer, Manager, Admin |
| **Purpose** | Retrieve complete quiz details including metadata and associated questions |
| **Interface** | Quiz detail page showing full quiz information and configuration |
| **Preconditions** | User authenticated; quiz ID must exist and not be deleted |
| **Postconditions** | Complete quiz with question list displayed |

**Function Details:**

**Actors & Purpose:**
- Trainer reviews quiz configuration before conducting or grading
- Admin verifies quiz settings and question associations
- System components fetch quiz config for linking to curriculum

**Purpose:**
Retrieve all quiz configuration details including associated questions to enable viewing, editing, or conducting quizzes.

**Interface Components:**
- Quiz metadata display: title, description, course, status
- Quiz configuration section: time_limit, passing_score, max_attempts, availability dates
- Associated questions list table with question text, type, options preview
- Action buttons: Edit Quiz, Manage Questions, Delete, Conduct Quiz

**Data Processing:**
1. Extract quiz ID from request parameter
2. Query quiz table for exact ID match where is_deleted = false
3. If found, build response with quiz data
4. If not found, return null

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-04, VR-05)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-07, BR-08, BR-09)

**Database Operations:**

```sql
SELECT * FROM quizzes
WHERE id = $id AND is_deleted = false;
```

**Normal Case Flow:**
1. User clicks "View Details" from quiz list or navigates to quiz URL
2. System checks authentication
3. System validates quiz ID exists and is not deleted
4. System retrieves quiz data from database
5. System loads associated questions
6. System displays complete quiz detail page
7. User can view metadata, questions, and take actions (edit, delete, conduct)

**Abnormal Case Flow:**
1. Quiz not found → Display "Quiz not found" error
2. Quiz is deleted → Display "Quiz no longer available"
3. User lacks permission → Display "Access Denied"
4. Database error → Show error message, allow navigation back
5. Invalid quiz ID format → Redirect to quiz list

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "course_id": 5,
    "title": "Midterm Exam",
    "description": "Chapter 1-5 comprehensive exam",
    "time_limit_minutes": 90,
    "passing_score": 70,
    "max_attempts": 3,
    "available_from": "2026-03-10T00:00:00Z",
    "available_until": "2026-03-31T23:59:59Z",
    "status": "published",
    "is_deleted": false,
    "created_at": "2026-03-01T10:30:00Z",
    "updated_at": "2026-03-01T10:30:00Z",
    "questions": [
      {
        "id": 101,
        "question_text": "What is X?",
        "type": "single_choice",
        "options": ["Option 1", "Option 2", "Option 3"]
      }
    ]
  }
}
```

---

### §3.2.3 Create Quiz

**Function Trigger:**
- Click "Create New Quiz" button from quiz list
- Click "Create Quiz" button in course detail page
- Navigation to `/quizzes/new` or `/courses/{id}/create-quiz`
- Form submission after filling quiz metadata

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Trainer, Manager, Admin |
| **Purpose** | Create new quiz with metadata and associate questions from question bank |
| **Interface** | Quiz creation form with title, description, settings, question selection |
| **Preconditions** | User authenticated with CREATE_QUIZ permission; course must exist |
| **Postconditions** | Quiz record created in database and linked to selected questions; user redirected to quiz detail |

**Function Details:**

**Actors & Purpose:**
- Trainer creates new quizzes for their courses
- Manager or Admin creates system-wide quizzes
- Purpose: Enable flexible quiz construction from existing question bank

**Purpose:**
Create new quiz assessments by capturing metadata, configuration, and linking questions to assess student knowledge.

**Interface Components:**
- Quiz Identity section: Title input, Description textarea, Course selector
- Quiz Configuration section:
  - Time Limit (minutes): Number input
  - Passing Score: Number slider/input
  - Max Attempts: Number input
  - Available From/Until: Date pickers
- Question Selection: Searchable question bank table with multi-select checkbox
- Form buttons: Create (submit), Cancel

**Data Processing:**
1. Extract FormData fields: course_id, title, description, status, time_limit_minutes, passing_score, max_attempts, timezone (if applicable)
2. Sanitize text fields (title, description) to prevent XSS
3. Validate all fields with Zod schema (length, type, range checks)
4. If validation fails, return errors per field
5. If validation passes:
   - Check course_id exists
   - Insert new quiz record
   - Link selected questions to quiz via quiz_questions junction table
   - Revalidate quiz list cache
   - Redirect to quiz detail page

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-06, VR-07, VR-08, VR-09, VR-10)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-10, BR-11, BR-12, BR-13, BR-14, BR-15, BR-16)

**Database Operations:**

```sql
-- Insert Quiz
INSERT INTO quizzes 
(course_id, title, description, status, time_limit_minutes, passing_score, max_attempts, created_at, updated_at)
VALUES ($course_id, $title, $description, $status, $time_limit_minutes, $passing_score, $max_attempts, NOW(), NOW())
RETURNING id;

-- Link Questions (bulk insert)
INSERT INTO quiz_questions (quiz_id, question_id, created_at)
VALUES 
  ($quiz_id, $question_id_1, NOW()),
  ($quiz_id, $question_id_2, NOW()),
  ...;
```

**Normal Case Flow:**
1. User navigates to create quiz form
2. System displays empty form with course selector
3. User selects course, enters title, description
4. User configures time limit, passing score, max attempts
5. User searches and selects questions from question bank
6. User clicks Create button
7. System validates all inputs
8. System checks course exists
9. System creates quiz record and links questions
10. System revalidates quiz list cache
11. System redirects to quiz detail showing "Quiz created successfully"

**Abnormal Case Flow:**
1. Required field missing → Display field-level error message
2. Title too long (>255 chars) → Show validation error
3. Passing score > 100 → Show validation error
4. Course doesn't exist → Show error "Course not found"
5. No questions selected → Show warning (optional, quiz can have 0 questions initially)
6. Database insert fails → Show error "Failed to create quiz", allow retry
7. User lacks CREATE_QUIZ permission → Show "Access Denied"
8. Navigation away mid-form → Warn "Unsaved changes will be lost"

**Form Validation Schema:**
```yaml
title:
  type: string
  required: true
  minLength: 1
  maxLength: 255
  error: "Title must be 1-255 characters"

description:
  type: string
  required: false
  maxLength: 1000
  error: "Description must be less than 1000 characters"

course_id:
  type: number
  required: true
  error: "Course is required"

time_limit_minutes:
  type: number
  required: false
  min: 1
  max: 480
  error: "Time limit must be 1-480 minutes"

passing_score:
  type: number
  required: true
  min: 0
  max: 100
  default: 70
  error: "Passing score must be 0-100"

max_attempts:
  type: number
  required: true
  min: 1
  max: 100
  default: 3
  error: "Max attempts must be 1-100"

question_ids:
  type: array[number]
  required: false
  error: "Invalid question IDs"
```

---

### §3.2.4 Update Quiz

**Function Trigger:**
- Click "Edit" button from quiz list or detail page
- Form submission from quiz edit page (`/quizzes/{id}/edit`)
- Select quiz and click "Edit Settings" from bulk actions

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Trainer (own quizzes), Manager, Admin |
| **Purpose** | Modify existing quiz metadata and configuration |
| **Interface** | Pre-filled quiz edit form with update button |
| **Preconditions** | Quiz must exist; user must have EDIT_QUIZ permission; quiz not locked |
| **Postconditions** | Quiz metadata updated in database; change logged |

**Function Details:**

**Actors & Purpose:**
- Trainer adjusts quiz configuration before or after conducting
- Admin updates quiz settings across multiple quizzes
- Purpose: Enable quiz metadata and configuration refinement

**Purpose:**
Allow modification of quiz settings including title, description, time limits, passing scores, and other configuration parameters while maintaining question associations.

**Interface Components:**
- Pre-populated quiz edit form with all fields from Create Quiz
- Display "Last Modified: [date] by [user]" info
- Update button to save changes
- Cancel button to discard changes
- Optional: Quick-apply settings to similar quizzes

**Data Processing:**
1. Extract quiz ID from request
2. Verify quiz exists and user has permission
3. Extract FormData fields: title, description, status, time_limit_minutes, passing_score, max_attempts
4. Sanitize and validate each changed field
5. Build dynamic UPDATE query with only changed fields
6. Execute update
7. Revalidate related path caches
8. Return success confirmation

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-11, VR-12, VR-13)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-17, BR-18, BR-19, BR-20, BR-21)

**Database Operations:**

```sql
UPDATE quizzes
SET 
  title = COALESCE($title, title),
  description = COALESCE($description, description),
  status = COALESCE($status, status),
  time_limit_minutes = COALESCE($time_limit_minutes, time_limit_minutes),
  passing_score = COALESCE($passing_score, passing_score),
  max_attempts = COALESCE($max_attempts, max_attempts),
  updated_at = NOW()
WHERE id = $id AND is_deleted = false
RETURNING id;
```

**Normal Case Flow:**
1. User clicks "Edit" on quiz
2. System loads quiz detail with current values
3. Form pre-fills with existing values
4. User modifies desired fields
5. User clicks "Update" button
6. System validates changed fields
7. System executes UPDATE query with only modified fields
8. System updates "updated_at" timestamp
9. System revalidates quiz list and detail caches
10. System shows "Quiz updated successfully" confirmation

**Abnormal Case Flow:**
1. User lacks EDIT_QUIZ permission → Show "Access Denied"
2. Quiz doesn't exist → Show "Quiz not found" error
3. Quiz is locked (attempts exist) → Show warning but allow limited edits
4. Validation fails → Show field-level error messages
5. Concurrent edit detected → Show conflict message, allow refresh
6. Database update fails → Show error, allow retry

---

### §3.2.5 Delete Quiz

**Function Trigger:**
- Click "Delete" button from quiz list or detail page
- Confirmation from quiz deletion dialog
- Bulk delete via checkbox selection with "Delete Selected" action

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Manager, Admin, Quiz Owner (Trainer) |
| **Purpose** | Perform soft-delete of quiz to hide from list without data loss |
| **Interface** | Confirmation dialog with "Delete" and "Cancel" buttons |
| **Preconditions** | Quiz exists; user has DELETE_QUIZ permission |
| **Postconditions** | Quiz marked as deleted (is_deleted = true); no user can start new attempts |

**Function Details:**

**Actors & Purpose:**
- Trainer deletes their own quizzes, only if no public attempts exist
- Manager deletes quizzes from multiple courses
- Admin can delete any quiz
- Purpose: Archive quizzes while preserving historical attempt data for grading

**Purpose:**
Safely remove quizzes from availability while maintaining historical records of student attempts and results.

**Interface Components:**
- Confirmation dialog: "Are you sure you want to delete this quiz? Students cannot begin new attempts, but existing attempts will be preserved for grading."
- Display quiz title in confirmation
- Delete button (destructive action styling)
- Cancel button

**Data Processing:**
1. Extract quiz ID
2. Verify quiz exists and user has permission
3. Check for active attempts (in_progress status) - warn if exist
4. Execute soft-delete: SET is_deleted = true, deleted_at = NOW()
5. Notify any active attempt owners about quiz deletion
6. Revalidate quiz list and detail caches
7. Redirect to quiz list with confirmation toast

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-14, VR-15)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-22, BR-23, BR-24, BR-25, BR-26)

**Database Operations:**

```sql
UPDATE quizzes
SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
WHERE id = $id
RETURNING id;

-- Optional: Notify active attempts
SELECT DISTINCT user_id
FROM quiz_attempts
WHERE quiz_id = $id AND status = 'in_progress';
```

**Normal Case Flow:**
1. User clicks "Delete" button on quiz
2. System displays confirmation dialog with quiz details
3. User confirms deletion
4. System checks for active attempts
5. System marks quiz as deleted (soft-delete)
6. System revalidates caches
7. System redirects to quiz list
8. System displays success toast: "Quiz deleted successfully"
9. Quiz no longer appears in quiz list
10. Existing attempts remain visible in attempt history for grading

**Abnormal Case Flow:**
1. User lacks DELETE_QUIZ permission → Show "Access Denied"
2. Quiz doesn't exist → Show "Quiz not found"
3. Active attempts exist → Show warning with count, allow proceed or cancel
4. User cancels deletion → Return to previous page without action
5. Database delete fails → Show error, allow retry

---

### §3.2.6 Get Quiz Questions

**Function Trigger:**
- Click "Manage Questions" from quiz detail
- Load question list on quiz edit page
- API call to populate question list during quiz conduct

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Trainer, Manager, Admin |
| **Purpose** | Retrieve all questions associated with a specific quiz |
| **Interface** | Question list table showing question details, display order |
| **Preconditions** | Quiz must exist; user must have VIEW_QUIZ permission |
| **Postconditions** | Question list retrieved with full details (text, type, options, correct answers) |

**Function Details:**

**Actors & Purpose:**
- Trainer reviews questions in their quiz
- Admin verifies question quality and correctness
- System components fetch questions for quiz display/conduction

**Purpose:**
Retrieve all questions linked to a quiz with complete details for review, editing, or quiz conduction.

**Interface Components:**
- Question list table with columns: Order, Question Text, Type, Options Count, Correct Answer
- Search/filter options by question type
- Reorder buttons (drag-drop or up/down arrows) for question sequence
- Add/Remove question buttons
- Question preview modal on row click

**Data Processing:**
1. Extract quiz ID
2. Query quiz_questions join with question_bank for all linked questions
3. Include question details: text, type, options, correct_answer
4. Order by question order/sequence in quiz
5. Return question array

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-16, VR-17)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-27, BR-28, BR-29)

**Database Operations:**

```sql
SELECT 
  qq.id as question_quiz_id,
  qq.question_id,
  qq.order,
  qb.question_text,
  qb.type,
  qb.options,
  qb.correct_answer,
  qb.explanation
FROM quiz_questions qq
JOIN question_bank qb ON qb.id = qq.question_id
WHERE qq.quiz_id = $quiz_id AND qb.is_deleted = false
ORDER BY qq.order ASC;
```

**Normal Case Flow:**
1. User clicks "Manage Questions" on quiz
2. System verifies user authentication and permission
3. System retrieves all quiz questions with details
4. System displays question list in display order
5. User can review, reorder, add, or remove questions

**Abnormal Case Flow:**
1. Quiz doesn't exist → Show "Quiz not found"
2. No questions linked → Show "No questions in this quiz" with option to add
3. Some linked questions are deleted → Show warning with count

---

### §3.2.7 Update Quiz Questions

**Function Trigger:**
- Submit "Manage Questions" form after adding/removing/reordering questions
- Bulk update question associations from question bank selection modal
- API call from question management interface

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Trainer, Manager, Admin |
| **Purpose** | Modify question associations and ordering for a quiz |
| **Interface** | Question selection form with add/remove buttons and reorder controls |
| **Preconditions** | Quiz exists; user has EDIT_QUIZ permission |
| **Postconditions** | Quiz question associations updated; question order updated |

**Function Details:**

**Actors & Purpose:**
- Trainer adds new questions or removes poor-performing ones
- Admin balances questions across quizzes by redistributing
- Purpose: Update quiz content without recreating quiz

**Purpose:**
Modify the set of questions associated with a quiz and update their display order/sequence.

**Interface Components:**
- Current questions list with remove buttons and reorder controls
- "Add Questions" button opening question bank selection modal
- Question bank search/filter in modal
- Checkboxes for multi-select in modal
- Confirm "Add Selected Questions" button
- Save/Update button for form submission

**Data Processing:**
1. Extract quiz ID and new question ID array
2. Validate question IDs exist and are not deleted
3. Delete existing quiz_questions records for this quiz
4. Insert new quiz_questions records in provided order
5. Maintain explicit order field for display sequence
6. Revalidate quiz detail cache

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-18, VR-19, VR-20)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-30, BR-31, BR-32)

**Database Operations:**

```sql
-- Delete existing associations
DELETE FROM quiz_questions WHERE quiz_id = $quiz_id;

-- Insert new associations with order
INSERT INTO quiz_questions (quiz_id, question_id, "order", created_at)
VALUES 
  ($quiz_id, $question_id_1, 1, NOW()),
  ($quiz_id, $question_id_2, 2, NOW()),
  ...;
```

**Normal Case Flow:**
1. User is on quiz question management page
2. User selects questions from question bank
3. User reorders questions as needed
4. User clicks "Update Questions" button
5. System validates all question IDs
6. System deletes old associations
7. System creates new associations with order
8. System revalidates cache
9. System shows "Questions updated successfully"

**Abnormal Case Flow:**
1. Some selected questions are deleted → Show warning, exclude deleted
2. User removes all questions → Show warning, allow (quiz can have 0 questions)
3. Duplicate question IDs submitted → Show error, allow correction
4. Database error → Show error, allow retry

---

### §3.2.8 Start Quiz Attempt

**Function Trigger:**
- Click "Take Quiz" button from curriculum item detail
- Click "Start Quiz" from lesson/assessment page
- Student navigates to attempt URL with curriculum_item_id parameter
- Redirect from quiz availability check confirming eligibility

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Student/Learner |
| **Purpose** | Initiate a new quiz attempt with session management |
| **Interface** | Quiz instruction page before starting, with "Start" button |
| **Preconditions** | User authenticated as student; curriculum item with quiz exists; user hasn't exceeded max attempts; quiz is available (dates) |
| **Postconditions** | Quiz attempt record created with status='in_progress' and start time; attempt ID returned for question retrieval |

**Function Details:**

**Actors & Purpose:**
- Students create new quiz attempts when ready to take quiz
- System creates attempt record for tracking and time management
- Purpose: Establish session context for answer saving and submission

**Purpose:**
Create a new quiz attempt record, manage session state, and enforce maximum attempts limit to track student progress.

**Interface Components:**
- Quiz instructions and metadata display (title, time limit, passing score, question count)
- "Start Quiz" button initiating attempt
- Optional: Honor pledge or readiness confirmation checkbox
- Timer display placeholder (filled once attempt starts)
- Question progress indicator

**Data Processing:**
1. Extract curriculum_item_id from request
2. Verify user authenticated
3. Query curriculum item + quiz to validate quiz exists and is available (check dates)
4. Count user's previous attempts for this quiz
5. Check max_attempts hasn't been exceeded
6. Check if previous attempt exists in 'in_progress' status (resume vs new)
7. If new attempt:
   - Create quiz_attempts record with:
     - curriculum_item_id
     - user_id (from auth)
     - attempt_number = previous_max + 1
     - status = 'in_progress'
     - started_at = NOW()
     - total_questions = COUNT from quiz_questions
   - Initialize quiz_attempt_answers with NULL for all questions
8. Return attempt ID and question count for client-side timer setup

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-21, VR-22, VR-23, VR-24, VR-25)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-33, BR-34, BR-35, BR-36, BR-37, BR-38)

**Database Operations:**

```sql
-- Validate quiz availability
SELECT q.* FROM quizzes q
JOIN curriculum_items ci ON ci.quiz_id = q.id
WHERE ci.id = $curriculum_item_id
AND q.is_deleted = false
AND (q.available_from IS NULL OR q.available_from <= NOW())
AND (q.available_until IS NULL OR q.available_until >= NOW());

-- Count previous attempts
SELECT COUNT(*) as attempt_count FROM quiz_attempts
WHERE curriculum_item_id = $curriculum_item_id
AND user_id = $user_id
AND status IN ('in_progress', 'submitted');

-- Check for resumable attempt
SELECT id FROM quiz_attempts
WHERE curriculum_item_id = $curriculum_item_id
AND user_id = $user_id
AND status = 'in_progress'
LIMIT 1;

-- Get total questions
SELECT COUNT(*) as total FROM quiz_questions
WHERE quiz_id = $quiz_id;

-- Create new attempt
INSERT INTO quiz_attempts 
(curriculum_item_id, user_id, attempt_number, status, started_at, total_questions)
VALUES ($curriculum_item_id, $user_id, $next_attempt_number, 'in_progress', NOW(), $total_questions)
RETURNING id, started_at;
```

**Normal Case Flow:**
1. User clicks "Start Quiz" button
2. System validates user authentication
3. System checks quiz availability (dates, not deleted)
4. System counts user's previous attempts
5. System checks max_attempts allowed
6. System checks for resumable in_progress attempt
7. If resumable: Return existing attempt ID
8. If new: Create new attempt record
9. System returns attempt ID and question count
10. System displays quiz interface with timer based on returned time_limit
11. System transitions to question display

**Abnormal Case Flow:**
1. User not authenticated → Redirect to login
2. Quiz not available (dates) → Show "Quiz not available" message with availability date
3. Quiz doesn't exist → Show "Quiz not found"
4. Max attempts exceeded → Show "You have used all your attempts. Maximum attempts: X"
5. User already has in_progress attempt → Resume existing attempt (no new attempt)
6. System error creating attempt → Show "Failed to start quiz, please try again"
7. Quiz has 0 questions → Show warning but allow attempt (edge case)

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "attemptId": 42,
    "attemptNumber": 2,
    "totalQuestions": 50,
    "timeLimit": 90,
    "startedAt": "2026-03-15T14:30:00Z",
    "resumed": false
  }
}
```

---

### §3.2.9 Submit Quiz Attempt

**Function Trigger:**
- Click "Submit Quiz" button after completing all questions
- Auto-submit when timer reaches 0 (time limit exceeded)
- Click "End Quiz Early" button with confirmation
- Inactivity timeout after configured period

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Student/Learner |
| **Purpose** | Finalize quiz attempt and trigger automatic grading |
| **Interface** | Submit confirmation dialog showing answer count and submission warning |
| **Preconditions** | Quiz attempt in 'in_progress' status; all answers previously saved |
| **Postconditions** | Attempt marked as 'submitted'; scores calculated and stored; results available |

**Function Details:**

**Actors & Purpose:**
- Students submit completed quizzes
- System calculates scores and determines pass/fail
- System records attempt completion time

**Purpose:**
Mark quiz attempt as complete, calculate scores, and prepare results for review and grading.

**Interface Components:**
- Confirmation dialog: "Submit your quiz? You cannot make changes once submitted."
- Show answer count and unanswered count
- Display time spent vs time limit
- Submit button (primary action)
- Cancel button to return to quiz

**Data Processing:**
1. Extract attempt ID and user ID from request
2. Verify attempt exists and belongs to user (ownership check)
3. Verify attempt status is 'in_progress'
4. Calculate time_spent_seconds = NOW() - started_at
5. Grade all answers:
   - Fetch all saved answers for attempt
   - Fetch all questions and correct answers
   - Compare answers per question
   - Count correct_answers
   - Calculate score: (correct_answers / total_questions) * 100
6. Determine pass/fail: score >= passing_score
7. Update quiz_attempts:
   - status = 'submitted'
   - submitted_at = NOW()
   - score = calculated_score
   - correct_answers = correct_count
   - time_spent_seconds = calculated_time
8. Return attempt result

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-26, VR-27, VR-28)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-39, BR-40, BR-41, BR-42, BR-43, BR-44, BR-45, BR-46)

**Database Operations:**

```sql
-- Verify attempt ownership
SELECT id FROM quiz_attempts
WHERE id = $attempt_id AND user_id = $user_id AND status = 'in_progress'
FOR UPDATE;

-- Get all saved answers
SELECT qa.question_id, qa.selected_answer
FROM quiz_attempt_answers qa
WHERE qa.attempt_id = $attempt_id;

-- Get all questions and correct answers
SELECT qq.quiz_id, qq.question_id, qb.correct_answer
FROM quiz_questions qq
JOIN question_bank qb ON qb.id = qq.question_id
WHERE qq.quiz_id = (SELECT quiz_id FROM quizzes WHERE id = 
  (SELECT quiz_id FROM curriculum_items WHERE id = 
    (SELECT curriculum_item_id FROM quiz_attempts WHERE id = $attempt_id)
  )
);

-- Get passing score
SELECT passing_score FROM quizzes WHERE id = $quiz_id;

-- Update attempt with results
UPDATE quiz_attempts
SET 
  status = 'submitted',
  submitted_at = NOW(),
  score = $calculated_score,
  correct_answers = $correct_count,
  time_spent_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
WHERE id = $attempt_id
RETURNING *;
```

**Normal Case Flow:**
1. User completes answering questions
2. User clicks "Submit Quiz" button
3. System displays submission confirmation dialog
4. User confirms submission
5. System verifies attempt ownership and status
6. System grades all answers
7. System calculates score and determines pass/fail
8. System updates attempt with submitted status and scores
9. System returns results summary
10. System displays results page with performance details

**Abnormal Case Flow:**
1. Attempt doesn't exist → Show "Attempt not found"
2. Attempt already submitted → Show "Quiz already submitted"
3. User not owner of attempt → Show "Access Denied"
4. Calculation error → Show error, log for manual review
5. Network error during submission → Show error, allow retry with data preservation
6. Database error → Show error, allow retry
7. Time limit exceeded → Auto-submit with notification
8. Session expiration → Auto-submit remaining answers

**Result Calculation Logic:**
```
foreach answer in savedAnswers:
  if answer.selectedAnswer matches correctAnswer:
    correctCount++

score = (correctCount / totalQuestions) * 100
passed = score >= passingScore
```

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "attemptId": 42,
    "attemptNumber": 2,
    "score": 85,
    "passingScore": 70,
    "passed": true,
    "correctAnswers": 42,
    "totalQuestions": 50,
    "timeSpent": 2580,
    "submittedAt": "2026-03-15T15:53:00Z"
  }
}
```

---

### §3.2.10 Get Questions For Attempt

**Function Trigger:**
- Quiz interface page load after attempt starts
- Navigate between questions during quiz
- API polling for question updates

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Student/Learner |
| **Purpose** | Retrieve questions for active quiz attempt with options but not correct answers |
| **Interface** | Question text, options, and question navigation displayed in quiz interface |
| **Preconditions** | Attempt must exist and be in 'in_progress' status; user must own attempt |
| **Postconditions** | Question list retrieved without revealing correct answers |

**Function Details:**

**Actors & Purpose:**
- Students retrieve questions during quiz attempt
- System provides questions without answer hints
- Purpose: Deliver assessment content while preventing cheating

**Purpose:**
Retrieve all quiz questions in attempt order while hiding correct answers during the attempt, only showing after submission.

**Interface Components:**
- Question text display
- Answer options (multiple choice, single choice, etc.)
- Question progress indicator (e.g., "Question 10 of 50")
- Navigation buttons: Previous, Next
- Question indicator showing answered/unanswered status

**Data Processing:**
1. Extract attempt ID
2. Verify attempt exists and belongs to user
3. Verify attempt status is 'in_progress'
4. Query quiz_questions for quiz linked to this attempt
5. Fetch question_bank data but EXCLUDE correct_answer field
6. Return questions in order with ID, text, type, options only
7. Include question number for progress tracking

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-29, VR-30, VR-31)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-47, BR-48, BR-49, BR-50)

**Database Operations:**

```sql
SELECT qq.id as question_sequence_id, qq.question_id, qq.order,
  qb.question_text, qb.type, qb.options
FROM quiz_questions qq
JOIN question_bank qb ON qb.id = qq.question_id
WHERE qq.quiz_id = (
  SELECT q.id FROM quizzes q
  JOIN curriculum_items ci ON ci.quiz_id = q.id
  WHERE ci.id = (SELECT curriculum_item_id FROM quiz_attempts WHERE id = $attempt_id)
)
AND qb.is_deleted = false
ORDER BY qq.order ASC;
-- Note: correct_answer and explanation intentionally excluded
```

**Normal Case Flow:**
1. User starts quiz attempt
2. System retrieves all questions for the quiz
3. System excludes correct answers from response
4. System displays questions one by one or in scrollable list
5. User navigates between questions
6. Each navigation re-queries or uses cached question list

**Abnormal Case Flow:**
1. Attempt doesn't exist → Show "Attempt not found"
2. Attempt already submitted → Show "Quiz submitted, cannot view editable questions"
3. User doesn't own attempt → Show "Access Denied"
4. Quiz has 0 questions → Show "No questions in this quiz"
5. Some questions deleted since attempt start → Show available questions only

**Response Payload (array):**
```json
{
  "success": true,
  "data": [
    {
      "sequenceId": 101,
      "questionId": 5,
      "order": 1,
      "questionText": "What is the capital of France?",
      "type": "single_choice",
      "options": [
        "London",
        "Paris",
        "Berlin",
        "Madrid"
      ]
    },
    {
      "sequenceId": 102,
      "questionId": 6,
      "order": 2,
      "questionText": "Select all prime numbers",
      "type": "multiple_choice",
      "options": [
        "2",
        "3",
        "4",
        "5"
      ]
    }
  ]
}
```

---

### §3.2.11 Save Attempt Answer

**Function Trigger:**
- User selects an option (single/multiple choice)
- User clicks "Save Answer" button
- Auto-save after X seconds of inactivity (configurable)
- Page unload with unsaved answers (befo

re Navigation)
- Timer interval trigger for periodic auto-save

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Student/Learner |
| **Purpose** | Persist individual question answers during quiz session |
| **Interface** | Transparent auto-save indicator; manual save button available |
| **Preconditions** | Attempt in 'in_progress' status; user must own attempt; answer selected |
| **Postconditions** | Answer saved to quiz_attempt_answers; timestamp recorded |

**Function Details:**

**Actors & Purpose:**
- Students save answers as they progress through quiz
- System provides progress safety against accidental loss
- Purpose: Enable incremental answer saving and session resume

**Purpose:**
Persist student answers throughout quiz session, preventing data loss and enabling session resume if interrupted.

**Interface Components:**
- Auto-save indicator (subtle icon with "Saving..." status)
- Manual "Save Answer" button (optional if auto-save enabled)
- Unsaved changes indicator (dot or color change on question)
- Deselect/Clear answer button to remove selection

**Data Processing:**
1. Extract attempt ID, question ID, selected answer(s) from request
2. Verify attempt exists and belongs to user
3. Verify attempt status is 'in_progress'
4. Verify question belongs to quiz (security check)
5. Handle answer format based on question type:
   - single_choice: Store single value
   - multiple_choice: Store array/JSON of selected values
6. Insert or update quiz_attempt_answers record:
   - ON CONFLICT: UPDATE saved_at timestamp on duplicate
   - Store answer_text or answer_json as appropriate
7. Return confirmation with timestamp

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-32, VR-33, VR-34, VR-35)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-51, BR-52, BR-53, BR-54, BR-55)

**Database Operations:**

```sql
-- Verify attempt and question ownership
SELECT qa.attempt_id FROM quiz_attempt_answers qa
WHERE qa.attempt_id = $attempt_id
LIMIT 1;

-- Insert or update answer
INSERT INTO quiz_attempt_answers 
(attempt_id, question_id, selected_answer, saved_at)
VALUES ($attempt_id, $question_id, $selected_answer, NOW())
ON CONFLICT (attempt_id, question_id) 
DO UPDATE SET 
  selected_answer = $selected_answer,
  saved_at = NOW()
RETURNING attempt_id, question_id, saved_at;
```

**Normal Case Flow:**
1. User selects option(s) for a question
2. User clicks next question or save button (or auto-save triggers)
3. System validates selection for question type
4. System saves answer with timestamp
5. System shows brief "Saved" confirmation
6. System continues without interrupting user

**Abnormal Case Flow:**
1. Attempt doesn't exist → Show "Session expired, quiz not found"
2. Attempt already submitted → Show "Quiz submitted, cannot save"
3. User doesn't own attempt → Show "Access Denied"
4. Question doesn't belong to quiz → Show error (should not occur)
5. Invalid answer format → Show validation error
6. Database error → Log for review, prompt user to retry or accept
7. Network error → Queue for local retry, show offline indicator

**Answer Format Handling:**
```
if question.type === 'single_choice':
  answer = { questionId, selectedOption }  // single string

if question.type === 'multiple_choice':
  answer = { questionId, selectedOptions: [...] }  // array of strings
```

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "attemptId": 42,
    "questionId": 7,
    "savedAt": "2026-03-15T15:35:45Z",
    "message": "Answer saved"
  }
}
```

---

### §3.2.12 Get Attempt Result

**Function Trigger:**
- After quiz submission, results page appears automatically
- Click "View Results" from quiz history/my quizzes
- Click "Review Attempt" from attempt listing
- Navigate to attempt results page url

**Function Description:**

| Aspect | Details |
|--------|---------|
| **Actors** | Student/Learner, Trainer (review), Admin |
| **Purpose** | Display detailed quiz results including score, correct/incorrect answers, and explanations |
| **Interface** | Results summary with score display and question-by-question breakdown |
| **Preconditions** | Attempt must be submitted; user must own attempt or be trainer |
| **Postconditions** | Results displayed with all submission details and feedback |

**Function Details:**

**Actors & Purpose:**
- Students review their quiz performance and correct/incorrect answers
- Trainers review student results for assessment
- Purpose: Provide detailed feedback on quiz performance

**Purpose:**
Display comprehensive quiz results with answer review, scoring breakdown, and educational feedback to support learning.

**Interface Components:**
- Results summary card: Score, Pass/Fail status, Time Spent, Attempt #
- Performance gauge (visual)
- Question-by-question breakdown:
  - Question text
  - Student's answer(s)
  - Correct answer(s) (revealed after submission)
  - Explanation (if provided in question bank)
  - Mark as correct/incorrect indicator
- Print/Download results button

**Data Processing:**
1. Extract attempt ID
2. Verify attempt exists
3. Verify user owns attempt OR user is trainer (check permission)
4. Verify attempt status is 'submitted'
5. Fetch attempt details: score, attempt_number, time_spent, submitted_at
6. Fetch quiz metadata: title, passing_score, question_count
7. Fetch all question results:
   - Question text, type, options
   - Correct answer(s) from question_bank
   - Student's saved answer from quiz_attempt_answers
   - Comparison result (correct/incorrect)
   - Correct answer indicator
   - Explanation from question_bank
8. Build results object with all data
9. Return comprehensive results

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-36, VR-37, VR-38)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-56, BR-57, BR-58, BR-59, BR-60)

**Database Operations:**

```sql
-- Get attempt details
SELECT qa.id as attempt_id, qa.status, qa.score, qa.attempt_number, 
  qa.time_spent_seconds, qa.submitted_at, qa.correct_answers,
  qa.total_questions
FROM quiz_attempts qa
WHERE qa.id = $attempt_id;

-- Get quiz metadata
SELECT q.id, q.title, q.passing_score, q.description
FROM quizzes q
WHERE q.id = (SELECT quiz_id FROM curriculum_items WHERE id = 
  (SELECT curriculum_item_id FROM quiz_attempts WHERE id = $attempt_id)
);

-- Get all question results with answers
SELECT qq.order, qq.question_id, qb.question_text, qb.type, 
  qb.options, qb.correct_answer, qb.explanation,
  qaa.selected_answer
FROM quiz_questions qq
JOIN question_bank qb ON qb.id = qq.question_id
LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qb.id 
  AND qaa.attempt_id = $attempt_id
WHERE qq.quiz_id = $quiz_id
ORDER BY qq.order;
```

**Normal Case Flow:**
1. User submits quiz or clicks "View Results"
2. System verifies ownership/permission
3. System retrieves attempt and quiz details
4. System fetches all question results with student and correct answers
5. System calculates/retrieves overall score and pass/fail
6. System displays results summary with visual score indicator
7. System displays question-by-question breakdown with comparisons
8. System shows explanations for each question
9. User can scroll through results, print, or navigate back

**Abnormal Case Flow:**
1. Attempt doesn't exist → Show "Attempt not found"
2. Attempt not yet submitted → Show "Results not available until quiz is submitted" + "View current attempt" button
3. User doesn't own and isn't trainer → Show "Access Denied"
4. Quiz deleted after submission → Show partial results with "Quiz no longer exists" warning
5. Some questions deleted post-submission → Show available results, note deleted questions

**Score Calculation Display Example:**
```
Score: 42/50 (84%)
Passing Score: 70%
Result: PASSED ✓
```

**Response Payload:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": 42,
      "number": 2,
      "score": 84,
      "passingScore": 70,
      "passed": true,
      "correctAnswers": 42,
      "totalQuestions": 50,
      "timeSpent": 2580,
      "submittedAt": "2026-03-15T15:53:00Z"
    },
    "quiz": {
      "id": 1,
      "title": "Midterm Exam",
      "description": "Chapter 1-5 comprehensive exam"
    },
    "questions": [
      {
        "order": 1,
        "questionId": 5,
        "text": "What is capital of France?",
        "type": "single_choice",
        "options": ["London", "Paris", "Berlin", "Madrid"],
        "correct": ["Paris"],
        "student": ["Paris"],
        "isCorrect": true,
        "explanation": "France's capital and largest city is Paris."
      },
      {
        "order": 2,
        "questionId": 6,
        "text": "Select prime numbers",
        "type": "multiple_choice",
        "options": ["2", "3", "4", "5"],
        "correct": ["2", "3", "5"],
        "student": ["2", "3"],
        "isCorrect": false,
        "explanation": "Prime numbers are numbers greater than 1 with no divisors..."
      }
    ]
  }
}
```

---

## §3.3 Screen Functions

### Quiz List Screen Functions
1. **Search & Filter**: Full-text search on quiz title, course-based filtering, pagination
2. **Quick Actions**: View, Edit, Delete buttons visible per row
3. **Bulk Actions**: Select multiple quizzes, bulk delete or bulk export

### Quiz Detail Screen Functions
1. **Tab Navigation**: Details tab, Questions tab, Attempts tab (for admin)
2. **Question Management**: Add questions button, remove question buttons, reorder via drag-drop
3. **Quiz Status Badge**: Display current status (draft, published, archived)

### Quiz Attempt Screen Functions
1. **Timer Display**: Countdown timer counting down from time_limit
2. **Question Navigation**: Previous/Next buttons, question index selector
3. **Answer Progress**: Visual indicator of answered/unanswered questions
4. **Auto-save Indicator**: Subtle save status display

### Results Screen Functions
1. **Score Display**: Large score percentage with pass/fail badge
2. **Question Review**: Expandable question cards showing correct vs. student answers
3. **Performance Analysis**: Chart showing topics/categories with strongest/weakest performance
4. **Print/Share**: Export results as PDF or share results link

---

## §3.4 Data Models & Enums

### Entities

#### Quiz
```typescript
{
  id: number;
  course_id: number;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  passing_score: number; // 0-100
  max_attempts: number;
  status: 'draft' | 'published' | 'archived';
  available_from?: Date;
  available_until?: Date;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### QuizQuestion (Junction Table)
```typescript
{
  id: number;
  quiz_id: number;
  question_id: number;
  order: number; // Display sequence
  created_at: Date;
}
```

#### QuizAttempt
```typescript
{
  id: number;
  curriculum_item_id: number;
  user_id: number;
  attempt_number: number;
  status: 'in_progress' | 'submitted';
  started_at: Date;
  submitted_at?: Date;
  total_questions: number;
  correct_answers?: number;
  score?: number; // 0-100
  time_spent_seconds?: number;
}
```

#### QuizAttemptAnswer
```typescript
{
  id: number;
  attempt_id: number;
  question_id: number;
  selected_answer: string | string[]; // JSON for multiple
  saved_at: Date;
}
```

### Enums

#### QuestionType
```typescript
type QuestionType = 'single_choice' | 'multiple_choice';
```

#### QuizStatus
```typescript
type QuizStatus = 'draft' | 'published' | 'archived';
```

#### AttemptStatus
```typescript
type AttemptStatus = 'in_progress' | 'submitted';
```

---

## §3.5 Validation Rules Matrix

| ID | Rule Definition |
|:--:|-----------------|
| VR-01 | **Get All Quizzes - Pagination**: Page must be >= 1; Limit must be between 1-100; If invalid, default to page=1, limit=100 |
| VR-02 | **Get All Quizzes - Search**: Search query optional; If provided, must be string < 255 chars; Sanitize for SQL injection |
| VR-03 | **Get All Quizzes - Course Filter**: If course_id provided, must be positive integer; Must match existing course; 다른 경우 무시 |
| VR-04 | **Get Quiz - ID Validation**: Quiz ID must be positive integer; Quiz must exist in database; Quiz must not be soft-deleted |
| VR-05 | **Get Quiz - Permission**: User must have VIEW_QUIZ permission or be quiz owner; Admin/Manager can view all |
| VR-06 | **Create Quiz - Title**: Required; Length 1-255 characters; Cannot be whitespace-only; Must be unique per course (optional) |
| VR-07 | **Create Quiz - Description**: Optional; If provided, length max 1000 characters; Sanitize HTML/XSS |
| VR-08 | **Create Quiz - Course**: Required; Must be positive integer; Must exist in courses table; User must have access |
| VR-09 | **Create Quiz - Configuration**: time_limit 1-480 minutes (optional); passing_score 0-100 (required, default 70); max_attempts 1-100 (default 3) |
| VR-10 | **Create Quiz - Questions**: question_ids must be array of positive integers; All questions must exist and not be deleted; Can be empty (0 questions allowed) |
| VR-11 | **Update Quiz - ID**: Quiz ID must be positive integer; Quiz must exist and not be soft-deleted |
| VR-12 | **Update Quiz - Fields**: Same validation as Create for each provided field; Only provided fields are updated (partial update) |
| VR-13 | **Update Quiz - Permission**: User must be quiz owner OR have EDIT_QUIZ permission; Manager/Admin can edit all |
| VR-14 | **Delete Quiz - ID**: Quiz ID must be positive integer; Quiz must exist and not already deleted |
| VR-15 | **Delete Quiz - Permission**: User must have DELETE_QUIZ permission or be quiz owner; Manager/Admin can delete all |
| VR-16 | **Get Quiz Questions - Quiz ID**: Quiz ID must be positive integer; Quiz must exist; User has VIEW_QUIZ permission |
| VR-17 | **Get Quiz Questions - Result Integrity**: Only return non-deleted questions; Maintain display order from quiz_questions |
| VR-18 | **Update Quiz Questions - ID**: Quiz ID valid; question_ids array all positive integers and existing |
| VR-19 | **Update Quiz Questions - Duplicates**: No duplicate question IDs in submitted array; Each question only appears once |
| VR-20 | **Update Quiz Questions - Permission**: User must have EDIT_QUIZ permission; Cannot modify if quiz has active attempts |
| VR-21 | **Start Attempt - Item ID**: curriculum_item_id must be positive integer; Must exist and link to quiz |
| VR-22 | **Start Attempt - Quiz Availability**: Quiz must not be deleted; Check available_from and available_until dates match NOW(); Quiz must not be in draft status |
| VR-23 | **Start Attempt - User Authentication**: User must be authenticated; Must have valid session |
| VR-24 | **Start Attempt - Attempt Limits**: Count previous attempts; If >= max_attempts, reject new attempt; Allow resuming in_progress |
| VR-25 | **Start Attempt - Question Count**: Get total_questions from quiz_questions count; Must be >= 0 (0 questions allowed but unusual) |
| VR-26 | **Submit Attempt - Attempt Ownership**: Attempt must exist; User must be attempt owner (user_id match); Attempt must be in 'in_progress' |
| VR-27 | **Submit Attempt - Status**: Attempt must be in 'in_progress' state; Cannot submit already submitted attempt |
| VR-28 | **Submit Attempt - Data Integrity**: All questions must have entries in attempt_answers (even if null/unanswered); Grading must be deterministic |
| VR-29 | **Get Questions For Attempt - Ownership**: Attempt must exist; User must own attempt |
| VR-30 | **Get Questions For Attempt - Status**: Attempt must be in 'in_progress' (not submitted yet) |
| VR-31 | **Get Questions For Attempt - Security**: Exclude correct_answer field to prevent cheating (do not return answers) |
| VR-32 | **Save Answer - Attempt Ownership**: Attempt must exist; User must own attempt (attempt.user_id === current_user.id) |
| VR-33 | **Save Answer - Attempt Status**: Attempt must be 'in_progress'; Cannot save after submission |
| VR-34 | **Save Answer - Question Validation**: Question must exist; Question must belong to attempt's quiz |
| VR-35 | **Save Answer - Answer Format**: Answer must match question type (single value for single_choice, array for multiple_choice) |
| VR-36 | **Get Result - Attempt Status**: Attempt must exist; Attempt must be in 'submitted' status |
| VR-37 | **Get Result - Ownership**: User owns attempt OR User has GRADE_QUIZ/MANAGE_QUIZZES permission |
| VR-38 | **Get Result - Data Completeness**: All fields (score, time spent, submitted_at) must be present and valid |

---

## §3.6 Business Rules Matrix

| ID | Rule Definition |
|:--:|-----------------|
| BR-01 | **Get All Quizzes - Permission Check**: Only trainers, managers, and admins can view quizzes |
| BR-02 | **Get All Quizzes - Soft Delete**: Exclude all quizzes where is_deleted = true from results |
| BR-03 | **Get All Quizzes - Course Scoping**: Trainers see only quizzes from their assigned courses; Managers see assigned courses; Admin sees all |
| BR-04 | **Get All Quizzes - Search Scope**: Full-text search on title only; Search is case-insensitive; Wildcard matching supported |
| BR-05 | **Get All Quizzes - Default Ordering**: Results ordered by created_at DESC (newest first); Secondary sort by title ASC |
| BR-06 | **Get All Quizzes - Pagination**: Default page=1, limit=100; Total count used for pagination UI; Off-by-one errors prevented |
| BR-07 | **Get Quiz - Include Metadata**: Return full quiz record with all fields including dates, configuration, and calculated question_count |
| BR-08 | **Get Quiz - Question Count**: Calculate question count from quiz_questions join in same query; Do not make separate request |
| BR-09 | **Get Quiz - Availability Display**: Include both available_from and available_until in response for availability indication |
| BR-10 | **Create Quiz - Ownership**: New quiz creator becomes "owner" (Creator ID logged in audit trail) |
| BR-11 | **Create Quiz - Status Default**: Newly created quizzes default to 'draft' status until explicitly published |
| BR-12 | **Create Quiz - Timestamp**: Set created_at and updated_at to NOW() in UTC; Store timezone-agnostic |
| BR-13 | **Create Quiz - Question Association**: Associate selected questions via quiz_questions junction table; Maintain order field per selection |
| BR-14 | **Create Quiz - Sanitization**: Sanitize title and description to prevent XSS; Remove HTML tags, escape special chars |
| BR-15 | **Create Quiz - Validation**: All validation errors collected and returned together (not fail-fast); Field-level error messages shown |
| BR-16 | **Create Quiz - Course Verification**: Verify course exists and is not deleted before accepting course_id in quiz creation |
| BR-17 | **Update Quiz - Partial Update**: Only update fields that are provided; null values not overwritten (use explicit COALESCE) |
| BR-18 | **Update Quiz - Update Timestamp**: Always update updated_at to NOW() even if no fields changed |
| BR-19 | **Update Quiz - Metadata Only**: Cannot change quiz_id or course_id; These are immutable after creation |
| BR-20 | **Update Quiz - Status Transition**: Status transitions validated (e.g., archived quiz can be unarchived); No invalid state transitions |
| BR-21 | **Update Quiz - In-Flight Attempts**: If quiz has active attempts, disallow changes to time_limit and passing_score to prevent unfair changes |
| BR-22 | **Delete Quiz - Soft Delete Only**: Never hard delete quiz; Set is_deleted=true and update deleted_at timestamp |
| BR-23 | **Delete Quiz - Preserve Data**: All attempt and answer records preserved despite quiz deletion for historical and grading purposes |
| BR-24 | **Delete Quiz - Block New Attempts**: Once deleted, no new attempts can be started; Existing in_progress attempts can still be submitted |
| BR-25 | **Delete Quiz - Notification**: Notify users with active attempts that quiz is no longer available (email/in-app notification) |
| BR-26 | **Delete Quiz - Audit Trail**: Log deletion action with timestamp and user ID for compliance and recovery |
| BR-27 | **Get Quiz Questions - Question Details**: Return question text, type, and options; Do not return correct_answer field |
| BR-28 | **Get Quiz Questions - Display Order**: Questions returned in order specified by quiz_questions.order field (0-indexed or 1-indexed consistently) |
| BR-29 | **Get Quiz Questions - Delete Handling**: Exclude questions where question_bank.is_deleted=true from results |
| BR-30 | **Update Quiz Questions - Atomic Transaction**: Delete old associations and insert new in single transaction; No partial updates |
| BR-31 | **Update Quiz Questions - Order Preservation**: New order field values assigned per array position (1st item gets order=1, etc.) |
| BR-32 | **Update Quiz Questions - Duplicate Prevention**: If same question appears twice, both instances linked (allow duplicates or not - clarify per UX) |
| BR-33 | **Start Attempt - Availability Check**: Quiz available_from, available_until dates honored; Outside window = "Quiz not available yet" or "Quiz period ended" |
| BR-34 | **Start Attempt - No Deleted Quizzes**: If quiz is deleted before attempt start, show "Quiz no longer available" |
| BR-35 | **Start Attempt - Max Attempts Enforcement**: Hard limit on number of attempts per user per curriculum_item; Previous attempts counted IN_PROGRESS + SUBMITTED |
| BR-36 | **Start Attempt - Resume Logic**: If previous attempt exists in IN_PROGRESS, return that attempt ID instead of creating new; Support mid-quiz resume |
| BR-37 | **Start Attempt - Attempt Numbering**: Attempt number = MAX(previous) + 1; First attempt = 1, second = 2, etc. |
| BR-38 | **Start Attempt - Question Count**: Store question count in attempt for score calculation consistency (don't recalculate later if questions removed) |
| BR-39 | **Submit Attempt - Ownership Verification**: Double-check attempt.user_id === current_user.id before any grade operations |
| BR-40 | **Submit Attempt - Grading Logic**: Compare user answers against correct_answer from question_bank; Case-sensitive for text answers (or configurable) |
| BR-41 | **Submit Attempt - Score Calculation**: Score = (correct_count / total_questions) * 100; Round to nearest whole number; Handle division by zero |
| BR-42 | **Submit Attempt - Pass Determination**: Pass = score >= quiz.passing_score; Exact >= comparison (not > ); Results are deterministic |
| BR-43 | **Submit Attempt - Timestamp Recording**: submitted_at = NOW() (server time, not client time); time_spent = submitted_at - started_at |
| BR-44 | **Submit Attempt - Idempotent**: If submitted again, return cached results; Do not recalculate (first submission is authoritative) |
| BR-45 | **Submit Attempt - Database Update**: Update quiz_attempts with all results in single UPDATE statement; No race conditions |
| BR-46 | **Submit Attempt - Notification**: If passed, send passing notification; If failed, send failure notification with option to retry |
| BR-47 | **Get Questions For Attempt - In-Progress Only**: Only return full question data if attempt status = 'in_progress'; Block for submitted attempts |
| BR-48 | **Get Questions For Attempt - Exclude Answers**: Do not return correct_answer or explanation fields in question data during attempt |
| BR-49 | **Get Questions For Attempt - Include Options**: Return all question options for display (even non-selected ones) |
| BR-50 | **Get Questions For Attempt - Time Limit Info**: Return quiz.time_limit_minutes so client can set countdown timer accurately |
| BR-51 | **Save Answer - Concurrent Editing**: Use UPSERT logic (INSERT ... ON CONFLICT) to handle rapid saves without race conditions |
| BR-52 | **Save Answer - Answer Preservation**: Always store complete user answer selection; Overwrite previous answer if re-answered same question |
| BR-53 | **Save Answer - Timestamp Tracking**: Update saved_at timestamp with each save; Track when answer was last changed |
| BR-54 | **Save Answer - No Partial Data**: Require complete answer data; Reject null/undefined answer values with validation error |
| BR-55 | **Save Answer - Network Resilience**: If answer save fails, prompt user to manually save; Provide visual unsaved indicator; Implement retry logic |
| BR-56 | **Get Result - Complete Data Return**: Return all attempt data, quiz metadata, and full question results in single response |
| BR-57 | **Get Result - Answer Revelation**: Only after submission (status='submitted'), reveal correct_answer and explanation fields |
| BR-58 | **Get Result - Attempted Questions**: Include all questions even if unanswered; Show null or empty for student.answer if not attempted |
| BR-59 | **Get Result - Performance Analysis**: Calculate and return additional metrics: %correct, %incorrect, %unanswered, average time-per-question |
| BR-60 | **Get Result - Caching**: Cache result data for 1 hour; Cache invalidate on quiz/answer changes; Support long-term result archival |

---

## §3.7 Business Rules Categorization

**Access Control & Security (8 rules)**
- BR-01, BR-03, BR-39, BR-47, BR-48, BR-49, BR-54, BR-57

**Data Integrity & Consistency (12 rules)**
- BR-02, BR-07, BR-08, BR-13, BR-17, BR-18, BR-27, BR-28, BR-41, BR-45, BR-51, BR-58

**Quiz Lifecycle & Status (10 rules)**
- BR-05, BR-09, BR-11, BR-12, BR-19, BR-20, BR-22, BR-23, BR-24, BR-25

**Attempt Management (15 rules)**
- BR-10, BR-21, BR-33, BR-34, BR-35, BR-36, BR-37, BR-38, BR-40, BR-42, BR-43, BR-44, BR-46, BR-52, BR-53

**Question & Answer Handling (12 rules)**
- BR-04, BR-06, BR-14, BR-15, BR-16, BR-26, BR-29, BR-30, BR-31, BR-32, BR-50, BR-55

**Performance & Optimization (5 rules)**
- BR-30, BR-36, BR-37, BR-44, BR-60

**Notification & User Experience (3 rules)**
- BR-25, BR-46, BR-55

**Result Presentation & Analytics (5 rules)**
- BR-48, BR-49, BR-56, BR-59, BR-60

---

## Document Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Mar 2026 | Assessment Team | Initial SRS creation with 14 quiz functions, 38 validation rules, 60 business rules |

---

**End of Software Requirement Specification**
