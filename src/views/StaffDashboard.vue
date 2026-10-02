<script setup>
import { ref, onMounted, computed } from 'vue'

const bookingList = ref([])
const isShiftActive = ref(false)
const shiftStart = ref(null)
const collectedToday = ref(0)

async function loadBookings() {
  const res = await fetch('http://localhost:3000/api/dondat')
  bookingList.value = await res.json()
}

function startShift() {
  isShiftActive.value = true
  shiftStart.value = new Date().toLocaleTimeString()
  collectedToday.value = 0
}

function endShift() {
  alert(`Kết thúc ca. Tổng thu trong ca: ${collectedToday.value.toLocaleString()}đ`)
  isShiftActive.value = false
}

async function confirmPayment(b) {
  await fetch(`http://localhost:3000/api/dondat/${b.id_don}/xacnhan-thanhtoan`, { method: 'PUT' })
  b.trang_thai_don = 'Đã xác nhận'
  collectedToday.value += Number(b.tong_tien)
}

async function checkIn(b) {
  if (b.trang_thai_don !== 'Đã xác nhận') { alert('Cần xác nhận thanh toán trước khi check-in!'); return }
  await fetch(`http://localhost:3000/api/dondat/${b.id_don}/checkin`, { method: 'PUT' })
  b.trang_thai_don = 'Đã check-in'
}

async function checkOut(b) {
  await fetch(`http://localhost:3000/api/dondat/${b.id_don}/checkout`, { method: 'PUT' })
  b.trang_thai_don = 'Đã hoàn tất'
}

const totalPending = computed(() => bookingList.value.filter(b => b.trang_thai_don === 'Chờ duyệt').length)

onMounted(loadBookings)
</script>

<template>
  <div class="page">
    <header class="staff-header">
      <h1>👤 Staff Dashboard</h1>
      <div class="shift-box">
        <span v-if="isShiftActive">🟢 Đang trong ca (từ {{ shiftStart }})</span>
        <span v-else>🔴 Chưa bắt đầu ca</span>
        <button v-if="!isShiftActive" @click="startShift" class="btn-start">Bắt đầu ca</button>
        <button v-else @click="endShift" class="btn-end">Kết thúc ca</button>
      </div>
    </header>

    <div class="stats">
      <div class="stat-card"><p>Đơn chờ duyệt</p><h2>{{ totalPending }}</h2></div>
      <div class="stat-card"><p>Đã thu trong ca</p><h2>{{ collectedToday.toLocaleString() }}đ</h2></div>
    </div>

    <h3>Danh sách đơn đặt phòng</h3>
    <table class="booking-table">
      <thead><tr><th>Khách</th><th>Phòng</th><th>Ngày ở</th><th>Tiền</th><th>Trạng thái</th><th>Phương thức</th><th>Thao tác</th></tr></thead>
      <tbody>
        <tr v-for="b in bookingList" :key="b.id_don">
          <td>{{ b.ten_khach }}</td>
          <td>{{ b.ten_phong }}<br /><small>{{ b.loai_phong }}</small></td>
          <td>{{ b.ngay_nhan_phong }} → {{ b.ngay_tra_phong }}</td>
          <td>{{ Number(b.tong_tien).toLocaleString() }}đ</td>
          <td><span class="badge">{{ b.trang_thai_don }}</span></td>
          <td>{{ b.phuong_thuc_thanh_toan }}</td>
          <td class="actions">
            <button v-if="b.trang_thai_don === 'Chờ duyệt'" @click="confirmPayment(b)" class="btn-sm">Xác nhận TT</button>
            <button v-if="b.trang_thai_don === 'Đã xác nhận'" @click="checkIn(b)" class="btn-sm blue">Check-in</button>
            <button v-if="b.trang_thai_don === 'Đã check-in'" @click="checkOut(b)" class="btn-sm gray">Check-out</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 20px; }
.staff-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.shift-box { display: flex; align-items: center; gap: 12px; }
.btn-start { background: #16a34a; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-end { background: #dc2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.stats { display: flex; gap: 15px; margin-bottom: 25px; }
.stat-card { background: white; padding: 15px 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.stat-card h2 { color: #2563eb; }
.booking-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; }
.booking-table th, .booking-table td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
.booking-table th { background: #f1f5f9; }
.badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; color: white; background: #f59e0b; }
.actions { display: flex; gap: 6px; }
.btn-sm { padding: 5px 10px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; background: #16a34a; color: white; }
.btn-sm.blue { background: #2563eb; } .btn-sm.gray { background: #6b7280; }
</style>