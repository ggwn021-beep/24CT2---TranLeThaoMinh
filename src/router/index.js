import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HotelDetailView from '../views/HotelDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/hotel/:id', component: HotelDetailView },
    { path: '/login', component: () => import('../views/LoginView.vue'), meta: { guestOnly: true } },
    { path: '/register', component: () => import('../views/RegisterView.vue'), meta: { guestOnly: true } },
    { path: '/profile', component: () => import('../views/ProfileView.vue'), meta: { requiresAuth: true } },
    { path: '/booking', component: () => import('../views/BookingView.vue'), meta: { roles: ['customer'] } },
    { path: '/account', component: () => import('../views/AccountView.vue'), meta: { roles: ['customer'] } },
    { path: '/support', component: () => import('../views/SupportView.vue'), meta: { roles: ['staff', 'admin'] } },
    { path: '/staff', component: () => import('../views/StaffDashboard.vue'), meta: { roles: ['staff'] } },
    { path: '/admin', component: () => import('../views/AdminDashboard.vue'), meta: { roles: ['admin'] } },
  ]
})

router.beforeEach((to) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  if (to.meta.guestOnly && user) return '/'
  if ((to.meta.requiresAuth || to.meta.roles) && !user) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.roles && !to.meta.roles.includes(user.vai_tro)) return { path: '/', query: { denied: '1' } }
  return true
})

export default router