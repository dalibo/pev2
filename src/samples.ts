import SAMPLE_JSON from './plan.json';
import SAMPLE2_JSON from './plan2.json';
import SAMPLE3_JSON from './plan3.json';

const SAMPLE_QUERY = `SELECT c.state,
  cat.categoryname,
  sum(o.netamount),
  sum(o.totalamount)
FROM customers c
  INNER JOIN cust_hist ch ON c.customerid = ch.customerid
  INNER JOIN orders o ON ch.orderid = o.orderid
  INNER JOIN orderlines ol ON ol.orderid = o.orderid
  INNER JOIN products p ON ol.prod_id = p.prod_id
  INNER JOIN categories cat ON p.category = cat.category
GROUP BY c.state, cat.categoryname
ORDER BY c.state, sum(o.totalamount) DESC LIMIT 10 OFFSET 1`;

const SAMPLE2_QUERY = `SELECT rel_users_exams.user_username AS rel_users_exams_user_username,
         rel_users_exams.exam_id AS rel_users_exams_exam_id,
         rel_users_exams.started_at AS rel_users_exams_started_at,
         rel_users_exams.finished_at AS rel_users_exams_finished_at,
         answer_1.id AS answer_1_id,
         answer_1.text AS answer_1_text,
         answer_1.correct AS answer_1_correct,
         answer_1.fraction AS answer_1_fraction,
         answer_1.question_id AS answer_1_question_id,
         question_1.id AS question_1_id,
         question_1.title AS question_1_title,
         question_1.text AS question_1_text,
         question_1.file AS question_1_file,
         question_1.type AS question_1_type,
         question_1.source AS question_1_source,
         question_1.exam_id AS question_1_exam_id,
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
    ON exam_1.id = rel_users_exams.exam_id LEFT OUTER
JOIN question AS question_1
    ON exam_1.id = question_1.exam_id LEFT OUTER
JOIN answer AS answer_1
    ON question_1.id = answer_1.question_id
WHERE rel_users_exams.user_username = %(param_1)s
        AND rel_users_exams.exam_id = %(param_2)s
ORDER BY  question_1.id;`;

const SAMPLE3_QUERY = `SELECT feature_name, tags->'tourism' As tourism_type FROM ch03.paris
    WHERE ar_num = 8 AND tags?'tourism';
`;

export const SAMPLES = [
  [SAMPLE_JSON, SAMPLE_QUERY],
  [SAMPLE2_JSON, SAMPLE2_QUERY],
  [SAMPLE3_JSON, SAMPLE3_QUERY],
];
