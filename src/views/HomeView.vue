<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const rooms = ref([])
const user = ref(null)

const roomImages = {
  VIP: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
  Standard: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&q=80',
  Resort: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80'
}
function getImage(loai) { return roomImages[loai] || roomImages.Standard }

async function loadRooms() {
  const res = await fetch('http://localhost:3000/api/phong')
  rooms.value = await res.json()
}

function goToDetail(id) { router.push(`/hotel/${id}`) }
function logout() {
  localStorage.removeItem('user')
  user.value = null
  router.push('/')
}

onMounted(() => {
  loadRooms()
  const saved = localStorage.getItem('user')
  if (saved) user.value = JSON.parse(saved)
})
</script>

<template>
  <div class="site">
    <header class="navbar">
      <div class="logo">🏨 <span>Sunrise Hotel & Resort</span></div>
      <nav class="nav-links">
        <template v-if="!user">
          <RouterLink to="/login">Đăng nhập</RouterLink>
        </template>
        <template v-else>
          <RouterLink v-if="user.vai_tro === 'staff'" to="/staff">Staff Dashboard</RouterLink>
          <RouterLink v-if="user.vai_tro === 'admin'" to="/admin">Admin Dashboard</RouterLink>
          <span class="hello">Xin chào, {{ user.ho_ten }}</span>
          <button class="logout-btn" @click="logout">Đăng xuất</button>
        </template>
      </nav>
    </header>

    <section class="hero">
      <h1>Nghỉ dưỡng đẳng cấp, đặt phòng chỉ trong vài giây</h1>
      <p>Trải nghiệm không gian sang trọng, dịch vụ tận tâm tại Sunrise Hotel & Resort</p>
    </section>

    <section class="rooms-section">
      <h2>Các loại phòng</h2>
      <div class="hotel-grid">
        <div v-for="room in rooms" :key="room.id_phong" class="hotel-card" @click="goToDetail(room.id_phong)">
          <div class="card-img" :style="{ backgroundImage: `url(${getImage(room.loai_phong)})` }">
            <span :class="['badge', room.trang_thai === 'Sẵn sàng' ? 'green' : 'orange']">{{ room.trang_thai }}</span>
          </div>
          <div class="hotel-info">
            <span class="room-type">{{ room.loai_phong }}</span>
            <h3>{{ room.ten_phong }}</h3>
            <p class="price">{{ Number(room.gia_dem).toLocaleString() }}đ <span>/ đêm</span></p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.site { font-family: 'Segoe UI', Arial, sans-serif; }
.navbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 40px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 10; }
.logo { font-size: 20px; font-weight: 700; color: #1e3a8a; display: flex; align-items: center; gap: 8px; }
.nav-links { display: flex; align-items: center; gap: 18px; }
.nav-links a { text-decoration: none; color: #1e3a8a; font-weight: 600; }
.hello { color: #555; font-size: 14px; }
.logout-btn { background: #f1f5f9; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; color: #dc2626; font-weight: 600; }

.hero { text-align: center; padding: 70px 20px; background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; }
.hero h1 { font-size: 34px; margin-bottom: 12px; }
.hero p { font-size: 16px; opacity: 0.9; }

.rooms-section { max-width: 1150px; margin: 0 auto; padding: 50px 20px; }
.rooms-section h2 { margin-bottom: 25px; color: #1e293b; }
.hotel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.hotel-card { background: white; border-radius: 14px; overflow: hidden; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.08); transition: transform 0.25s, box-shadow 0.25s; }
.hotel-card:hover { transform: translateY(-6px); box-shadow: 0 10px 24px rgba(0,0,0,0.14); }
.card-img { height: 170px; background-size: cover; background-position: center; position: relative; }
.badge { position: absolute; top: 12px; right: 12px; padding: 4px 12px; border-radius: 20px; font-size: 12px; color: white; font-weight: 600; }
.badge.green { background: #16a34a; } .badge.orange { background: #f59e0b; }
.hotel-info { padding: 18px; }
.room-type { font-size: 12px; color: #2563eb; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.hotel-info h3 { margin: 6px 0 10px; color: #1e293b; }
.price { color: #1e3a8a; font-weight: 700; font-size: 18px; }
.price span { color: #94a3b8; font-weight: 400; font-size: 13px; }
</style>