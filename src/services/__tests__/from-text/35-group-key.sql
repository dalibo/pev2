-- Taken from
-- https://github.com/postgres/postgres/blob/facad31474ac6dace3894ebc7c45dc3cc829422e/src/test/regress/expected/groupingsets.out

create temp view gstest1(a,b,v)
as values (1,1,10),(1,1,11),(1,2,12),(1,2,13),(1,3,14),
          (2,3,15),
          (3,3,16),(3,4,17),
          (4,1,18),(4,1,19);

create temp table gstest_empty (a integer, b integer, v integer);

create temp table gstest4(id integer, v integer,
                          unhashable_col bit(4), unsortable_col xid);
insert into gstest4
values (1,1,b'0000','1'), (2,2,b'0001','1'),
       (3,4,b'0010','2'), (4,8,b'0011','2'),
       (5,16,b'0000','2'), (6,32,b'0001','2'),
       (7,64,b'0010','1'), (8,128,b'0011','1');

explain (costs off, format JSON) select a, b, grouping(a,b), sum(v), count(*), max(v)
  from gstest1 group by grouping sets ((a),(b)) order by 3,1,2;

explain (costs off, format JSON) select a, b, grouping(a,b), sum(v), count(*), max(v)
  from gstest1 group by cube(a,b) order by 3,1,2;


explain (costs off, format JSON)
  select unhashable_col, unsortable_col,
         grouping(unhashable_col, unsortable_col),
         count(*), sum(v)
    from gstest4 group by grouping sets ((unhashable_col),(unsortable_col))
   order by 3,5;

explain (format json) 
  select a, b, sum(v), count(*) from gstest_empty group by grouping sets ((a,b),(),(),());
