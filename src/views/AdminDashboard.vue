<script setup>
import { ref, onMounted } from 'vue'

const rooms = ref([])
const bookings = ref([])
const stats = ref({ doanh_thu: 0, tong_don: 0, dang_o: 0 })
const staffList = ref([])

const newRoom = ref({ ten_phong: '', loai_phong: 'Standard', gia_dem: '' })
const newStaff = ref({ ten_dang_nhap: '', mat_khau: '', ho_ten: '' })

async function loadAll() {
  rooms.value = await (await fetch('http://localhost:3000/api/phong')).json()
  bookings.value = await (await fetch('http://localhost:3000/api/dondat')).json()
  stats.value = await (await fetch('http://localhost:3000/api/thongke')).json()
  staffList.value = await (await fetch('http://localhost:3000/api/nhanvien')).json()
}

async function addRoom() {
  if (!newRoom.value.ten_phong || !newRoom.value.gia_dem) return alert('Nhập đủ thông tin')
  await fetch('http://localhost:3000/api/phong', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRoom.value)
  })
  newRoom.value = { ten_phong: '', loai_phong: 'Standard', gia_dem: '' }
  loadAll()
}

async function deleteRoom(id) {
  if (!confirm('Xóa phòng này?')) return
  const res = await fetch(`http://localhost:3000/api/phong/${id}`, { method: 'DELETE' })
  const data = await res.json()
  if (!res.ok) return alert(data.error)
  loadAll()
}

async function addStaff() {
  if (!newStaff.value.ten_dang_nhap || !newStaff.value.mat_khau) return alert('Nhập đủ thông tin')
  const res = await fetch('http://localhost:3000/api/nhanvien', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStaff.value)
  })
  const data = await res.json()
  if (!res.ok) return alert(data.error)
  newStaff.value = { ten_dang_nhap: '', mat_khau: '', ho_ten: '' }
  loadAll()
}

async function toggleLock(nv) {
  const action = nv.trang_thai_tk === 'locked' ? 'mokhoa' : 'khoa'
  await fetch(`http://localhost:3000/api/nhanvien/${nv.id_tai_khoan}/${action}`, { method: 'PUT' })
  loadAll()
}

onMounted(loadAll)
</script>

<template>
  <div class="page">
    <h1>🛠️ Admin Dashboard</h1>
    <div class="stats">
      <div class="stat-card"><p>Tổng doanh thu</p><h2>{{ Number(stats.doanh_thu).toLocaleString() }}đ</h2></div>
      <div class="stat-card"><p>Tổng đơn đặt</p><h2>{{ stats.tong_don }}</h2></div>
      <div class="stat-card"><p>Phòng đang có khách</p><h2>{{ stats.dang_o }}</h2></div>
    </div>

    <h3>Quản lý phòng</h3>
    <div class="add-form">
      <input v-model="newRoom.ten_phong" placeholder="Tên phòng (VD: P301 - View núi)" />
      <select v-model="newRoom.loai_phong">
        <option>Standard</option><option>VIP</option><option>Resort</option>
      </select>
      <input v-model="newRoom.gia_dem" type="number" placeholder="Giá/đêm" />
      <button @click="addRoom">+ Thêm phòng</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>Tên phòng</th><th>Loại</th><th>Giá</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>
        <tr v-for="r in rooms" :key="r.id_phong">
          <td>{{ r.ten_phong }}</td><td>{{ r.loai_phong }}</td>
          <td>{{ Number(r.gia_dem).toLocaleString() }}đ</td><td>{{ r.trang_thai }}</td>
          <td><button class="del-btn" @click="deleteRoom(r.id_phong)">Xóa</button></td>
        </tr>
      </tbody>
    </table>

    <h3>Quản lý nhân viên</h3>
    <div class="add-form">
      <input v-model="newStaff.ten_dang_nhap" placeholder="Tên đăng nhập" />
      <input v-model="newStaff.mat_khau" placeholder="Mật khẩu" />
      <input v-model="newStaff.ho_ten" placeholder="Họ tên" />
      <button @click="addStaff">+ Thêm nhân viên</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>Tên đăng nhập</th><th>Họ tên</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>
        <tr v-for="nv in staffList" :key="nv.id_tai_khoan">
          <td>{{ nv.ten_dang_nhap }}</td><td>{{ nv.ho_ten }}</td>
          <td>{{ nv.trang_thai_tk === 'locked' ? '🔒 Đã khóa' : '✅ Hoạt động' }}</td>
          <td><button class="del-btn" @click="toggleLock(nv)">{{ nv.trang_thai_tk === 'locked' ? 'Mở khóa' : 'Khóa' }}</button></td>
        </tr>
      </tbody>
    </table>

    <h3>Toàn bộ đơn đặt phòng</h3>
    <table class="admin-table">
      <thead><tr><th>Khách</th><th>Phòng</th><th>Tiền</th><th>Trạng thái</th></tr></thead>
      <tbody>
        <tr v-for="b in bookings" :key="b.id_don">
          <td>{{ b.ten_khach }}</td><td>{{ b.ten_phong }}</td>
          <td>{{ Number(b.tong_tien).toLocaleString() }}đ</td><td>{{ b.trang_thai_don }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 20px; }
.stats { display: flex; gap: 15px; margin-bottom: 25px; }
.stat-card { background: white; padding: 15px 25px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); flex: 1; }
.stat-card h2 { color: #2563eb; }
.admin-table { width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; margin-bottom: 25px; }
.admin-table th, .admin-table td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
.admin-table th { background: #f1f5f9; }

.add-form { display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; }
.add-form input, .add-form select { padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
.add-form button { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.del-btn { background: #dc2626; color: white; border: none; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
</style>