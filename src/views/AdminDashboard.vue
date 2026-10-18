<script setup>
import { ref, computed, onMounted } from 'vue'

const API = 'http://localhost:3000'
const JSON_HEADERS = { 'Content-Type': 'application/json' }

const rooms = ref([])
const bookings = ref([])
const staffList = ref([])
const shifts = ref([])
const report = ref([])
const stats = ref({ doanh_thu: 0, tong_don: 0, dang_o: 0 })
const kieu = ref('ngay')
const kieuList = [{ v: 'ngay', l: 'Theo ngày' }, { v: 'thang', l: 'Theo tháng' }, { v: 'nam', l: 'Theo năm' }]

const newRoom = ref({ ten_phong: '', loai_phong: 'Standard', gia_dem: '' })
const newStaff = ref({ ho_ten: '', email: '', mat_khau: '' })
const editingId = ref(null)
const editForm = ref({})

async function getJson(url) { return (await fetch(`${API}${url}`)).json() }
async function call(url, method, body) {
  const res = await fetch(`${API}${url}`, { method, headers: JSON_HEADERS, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) { alert(data.error); return null }
  return data
}

async function loadReport() { report.value = await getJson(`/api/doanhthu?kieu=${kieu.value}`) }
async function loadAll() {
  rooms.value = await getJson('/api/phong')
  bookings.value = await getJson('/api/dondat')
  stats.value = await getJson('/api/thongke')
  staffList.value = await getJson('/api/nhanvien')
  shifts.value = await getJson('/api/ca')
  await loadReport()
}
function chonKieu(v) { kieu.value = v; loadReport() }

async function addRoom() {
  if (await call('/api/phong', 'POST', newRoom.value)) { newRoom.value = { ten_phong: '', loai_phong: 'Standard', gia_dem: '' }; loadAll() }
}
function startEdit(r) { editingId.value = r.id_phong; editForm.value = { ten_phong: r.ten_phong, loai_phong: r.loai_phong, gia_dem: Number(r.gia_dem), trang_thai: r.trang_thai } }
async function saveEdit() { if (await call(`/api/phong/${editingId.value}`, 'PUT', editForm.value)) { editingId.value = null; loadAll() } }
async function deleteRoom(id) { if (confirm('Xóa phòng này?') && await call(`/api/phong/${id}`, 'DELETE')) loadAll() }

async function addStaff() {
  if (await call('/api/nhanvien', 'POST', newStaff.value)) { newStaff.value = { ho_ten: '', email: '', mat_khau: '' }; loadAll() }
}
async function toggleLock(nv) {
  await call(`/api/nhanvien/${nv.id_tai_khoan}/${nv.trang_thai_tk === 'locked' ? 'mokhoa' : 'khoa'}`, 'PUT')
  loadAll()
}

const maxRevenue = computed(() => Math.max(1, ...report.value.map(r => Number(r.doanh_thu))))
onMounted(loadAll)
</script>

<template>
  <div>
    <header class="navbar">
      <RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink>
      <nav>
        <RouterLink to="/support">Hỗ trợ & Đánh giá</RouterLink>
        <RouterLink to="/">Trang chủ</RouterLink>
      </nav>
    </header>

    <div class="page-container">
      <h1 class="title">Admin Dashboard</h1>

      <div class="stats-row">
        <div class="stat-card"><p>Tổng doanh thu đã thu</p><h2>{{ Number(stats.doanh_thu).toLocaleString() }}đ</h2></div>
        <div class="stat-card"><p>Tổng đơn đặt</p><h2>{{ stats.tong_don }}</h2></div>
        <div class="stat-card"><p>Phòng đang có khách</p><h2>{{ stats.dang_o }}</h2></div>
      </div>

      <h2 class="section-title">Báo cáo doanh thu</h2>
      <div class="tabs">
        <button v-for="k in kieuList" :key="k.v" :class="['btn btn-sm', kieu === k.v ? 'btn-primary' : 'btn-outline']" @click="chonKieu(k.v)">{{ k.l }}</button>
      </div>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Kỳ</th><th>Số đơn</th><th>Doanh thu</th><th></th></tr></thead>
          <tbody>
            <tr v-for="r in report" :key="r.ky">
              <td>{{ r.ky }}</td><td>{{ r.so_don }}</td>
              <td>{{ Number(r.doanh_thu).toLocaleString() }}đ</td>
              <td><div class="bar"><div class="bar-fill" :style="{ width: (Number(r.doanh_thu) / maxRevenue * 100) + '%' }"></div></div></td>
            </tr>
            <tr v-if="report.length === 0"><td colspan="4" class="muted" style="text-align:center">Chưa có khoản thu nào</td></tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Quản lý phòng</h2>
      <div class="card card-pad add-form">
        <input v-model="newRoom.ten_phong" class="input" placeholder="Tên phòng (VD: P301 - View núi)" />
        <select v-model="newRoom.loai_phong" class="input"><option>Standard</option><option>VIP</option><option>Resort</option></select>
        <input v-model="newRoom.gia_dem" type="number" class="input" placeholder="Giá/đêm" />
        <button class="btn btn-primary" @click="addRoom">+ Thêm phòng</button>
      </div>
      <div class="table-wrap" style="margin-top:14px">
        <table class="t">
          <thead><tr><th>Tên phòng</th><th>Loại</th><th>Giá/đêm</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <template v-for="r in rooms" :key="r.id_phong">
              <tr v-if="editingId !== r.id_phong">
                <td>{{ r.ten_phong }}</td><td>{{ r.loai_phong }}</td>
                <td>{{ Number(r.gia_dem).toLocaleString() }}đ</td>
                <td><span :class="['badge', r.trang_thai === 'Sẵn sàng' ? 'badge-green' : 'badge-orange']">{{ r.trang_thai }}</span></td>
                <td><div class="actions">
                  <button class="btn btn-outline btn-sm" @click="startEdit(r)">Sửa</button>
                  <button class="btn btn-danger btn-sm" @click="deleteRoom(r.id_phong)">Xóa</button>
                </div></td>
              </tr>
              <tr v-else>
                <td><input v-model="editForm.ten_phong" class="input" /></td>
                <td><select v-model="editForm.loai_phong" class="input"><option>Standard</option><option>VIP</option><option>Resort</option></select></td>
                <td><input v-model="editForm.gia_dem" type="number" class="input" /></td>
                <td><select v-model="editForm.trang_thai" class="input"><option>Sẵn sàng</option><option>Đang thuê</option><option>Bảo trì</option></select></td>
                <td><div class="actions">
                  <button class="btn btn-primary btn-sm" @click="saveEdit">Lưu</button>
                  <button class="btn btn-outline btn-sm" @click="editingId = null">Hủy</button>
                </div></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Quản lý nhân viên</h2>
      <div class="card card-pad add-form">
        <input v-model="newStaff.ho_ten" class="input" placeholder="Họ tên" />
        <input v-model="newStaff.email" class="input" placeholder="Email" />
        <input v-model="newStaff.mat_khau" class="input" placeholder="Mật khẩu (chữ + số)" />
        <button class="btn btn-primary" @click="addStaff">+ Thêm nhân viên</button>
      </div>
      <div class="table-wrap" style="margin-top:14px">
        <table class="t">
          <thead><tr><th>Họ tên</th><th>Email / Tên đăng nhập</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            <tr v-for="nv in staffList" :key="nv.id_tai_khoan">
              <td>{{ nv.ho_ten }}</td><td>{{ nv.email || nv.ten_dang_nhap }}</td>
              <td><span :class="['badge', nv.trang_thai_tk === 'locked' ? 'badge-red' : 'badge-green']">{{ nv.trang_thai_tk === 'locked' ? 'Đã khóa' : 'Hoạt động' }}</span></td>
              <td><button class="btn btn-outline btn-sm" @click="toggleLock(nv)">{{ nv.trang_thai_tk === 'locked' ? 'Mở khóa' : 'Khóa' }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Lịch sử ca làm việc</h2>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Nhân viên</th><th>Bắt đầu</th><th>Kết thúc</th><th>Thu trong ca</th></tr></thead>
          <tbody>
            <tr v-for="c in shifts" :key="c.id_ca">
              <td>{{ c.ten_nhan_vien }}</td>
              <td>{{ c.gio_bat_dau.slice(0, 16) }}</td>
              <td>{{ c.gio_ket_thuc ? c.gio_ket_thuc.slice(0, 16) : 'Đang mở' }}</td>
              <td>{{ Number(c.tong_doanh_thu).toLocaleString() }}đ</td>
            </tr>
            <tr v-if="shifts.length === 0"><td colspan="4" class="muted" style="text-align:center">Chưa có ca nào</td></tr>
          </tbody>
        </table>
      </div>

      <h2 class="section-title">Toàn bộ đơn đặt phòng</h2>
      <div class="table-wrap">
        <table class="t">
          <thead><tr><th>Khách</th><th>Phòng</th><th>Ngày ở</th><th>Tiền</th><th>Trạng thái</th></tr></thead>
          <tbody>
            <tr v-for="b in bookings" :key="b.id_don">
              <td>{{ b.ten_khach }}</td><td>{{ b.ten_phong }}</td>
              <td>{{ b.ngay_nhan_phong }} → {{ b.ngay_tra_phong }}</td>
              <td>{{ Number(b.tong_tien).toLocaleString() }}đ</td><td>{{ b.trang_thai_don }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title { color: var(--color-primary); }
.add-form { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.add-form .input { flex: 1; min-width: 160px; }
.actions { display: flex; gap: 6px; }
.tabs { display: flex; gap: 8px; margin-bottom: 14px; }
.bar { background: #f1f5f9; border-radius: 6px; height: 10px; min-width: 120px; }
.bar-fill { background: var(--color-accent); height: 10px; border-radius: 6px; }
.muted { color: var(--color-text-light); font-size: 13px; }
</style>