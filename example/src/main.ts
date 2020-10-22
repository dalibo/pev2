import Vue from 'vue';
import App, { planData } from './App.vue';
import router from './router';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.css';

Vue.config.productionTip = false;

export function setPlanData (plan, query) {
  planData[0] = plan;
  planData[1] = query;
  router.push({ path: 'plan' });
};

global.setPlanData = setPlanData;

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
