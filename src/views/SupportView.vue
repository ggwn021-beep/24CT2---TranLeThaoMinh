<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const allMessages = ref([])
const reviews = ref([])
const selectedId = ref(null)
const reply = ref('')
const chatBox = ref(null)
let timer

const threads = computed(() => {
  const map = {}
  for (const m of allMessages.value) map[m.id_khach_hang] = { id: m.id_khach_hang, ten: m.ten_khach, last: m }
  return Object.values(map).sort((a, b) => b.last.id_tin_nhan - a.last.id_tin_nhan)
})
const currentMessages = computed(() => allMessages.value.filter(m => m.id_khach_hang === selectedId.value))
const currentName = computed(() => threads.value.find(t => t.id === selectedId.value)?.ten)
const avgStars = computed(() => reviews.value.length
  ? (reviews.value.reduce((s, r) => s + r.so_sao, 0) / reviews.value.length).toFixed(1) : '—')

async function loadMessages() {
  allMessages.value = await (await fetch('http://localhost:3000/api/tinnhan')).json()
  await nextTick()
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}
async function loadReviews() {
  reviews.value = await (await fetch('http://localhost:3000/api/danhgia')).json()
}
async function sendReply() {
  if (!reply.value.trim() || !selectedId.value) return
  await fetch('http://localhost:3000/api/tinnhan', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_khach_hang: selectedId.value, noi_dung: reply.value, nguoi_gui: 'staff' })
  })
  reply.value = ''
  loadMessages()
}
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n)

onMounted(() => { loadMessages(); loadReviews(); timer = setInterval(loadMessages, 5000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div>
    <header class="navbar">
      <RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink>
      <nav><RouterLink to="/">Trang chủ</RouterLink></nav>
    </header>

    <div class="page-container">
      <h2 class="section-title">Hỗ trợ khách hàng</h2>
      <div class="support-grid">
        <div class="card thread-list">
          <p v-if="threads.length === 0" class="muted pad">Chưa có khách nào nhắn tin</p>
          <div v-for="t in threads" :key="t.id" :class="['thread', { active: t.id === selectedId }]" @click="selectedId = t.id">
            <div class="name">{{ t.ten }}
              <span v-if="t.last.nguoi_gui === 'customer'" class="badge badge-orange">Chờ trả lời</span>
            </div>
            <div class="preview">{{ t.last.noi_dung }}</div>
          </div>
        </div>

        <div class="card card-pad">
          <p v-if="!selectedId" class="muted">Chọn một khách ở danh sách bên trái để xem và trả lời.</p>
          <template v-else>
            <h3 class="chat-title">{{ currentName }}</h3>
            <div class="chat-box" ref="chatBox">
              <div v-for="m in currentMessages" :key="m.id_tin_nhan" :class="['bubble', m.nguoi_gui === 'staff' ? 'me' : 'other']">
                {{ m.noi_dung }}<small>{{ m.thoi_gian?.slice(11, 16) }}</small>
              </div>
            </div>
            <div class="send-row">
              <input v-model="reply" class="input" placeholder="Nhập phản hồi..." @keyup.enter="sendReply" />
              <button class="btn btn-primary" @click="sendReply">Gửi</button>
            </div>
          </template>
        </div>
      </div>

      <h2 class="section-title">Đánh giá của khách</h2>
      <div class="stats-row" style="margin-bottom:16px">
        <div class="stat-card"><p>Điểm trung bình</p><h2>{{ avgStars }} ★</h2></div>
        <div class="stat-card"><p>Tổng số đánh giá</p><h2>{{ reviews.length }}</h2></div>
      </div>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Khách</th><th>Phòng</th><th>Điểm</th><th>Nhận xét</th><th>Ngày</th></tr></thead>
          <tbody>
            <tr v-for="r in reviews" :key="r.id_danh_gia">
              <td>{{ r.ten_khach }}</td>
              <td>{{ r.ten_phong }}</td>
              <td class="gold">{{ stars(r.so_sao) }}</td>
              <td>{{ r.binh_luan || '—' }}</td>
              <td>{{ r.ngay_danh_gia?.slice(0, 10) }}</td>
            </tr>
            <tr v-if="reviews.length === 0"><td colspan="5" class="muted" style="text-align:center">Chưa có đánh giá nào</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.muted { color: var(--color-text-light); font-size: 13px; }
.pad { padding: 16px; }
.support-grid { display: grid; grid-template-columns: 280px 1fr; gap: 16px; }
.thread-list { overflow: hidden; }
.thread { padding: 13px 16px; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
.thread:hover { background: #fafbfc; }
.thread.active { background: #fdf8ef; }
.thread .name { font-weight: 700; color: var(--color-primary); display: flex; justify-content: space-between; align-items: center; gap: 6px; }
.thread .preview { font-size: 13px; color: var(--color-text-light); margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chat-title { margin: 0 0 8px; color: var(--color-primary); }
.chat-box { height: 300px; overflow-y: auto; background: #f8fafc; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.bubble { max-width: 70%; padding: 9px 13px; border-radius: 12px; font-size: 14px; }
.bubble small { display: block; font-size: 11px; opacity: 0.7; margin-top: 3px; }
.bubble.me { align-self: flex-end; background: var(--color-primary); color: white; }
.bubble.other { align-self: flex-start; background: white; border: 1px solid var(--color-border); }
.send-row { display: flex; gap: 10px; }
.gold { color: var(--color-accent); letter-spacing: 2px; white-space: nowrap; }
</style>