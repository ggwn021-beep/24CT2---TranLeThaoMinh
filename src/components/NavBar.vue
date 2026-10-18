<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const open = ref(false)
const root = ref(null)

const initial = computed(() => (user.value?.ho_ten || '?').trim().charAt(0).toUpperCase())
const roleLabel = computed(() => ({ customer: 'Khách hàng', staff: 'Lễ tân', admin: 'Quản trị viên' })[user.value?.vai_tro] || '')
const links = computed(() => {
  const r = user.value?.vai_tro
  const list = [{ to: '/profile', text: 'Hồ sơ của tôi' }]
  if (r === 'customer') list.push({ to: '/account', text: 'Đơn đặt phòng & hỗ trợ' })
  if (r === 'staff') list.push({ to: '/staff', text: 'Bảng điều khiển lễ tân' }, { to: '/support', text: 'Hỗ trợ khách hàng' })
  if (r === 'admin') list.push({ to: '/admin', text: 'Bảng điều khiển quản trị' }, { to: '/support', text: 'Hỗ trợ & đánh giá' })
  return list
})

function go(to) { open.value = false; router.push(to) }
function logout() { localStorage.removeItem('user'); user.value = null; open.value = false; router.push('/') }
function clickNgoai(e) { if (root.value && !root.value.contains(e.target)) open.value = false }

onMounted(() => document.addEventListener('click', clickNgoai))
onUnmounted(() => document.removeEventListener('click', clickNgoai))
</script>

<template>
  <header class="navbar">
    <RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink>
    <nav>
      <template v-if="!user">
        <RouterLink to="/login">Đăng nhập</RouterLink>
        <RouterLink to="/register" class="highlight">Đăng ký</RouterLink>
      </template>
      <div v-else ref="root" class="user-menu">
        <button class="user-btn" @click="open = !open">
          <span class="avatar">{{ initial }}</span>
          <span class="uname">{{ user.ho_ten }}</span>
          <span>▾</span>
        </button>
        <div v-if="open" class="dropdown">
          <div class="dd-head"><strong>{{ user.ho_ten }}</strong><small>{{ roleLabel }}</small></div>
          <button v-for="l in links" :key="l.to + l.text" class="dd-item" @click="go(l.to)">{{ l.text }}</button>
          <button class="dd-item danger" @click="logout">Đăng xuất</button>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.user-menu { position: relative; }
.user-btn { display: flex; align-items: center; gap: 10px; background: white; border: 1.5px solid var(--color-border); border-radius: 999px; padding: 5px 14px 5px 6px; cursor: pointer; color: var(--color-primary); }
.avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: white; display: grid; place-items: center; font-weight: 800; }
.uname { font-weight: 600; font-size: 14px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dropdown { position: absolute; right: 0; top: calc(100% + 8px); background: white; border-radius: 12px; box-shadow: var(--shadow-hover); min-width: 250px; padding: 6px; z-index: 30; }
.dd-head { padding: 10px 12px 8px; border-bottom: 1px solid var(--color-border); margin-bottom: 4px; display: flex; flex-direction: column; }
.dd-head small { color: var(--color-text-light); }
.dd-item { display: block; width: 100%; text-align: left; background: none; border: none; padding: 10px 12px; border-radius: 8px; cursor: pointer; font-size: 14px; color: var(--color-text); }
.dd-item:hover { background: #f1f5f9; }
.dd-item.danger { color: var(--color-danger); }
</style>