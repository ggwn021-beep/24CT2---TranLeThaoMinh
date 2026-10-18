<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const user = JSON.parse(localStorage.getItem('user'))
const orders = ref([])
const messages = ref([])
const newMsg = ref('')
const reviewing = ref(null)
const review = ref({ so_sao: 5, binh_luan: '' })
const chatBox = ref(null)
let timer

async function loadOrders() {
  orders.value = await (await fetch(`http://localhost:3000/api/dondat/khach/${user.id_tai_khoan}`)).json()
}
async function loadMessages() {
  messages.value = await (await fetch(`http://localhost:3000/api/tinnhan/khach/${user.id_tai_khoan}`)).json()
  await nextTick()
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}
async function cancelOrder(o) {
  if (!confirm('Bạn chắc chắn muốn hủy đơn này?')) return
  const res = await fetch(`http://localhost:3000/api/dondat/${o.id_don}/huy`, { method: 'PUT' })
  const data = await res.json()
  if (!res.ok) return alert(data.error)
  loadOrders()
}
function openReview(o) { reviewing.value = o; review.value = { so_sao: 5, binh_luan: '' } }
async function submitReview() {
  await fetch('http://localhost:3000/api/danhgia', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_don: reviewing.value.id_don, so_sao: review.value.so_sao, binh_luan: review.value.binh_luan })
  })
  reviewing.value = null
  alert('Cảm ơn bạn đã đánh giá!')
  loadOrders()
}
async function sendMsg() {
  if (!newMsg.value.trim()) return
  await fetch('http://localhost:3000/api/tinnhan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_khach_hang: user.id_tai_khoan, noi_dung: newMsg.value, nguoi_gui: 'customer' })
  })
  newMsg.value = ''
  loadMessages()
}
function badgeClass(t) {
  return { 'Chờ duyệt': 'badge-orange', 'Đã xác nhận': 'badge-blue', 'Đã check-in': 'badge-green', 'Đã hoàn tất': 'badge-gray', 'Đã hủy': 'badge-red' }[t] || 'badge-gray'
}

onMounted(() => { loadOrders(); loadMessages(); timer = setInterval(loadMessages, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div>
    <header class="navbar">
      <RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink>
      <nav><RouterLink to="/">Trang chủ</RouterLink></nav>
    </header>

    <div class="page-container">
      <h2 class="section-title">Đơn đặt phòng của tôi</h2>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Phòng</th><th>Ngày ở</th><th>Tiền</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <tr v-for="o in orders" :key="o.id_don">
              <td>{{ o.ten_phong }}<br /><small class="muted">{{ o.loai_phong }}</small></td>
              <td>{{ o.ngay_nhan_phong }} → {{ o.ngay_tra_phong }}</td>
              <td>{{ Number(o.tong_tien).toLocaleString() }}đ</td>
              <td><span :class="['badge', badgeClass(o.trang_thai_don)]">{{ o.trang_thai_don }}</span></td>
              <td>
                <button v-if="o.trang_thai_don === 'Chờ duyệt'" class="btn btn-danger btn-sm" @click="cancelOrder(o)">Hủy đơn</button>
                <button v-if="o.trang_thai_don === 'Đã hoàn tất' && !o.da_danh_gia" class="btn btn-primary btn-sm" @click="openReview(o)">Đánh giá</button>
                <span v-if="o.da_danh_gia" class="muted">Đã đánh giá ✓</span>
              </td>
            </tr>
            <tr v-if="orders.length === 0"><td colspan="5" class="muted" style="text-align:center">Bạn chưa có đơn đặt phòng nào</td></tr>
          </tbody>
        </table>
      </div>

      <div v-if="reviewing" class="card card-pad review-box">
        <h3>Đánh giá: {{ reviewing.ten_phong }}</h3>
        <div class="stars">
          <span v-for="n in 5" :key="n" :class="['star', { on: n <= review.so_sao }]" @click="review.so_sao = n">★</span>
        </div>
        <textarea v-model="review.binh_luan" class="input" rows="3" placeholder="Chia sẻ trải nghiệm của bạn..."></textarea>
        <div class="row">
          <button class="btn btn-primary" @click="submitReview">Gửi đánh giá</button>
          <button class="btn btn-outline" @click="reviewing = null">Đóng</button>
        </div>
      </div>

      <h2 class="section-title">Hỗ trợ & góp ý</h2>
      <div class="card card-pad">
        <p class="muted">Cần gọi thêm dịch vụ, báo sự cố trong phòng hay muốn khiếu nại? Nhắn trực tiếp cho lễ tân tại đây.</p>
        <div class="chat-box" ref="chatBox">
          <p v-if="messages.length === 0" class="muted">Chưa có tin nhắn nào. Hãy gửi câu hỏi đầu tiên!</p>
          <div v-for="m in messages" :key="m.id_tin_nhan" :class="['bubble', m.nguoi_gui === 'customer' ? 'me' : 'other']">
            {{ m.noi_dung }}
            <small>{{ m.nguoi_gui === 'staff' ? 'Lễ tân · ' : '' }}{{ m.thoi_gian?.slice(11, 16) }}</small>
          </div>
        </div>
        <div class="send-row">
          <input v-model="newMsg" class="input" placeholder="Nhập tin nhắn..." @keyup.enter="sendMsg" />
          <button class="btn btn-primary" @click="sendMsg">Gửi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muted { color: var(--color-text-light); font-size: 13px; }
.review-box { margin-top: 16px; }
.review-box h3 { margin: 0 0 8px; color: var(--color-primary); }
.stars { font-size: 32px; cursor: pointer; margin-bottom: 10px; }
.star { color: #d1d5db; }
.star.on { color: var(--color-accent); }
.row { display: flex; gap: 10px; margin-top: 12px; }
.chat-box { height: 280px; overflow-y: auto; background: #f8fafc; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
.bubble { max-width: 70%; padding: 9px 13px; border-radius: 12px; font-size: 14px; }
.bubble small { display: block; font-size: 11px; opacity: 0.7; margin-top: 3px; }
.bubble.me { align-self: flex-end; background: var(--color-primary); color: white; }
.bubble.other { align-self: flex-start; background: white; border: 1px solid var(--color-border); }
.send-row { display: flex; gap: 10px; }
</style>