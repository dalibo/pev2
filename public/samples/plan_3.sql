SELECT feature_name, tags->'tourism' As tourism_type FROM ch03.paris
    WHERE ar_num = 8 AND tags?'tourism';
