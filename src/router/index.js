import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HotelDetailView from '../views/HotelDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/hotel/:id', component: HotelDetailView },
    { path: '/booking', component: () => import('../views/BookingView.vue'), meta: { requiresAuth: true } },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/staff', component: () => import('../views/StaffDashboard.vue'), meta: { requiresRole: 'staff' } },
    { path: '/admin', component: () => import('../views/AdminDashboard.vue'), meta: { requiresRole: 'admin' } },
  ]
})

router.beforeEach((to, from, next) => {
  const saved = localStorage.getItem('user')
  const user = saved ? JSON.parse(saved) : null

  if (to.meta.requiresAuth && !user) {
    alert('Vui lòng đăng nhập trước')
    return next('/login')
  }
  if (to.meta.requiresRole && (!user || user.vai_tro !== to.meta.requiresRole)) {
    alert('Bạn không có quyền truy cập trang này')
    return next('/')
  }
  next()
})

export default router