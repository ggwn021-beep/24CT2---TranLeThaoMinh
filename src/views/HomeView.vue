<script setup>
import { ref, onMounted } from 'vue'
import { fetchAPI } from '../utils/api'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '../components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const rooms = ref([])

const roomImages = {
  VIP: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
  Standard: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
  Resort: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80'
}
const getImage = (loai) => roomImages[loai] || roomImages.Standard

async function loadRooms() {
  try {
    rooms.value = await fetchAPI('/api/phong')
  } catch(e) { console.error(e) }
}

onMounted(loadRooms)
</script>

<template>
  <div>
    <NavBar />
    <p v-if="route.query.denied" class="denied">Bạn không có quyền truy cập trang đó.</p>

    <section class="hero">
      <h1>Nghỉ dưỡng đẳng cấp, đặt phòng chỉ trong vài giây</h1>
      <p>Trải nghiệm không gian sang trọng, dịch vụ tận tâm tại Sunrise Hotel & Resort</p>
    </section>

    <div class="page-container">
      <h2 class="section-title">Các loại phòng</h2>
      <div class="room-grid">
        <div v-for="room in rooms" :key="room.id_phong" class="room-card" @click="router.push(`/hotel/${room.id_phong}`)">
          <div class="room-img" :style="{ backgroundImage: `url(${getImage(room.loai_phong)})` }">
            <span :class="['badge', room.trang_thai === 'Sẵn sàng' ? 'badge-green' : 'badge-orange']">{{ room.trang_thai }}</span>
          </div>
          <div class="room-body">
            <span class="room-type">{{ room.loai_phong }}</span>
            <h3>{{ room.ten_phong }}</h3>
            <p class="price">{{ Number(room.gia_dem).toLocaleString() }}đ <span>/ đêm</span></p>
          </div>
        </div>
      </div>
      <p v-if="rooms.length === 0" class="empty">Hiện chưa có phòng nào, vui lòng quay lại sau.</p>
    </div>
  </div>
</template>

<style scoped>
.denied { background: #fef3c7; color: #92400e; text-align: center; padding: 10px; margin: 0; font-size: 14px; }
.room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 22px; }
.room-card { background: white; border-radius: var(--radius); overflow: hidden; cursor: pointer; box-shadow: var(--shadow); transition: transform 0.25s, box-shadow 0.25s; }
.room-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-hover); }
.room-img { height: 180px; background-size: cover; background-position: center; position: relative; }
.room-img .badge { position: absolute; top: 12px; right: 12px; }
.room-body { padding: 18px; }
.room-type { font-size: 11.5px; color: var(--color-accent-dark); font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; }
.room-body h3 { margin: 6px 0 10px; color: var(--color-primary); font-size: 17px; }
.price { color: var(--color-primary); font-weight: 800; font-size: 19px; margin: 0; }
.price span { color: var(--color-text-light); font-weight: 400; font-size: 13px; }
.empty { text-align: center; color: var(--color-text-light); padding: 40px 0; }
</style>