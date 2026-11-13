<!-- src/views/StaffDashboard.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchAPI } from '../utils/api' // Thêm import

const user = JSON.parse(localStorage.getItem('user'))

const bookingList = ref([])
const ca = ref(null)
const history = ref([])
const report = ref([])
const kieu = ref('ngay')
const kieuList = [{ v: 'ngay', l: 'Theo ngày' }, { v: 'thang', l: 'Theo tháng' }, { v: 'nam', l: 'Theo năm' }]

async function loadReport() { 
  try { report.value = await fetchAPI(`/api/doanhthu?kieu=${kieu.value}&id_nhan_vien=${user.id_tai_khoan}`) } 
  catch(e) { console.error(e) }
}
async function loadAll() {
  try {
    bookingList.value = await fetchAPI('/api/dondat')
    ca.value = await fetchAPI(`/api/ca/hien-tai/${user.id_tai_khoan}`)
    history.value = await fetchAPI(`/api/ca?id_nhan_vien=${user.id_tai_khoan}`)
    await loadReport()
  } catch(e) { console.error(e) }
}
function chonKieu(v) { kieu.value = v; loadReport() }

async function startShift() { 
  try { await fetchAPI('/api/ca/bat-dau', { method: 'POST' }); loadAll() } 
  catch(e) { alert(e.message) }
}
async function endShift() {
  if (!confirm('Kết thúc ca làm việc?')) return
  try {
    const data = await fetchAPI(`/api/ca/${ca.value.id_ca}/ket-thuc`, { method: 'PUT' })
    alert(`Đã kết thúc ca.\nTổng thu trong ca: ${Number(data.tong_doanh_thu).toLocaleString()}đ`); 
    loadAll() 
  } catch(e) { alert(e.message) }
}
async function confirmPayment(b) { 
  try { await fetchAPI(`/api/dondat/${b.id_don}/xacnhan-thanhtoan`, { method: 'PUT' }); loadAll() } 
  catch(e) { alert(e.message) }
}
async function checkIn(b) { 
  try { await fetchAPI(`/api/dondat/${b.id_don}/checkin`, { method: 'PUT' }); loadAll() } 
  catch(e) { alert(e.message) }
}
async function checkOut(b) { 
  try { await fetchAPI(`/api/dondat/${b.id_don}/checkout`, { method: 'PUT' }); loadAll() } 
  catch(e) { alert(e.message) }
}

const totalPending = computed(() => bookingList.value.filter(b => b.trang_thai_don === 'Chờ duyệt').length)
const maxRevenue = computed(() => Math.max(1, ...report.value.map(r => Number(r.doanh_thu))))
function badgeClass(t) {
  return { 'Chờ duyệt': 'badge-orange', 'Đã xác nhận': 'badge-blue', 'Đã check-in': 'badge-green', 'Đã hoàn tất': 'badge-gray', 'Đã hủy': 'badge-red' }[t] || 'badge-gray'
}

onMounted(loadAll)
</script>

<template>
  <div>
    <header class="navbar">
      <RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink>
      <nav>
        <RouterLink to="/support">Hỗ trợ khách</RouterLink>
        <RouterLink to="/">Trang chủ</RouterLink>
      </nav>
    </header>

    <div class="page-container">
      <div class="top-row">
        <h1 class="title">Staff Dashboard</h1>
        <div class="shift-box">
          <span :class="['badge', ca ? 'badge-green' : 'badge-gray']">
            {{ ca ? `Đang trong ca (từ ${ca.gio_bat_dau.slice(11, 16)})` : 'Chưa bắt đầu ca' }}
          </span>
          <button v-if="!ca" class="btn btn-primary btn-sm" @click="startShift">Bắt đầu ca</button>
          <button v-else class="btn btn-danger btn-sm" @click="endShift">Kết thúc ca</button>
        </div>
      </div>
      <p v-if="!ca" class="warn">Bạn cần bấm "Bắt đầu ca" trước khi xác nhận thu tiền.</p>

      <div class="stats-row">
        <div class="stat-card"><p>Đơn chờ duyệt</p><h2>{{ totalPending }}</h2></div>
        <div class="stat-card"><p>Đã thu trong ca</p><h2>{{ Number(ca ? ca.tong_doanh_thu : 0).toLocaleString() }}đ</h2></div>
      </div>

      <h2 class="section-title">Danh sách đơn đặt phòng</h2>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Khách</th><th>Phòng</th><th>Ngày ở</th><th>Tiền</th><th>Trạng thái</th><th>Phương thức</th><th>Thao tác</th></tr></thead>
          <tbody>
            <tr v-for="b in bookingList" :key="b.id_don">
              <td>{{ b.ten_khach }}</td>
              <td>{{ b.ten_phong }}<br /><small class="muted">{{ b.loai_phong }}</small></td>
              <td>{{ b.ngay_nhan_phong }} → {{ b.ngay_tra_phong }}</td>
              <td>{{ Number(b.tong_tien).toLocaleString() }}đ</td>
              <td><span :class="['badge', badgeClass(b.trang_thai_don)]">{{ b.trang_thai_don }}</span></td>
              <td>{{ b.phuong_thuc_thanh_toan }}</td>
              <td>
                <div class="actions">
                  <button v-if="b.trang_thai_don === 'Chờ duyệt'" class="btn btn-success btn-sm" :disabled="!ca" @click="confirmPayment(b)">Xác nhận TT</button>
                  <button v-if="b.trang_thai_don === 'Đã xác nhận'" class="btn btn-primary btn-sm" @click="checkIn(b)">Check-in</button>
                  <button v-if="b.trang_thai_don === 'Đã check-in'" class="btn btn-outline btn-sm" @click="checkOut(b)">Check-out</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Doanh thu của tôi</h2>
      <div class="tabs">
        <button v-for="k in kieuList" :key="k.v" :class="['btn btn-sm', kieu === k.v ? 'btn-primary' : 'btn-outline']" @click="chonKieu(k.v)">{{ k.l }}</button>
      </div>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Kỳ</th><th>Số đơn</th><th>Doanh thu</th><th></th></tr></thead>
          <tbody>
            <tr v-for="r in report" :key="r.ky">
              <td>{{ r.ky }}</td>
              <td>{{ r.so_don }}</td>
              <td>{{ Number(r.doanh_thu).toLocaleString() }}đ</td>
              <td><div class="bar"><div class="bar-fill" :style="{ width: (Number(r.doanh_thu) / maxRevenue * 100) + '%' }"></div></div></td>
            </tr>
            <tr v-if="report.length === 0"><td colspan="4" class="muted" style="text-align:center">Chưa có khoản thu nào</td></tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Lịch sử ca làm của tôi</h2>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Bắt đầu</th><th>Kết thúc</th><th>Thu trong ca</th></tr></thead>
          <tbody>
            <tr v-for="h in history" :key="h.id_ca">
              <td>{{ h.gio_bat_dau.slice(0, 16) }}</td>
              <td>{{ h.gio_ket_thuc ? h.gio_ket_thuc.slice(0, 16) : 'Đang mở' }}</td>
              <td>{{ Number(h.tong_doanh_thu).toLocaleString() }}đ</td>
            </tr>
            <tr v-if="history.length === 0"><td colspan="3" class="muted" style="text-align:center">Chưa có ca nào</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 12px; }
.title { color: var(--color-primary); margin: 0; }
.shift-box { display: flex; align-items: center; gap: 12px; }
.warn { background: #fef3c7; color: #92400e; padding: 10px 14px; border-radius: 9px; font-size: 14px; margin: 0 0 16px; }
.actions { display: flex; gap: 6px; flex-wrap: wrap; }
.tabs { display: flex; gap: 8px; margin-bottom: 14px; }
.bar { background: #f1f5f9; border-radius: 6px; height: 10px; min-width: 120px; }
.bar-fill { background: var(--color-accent); height: 10px; border-radius: 6px; }
.muted { color: var(--color-text-light); font-size: 13px; }
</style>