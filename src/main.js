import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const API = 'http://localhost:3000'
const fetchGoc = window.fetch.bind(window)

window.fetch = async (url, options = {}) => {
  if (!String(url).startsWith(API)) return fetchGoc(url, options)
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const headers = { ...(options.headers || {}) }
  if (user && user.token) headers.Authorization = `Bearer ${user.token}`
  const res = await fetchGoc(url, { ...options, headers })
  if (res.status === 401 && user && !String(url).includes('/api/login')) {
    localStorage.removeItem('user')
    router.push({ path: '/login', query: { expired: '1' } })
  }
  return res
}

createApp(App).use(router).mount('#app')