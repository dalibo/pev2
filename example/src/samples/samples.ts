export const plan1_source = `
Nested Loop Left Join  (cost=11.95..28.52 rows=5 width=157) (actual time=0.010..0.010 rows=0 loops=1)
  Output: rel_users_exams.user_username, rel_users_exams.exam_id, rel_users_exams.started_at, rel_users_exams.finished_at, exam_1.id, exam_1.title, exam_1.date_from, exam_1.date_to, exam_1.created, exam_1.created_by_, exam_1.duration, exam_1.success_threshold, exam_1.published
  Inner Unique: true
  Join Filter: (exam_1.id = rel_users_exams.exam_id)
  Buffers: shared hit=1
  ->  Bitmap Heap Scan on public.rel_users_exams  (cost=11.80..20.27 rows=5 width=52) (actual time=0.009..0.009 rows=0 loops=1)
        Output: rel_users_exams.user_username, rel_users_exams.exam_id, rel_users_exams.started_at, rel_users_exams.finished_at
        Recheck Cond: (1 = rel_users_exams.exam_id)
        Buffers: shared hit=1
        ->  Bitmap Index Scan on rel_users_exams_pkey  (cost=0.00..11.80 rows=5 width=0) (actual time=0.005..0.005 rows=0 loops=1)
              Index Cond: (1 = rel_users_exams.exam_id)
              Buffers: shared hit=1
  ->  Materialize  (cost=0.15..8.17 rows=1 width=105) (never executed)
        Output: exam_1.id, exam_1.title, exam_1.date_from, exam_1.date_to, exam_1.created, exam_1.created_by_, exam_1.duration, exam_1.success_threshold, exam_1.published
        ->  Index Scan using exam_pkey on public.exam exam_1  (cost=0.15..8.17 rows=1 width=105) (never executed)
              Output: exam_1.id, exam_1.title, exam_1.date_from, exam_1.date_to, exam_1.created, exam_1.created_by_, exam_1.duration, exam_1.success_threshold, exam_1.published
              Index Cond: (exam_1.id = 1)
Planning Time: 1.110 ms
Execution Time: 0.170 ms
`
export const plan1_query = `SELECT rel_users_exams.user_username AS rel_users_exams_user_username,
         rel_users_exams.exam_id AS rel_users_exams_exam_id,
         rel_users_exams.started_at AS rel_users_exams_started_at,
         rel_users_exams.finished_at AS rel_users_exams_finished_at,
         exam_1.id AS exam_1_id,
         exam_1.title AS exam_1_title,
         exam_1.date_from AS exam_1_date_from,
         exam_1.date_to AS exam_1_date_to,
         exam_1.created AS exam_1_created,
         exam_1.created_by_ AS exam_1_created_by_,
         exam_1.duration AS exam_1_duration,
         exam_1.success_threshold AS exam_1_success_threshold,
         exam_1.published AS exam_1_published
FROM rel_users_exams LEFT OUTER
JOIN exam AS exam_1
    ON exam_1.id = rel_users_exams.exam_id
WHERE 1 = rel_users_exams.exam_id;
`
