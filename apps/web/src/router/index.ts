import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/run',
      name: 'run',
      component: () => import('@/pages/Run.vue')
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/pages/Result.vue')
    }
  ]
})

export default router