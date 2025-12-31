# Task: Integrate DIKSHA Courses

- [x] **Database Setup**
    - [x] Create `supabase/migrations/20251230180200_create_courses_tables.sql` with `courses`, `course_clicks`, `category_clicks`.
    - [ ] Update TS types or manually define interfaces.

- [ ] **Backend: Data Sync**
    - [ ] Create `app/api/courses/sync/route.ts` to handle API calls to DIKSHA.
    - [ ] Logic: Idempotent UPSERT, preserve `created_at`, update `updated_at`.

- [ ] **Backend: Data Access & Tracking**
    - [ ] Create `getNewCourses()`, `getTrendingCourses()` (via clicks), `getAllCourses()`.
    - [ ] Create `trackCourseClick(courseId, source)` server action.

- [ ] **Frontend: Discover Courses Page (`/discover/courses`)**
    - [ ] Remove mock data.
    - [ ] Implement sections: New, Trending, All.
    - [ ] Implement Click -> Track -> Redirect flow.

- [ ] **Frontend: Discover Home (`/discover`)**
    - [ ] Fetch and display 2-3 preview courses (Trending -> New).
