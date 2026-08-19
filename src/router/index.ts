import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/AccountHomeView.vue'),
    meta: { title: 'Trovara Farm Account' },
  },
  {
    path: '/verify-email',
    name: 'verify-email',
    component: () => import('../views/VerifyEmailView.vue'),
    meta: { title: 'Verify email - Trovara Farm Account' },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { title: 'Reset password - Trovara Farm Account' },
  },
  { path: '/shop', redirect: (to) => ({ path: '/', query: to.query, hash: to.hash }) },
  {
    path: '/shop/verify-email',
    redirect: (to) => ({ path: '/verify-email', query: to.query, hash: to.hash }),
  },
  {
    path: '/shop/reset-password',
    redirect: (to) => ({ path: '/reset-password', query: to.query, hash: to.hash }),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0, left: 0 }
  },
  routes,
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'Trovara Farm Account'
  document.title = title
})

export default router
