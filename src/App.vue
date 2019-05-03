<template>
  <div id="app">
    <div class="container">
      <form v-on:submit.prevent="submitPlan">
        <div class="form-group">
          <label for="planInput">Plan</label>
          <textarea class="form-control" id="planInput" rows="3" v-model="planInput"></textarea>
        </div>
        <div class="form-group">
          <label for="queryInput">Query</label>
          <textarea class="form-control" id="queryInput" rows="3" v-model="queryInput"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
    <p v-if="validationMessage" class="alert alert-danger">{{validationMessage}}</p>
    <Plan :plan-json="planJson" :plan-query="planQuery" v-if="planJson"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Plan from './components/Plan.vue';

import SAMPLE_JSON from './plan.json';
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

@Component({
  components: {
    Plan,
  },
})
export default class App extends Vue {
  private planJson: any = null;
  private planQuery: string = '';
  private planInput: string = JSON.stringify(SAMPLE_JSON, null, '  ');
  private queryInput: string = SAMPLE_QUERY;
  private validationMessage: string = '';

  private submitPlan(): void {
    try {
      this.planJson = JSON.parse(this.planInput);
      this.validationMessage = '';
    } catch (e) {
      this.validationMessage = 'The string you submitted is not valid JSON';
      return;
    }

    this.planQuery = this.queryInput;
  }
}
</script>
