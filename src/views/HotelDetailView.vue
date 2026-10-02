<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const room = ref(null)
const loading = ref(true)

async function loadRoom() {
  try {
    const res = await fetch(`http://localhost:3000/api/phong/${route.params.id}`)
    if (!res.ok) throw new Error('Không tìm thấy phòng')
    room.value = await res.json()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function bookRoom() {
  router.push({
    path: '/booking',
    query: { roomId: room.value.id_phong, roomType: room.value.loai_phong, price: room.value.gia_dem }
  })
}

onMounted(loadRoom)
</script>

<template>
  <div class="page" v-if="room">
    <h1>{{ room.ten_phong }}</h1>
    <p>Loại phòng: {{ room.loai_phong }}</p>
    <p class="price">{{ Number(room.gia_dem).toLocaleString() }}đ / đêm</p>
    <span :class="['badge', room.trang_thai === 'Sẵn sàng' ? 'green' : 'orange']">{{ room.trang_thai }}</span>

    <button class="book-btn" @click="bookRoom" :disabled="room.trang_thai !== 'Sẵn sàng'">
      {{ room.trang_thai === 'Sẵn sàng' ? 'Đặt ngay' : 'Phòng không khả dụng' }}
    </button>
  </div>
  <div class="page" v-else-if="!loading">
    <p>Không tìm thấy phòng này.</p>
    <RouterLink to="/">← Về trang chủ</RouterLink>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; padding: 20px; }
.price { color: #2563eb; font-weight: bold; font-size: 18px; margin: 10px 0; }
.badge { padding: 4px 12px; border-radius: 12px; font-size: 13px; color: white; }
.badge.green { background: #16a34a; } .badge.orange { background: #f59e0b; }
.book-btn { display: block; margin-top: 20px; width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 15px; }
.book-btn:disabled { background: #9ca3af; cursor: not-allowed; }
</style>