<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '../components/NavBar.vue'

const API = 'http://localhost:3000'
const HEAD = { 'Content-Type': 'application/json' }
const PHONE_RE = /^0\d{9}$/
const roleLabel = { customer: 'Khách hàng', staff: 'Lễ tân', admin: 'Quản trị viên' }

const me = ref(null)
const info = ref({ ho_ten: '', so_dien_thoai: '' })
const pw = ref({ mat_khau_cu: '', mat_khau_moi: '', xac_nhan: '' })
const infoMsg = ref({ ok: '', err: '' })
const pwMsg = ref({ ok: '', err: '' })

function luuLocal(data) {
  const cu = JSON.parse(localStorage.getItem('user') || '{}')
  localStorage.setItem('user', JSON.stringify({ ...cu, ...data }))
}

async function load() {
  const res = await fetch(`${API}/api/me`)
  if (!res.ok) return
  me.value = await res.json()
  info.value = { ho_ten: me.value.ho_ten, so_dien_thoai: me.value.so_dien_thoai || '' }
}

async function saveInfo() {
  infoMsg.value = { ok: '', err: '' }
  if (!info.value.ho_ten.trim()) { infoMsg.value.err = 'Họ tên không được để trống'; return }
  if (info.value.so_dien_thoai && !PHONE_RE.test(info.value.so_dien_thoai.trim())) { infoMsg.value.err = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'; return }
  const res = await fetch(`${API}/api/me`, { method: 'PUT', headers: HEAD, body: JSON.stringify(info.value) })
  const data = await res.json()
  if (!res.ok) { infoMsg.value.err = data.error; return }
  me.value = data
  luuLocal({ ho_ten: data.ho_ten, so_dien_thoai: data.so_dien_thoai })
  infoMsg.value.ok = 'Đã lưu thay đổi'
}

async function savePw() {
  pwMsg.value = { ok: '', err: '' }
  const p = pw.value
  if (!p.mat_khau_cu || !p.mat_khau_moi) { pwMsg.value.err = 'Vui lòng nhập đủ thông tin'; return }
  if (!(p.mat_khau_moi.length >= 6 && /[A-Za-z]/.test(p.mat_khau_moi) && /\d/.test(p.mat_khau_moi))) { pwMsg.value.err = 'Mật khẩu mới tối thiểu 6 ký tự, gồm cả chữ và số'; return }
  if (p.mat_khau_moi !== p.xac_nhan) { pwMsg.value.err = 'Mật khẩu xác nhận không khớp'; return }
  const res = await fetch(`${API}/api/me/mat-khau`, { method: 'PUT', headers: HEAD, body: JSON.stringify({ mat_khau_cu: p.mat_khau_cu, mat_khau_moi: p.mat_khau_moi }) })
  const data = await res.json()
  if (!res.ok) { pwMsg.value.err = data.error; return }
  pw.value = { mat_khau_cu: '', mat_khau_moi: '', xac_nhan: '' }
  pwMsg.value.ok = 'Đã đổi mật khẩu'
}

onMounted(load)
</script>

<template>
  <div>
    <NavBar />
    <div class="page-container" v-if="me">
      <h1 class="title">Hồ sơ của tôi</h1>
      <div class="grid">
        <div class="card card-pad side">
          <div class="big-avatar">{{ me.ho_ten.trim().charAt(0).toUpperCase() }}</div>
          <h2>{{ me.ho_ten }}</h2>
          <span class="badge badge-blue">{{ roleLabel[me.vai_tro] }}</span>
          <dl>
            <dt>Mã tài khoản</dt><dd>#{{ me.id_tai_khoan }}</dd>
            <dt>Email</dt><dd>{{ me.email || me.ten_dang_nhap }}</dd>
            <dt>Số điện thoại</dt><dd>{{ me.so_dien_thoai || 'Chưa cập nhật' }}</dd>
          </dl>
        </div>

        <div class="forms">
          <div class="card card-pad">
            <h3>Thông tin cá nhân</h3>
            <label class="field-label">Họ và tên</label>
            <input v-model="info.ho_ten" class="input" />
            <label class="field-label gap">Số điện thoại</label>
            <input v-model="info.so_dien_thoai" class="input" maxlength="10" placeholder="0901234567" />
            <p v-if="infoMsg.err" class="msg err">{{ infoMsg.err }}</p>
            <p v-if="infoMsg.ok" class="msg ok">{{ infoMsg.ok }}</p>
            <button class="btn btn-primary" style="margin-top:16px" @click="saveInfo">Lưu thay đổi</button>
          </div>

          <div class="card card-pad">
            <h3>Đổi mật khẩu</h3>
            <label class="field-label">Mật khẩu hiện tại</label>
            <input v-model="pw.mat_khau_cu" type="password" class="input" />
            <label class="field-label gap">Mật khẩu mới</label>
            <input v-model="pw.mat_khau_moi" type="password" class="input" placeholder="Tối thiểu 6 ký tự, có chữ và số" />
            <label class="field-label gap">Xác nhận mật khẩu mới</label>
            <input v-model="pw.xac_nhan" type="password" class="input" />
            <p v-if="pwMsg.err" class="msg err">{{ pwMsg.err }}</p>
            <p v-if="pwMsg.ok" class="msg ok">{{ pwMsg.ok }}</p>
            <button class="btn btn-primary" style="margin-top:16px" @click="savePw">Đổi mật khẩu</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title { color: var(--color-primary); margin: 0 0 20px; }
.grid { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
.side { text-align: center; }
.big-avatar { width: 84px; height: 84px; border-radius: 50%; background: var(--color-primary); color: white; display: grid; place-items: center; font-size: 34px; font-weight: 800; margin: 0 auto 12px; }
.side h2 { margin: 0 0 8px; color: var(--color-primary); font-size: 20px; }
dl { text-align: left; margin: 20px 0 0; }
dt { font-size: 12px; color: var(--color-text-light); text-transform: uppercase; letter-spacing: 0.4px; margin-top: 12px; }
dd { margin: 3px 0 0; font-weight: 600; word-break: break-all; }
.forms { display: flex; flex-direction: column; gap: 20px; }
h3 { margin: 0 0 14px; color: var(--color-primary); }
.gap { margin-top: 14px; }
.msg { font-size: 13.5px; margin: 12px 0 0; }
.msg.err { color: var(--color-danger); }
.msg.ok { color: var(--color-success); }
@media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
</style>