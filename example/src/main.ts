import Vue from 'vue';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './views/Home.vue';
import Plan from './views/Plan.vue';
import About from './views/About.vue';

const routes = {
  '/': Home,
  '/plan': Plan,
  '/about': About,
};

export const planData: any[] = ['', ''];

Vue.config.productionTip = false;

export function setPlanData(plan, query) {
  planData[0] = plan;
  planData[1] = query;
  app.currentRoute = '/plan';
}

global.setPlanData = setPlanData;

const app = new Vue({
  data: {
    currentRoute: '/',
  },
  computed: {
    ViewComponent() {
      return routes[this.currentRoute];
    },
  },
  render(h) {
    return h(this.ViewComponent);
  },
}).$mount('#app');
