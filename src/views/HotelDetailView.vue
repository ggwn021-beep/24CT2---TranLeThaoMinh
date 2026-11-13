<script setup>
import { ref, onMounted } from 'vue'
import { fetchAPI } from '../utils/api'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const room = ref(null)
const loading = ref(true)

const roomImages = {
  VIP: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&q=80',
  Standard: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1000&q=80',
  Resort: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1000&q=80'
}

async function loadRoom() {
  try {
    room.value = await fetchAPI(`/api/phong/${route.params.id}`)
  } catch { 
    room.value = null 
  } finally { 
    loading.value = false 
  }
}

function bookRoom() {
  router.push({ path: '/booking', query: { roomId: room.value.id_phong, roomType: room.value.loai_phong, price: room.value.gia_dem } })
}

onMounted(loadRoom)
</script>

<template>
  <div>
    <header class="navbar"><RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink><nav><RouterLink to="/">← Về trang chủ</RouterLink></nav></header>

    <div class="page-container narrow" v-if="room">
      <div class="banner" :style="{ backgroundImage: `url(${roomImages[room.loai_phong] || roomImages.Standard})` }"></div>
      <div class="card card-pad">
        <span class="room-type">{{ room.loai_phong }}</span>
        <h1>{{ room.ten_phong }}</h1>
        <p class="price">{{ Number(room.gia_dem).toLocaleString() }}đ <span>/ đêm</span></p>
        <span :class="['badge', room.trang_thai === 'Sẵn sàng' ? 'badge-green' : 'badge-orange']">{{ room.trang_thai }}</span>

        <button class="btn btn-primary btn-block" style="margin-top:24px" @click="bookRoom" :disabled="room.trang_thai !== 'Sẵn sàng'">
          {{ room.trang_thai === 'Sẵn sàng' ? 'Đặt ngay' : 'Phòng không khả dụng' }}
        </button>
      </div>
    </div>
    <div class="page-container narrow" v-else-if="!loading">
      <p>Không tìm thấy phòng này.</p>
      <RouterLink to="/">← Về trang chủ</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.banner { height: 260px; border-radius: var(--radius); background-size: cover; background-position: center; margin-bottom: -40px; box-shadow: var(--shadow); }
.card { position: relative; margin-top: 60px; }
.room-type { font-size: 11.5px; color: var(--color-accent-dark); font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; }
h1 { color: var(--color-primary); margin: 8px 0 6px; font-size: 24px; }
.price { color: var(--color-primary); font-weight: 800; font-size: 22px; margin: 0 0 12px; }
.price span { color: var(--color-text-light); font-weight: 400; font-size: 14px; }
</style>