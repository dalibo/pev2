import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';
import Plan from './views/Plan.vue';
import About from './views/About.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/plan',
      name: 'plan',
      component: Plan,
    },
    {
      path: '/about',
      name: 'about',
      component: About,
    },
  ],
});
