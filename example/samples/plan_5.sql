SELECT c.state,
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
ORDER BY c.state, sum(o.totalamount) DESC LIMIT 10 OFFSET 1;
