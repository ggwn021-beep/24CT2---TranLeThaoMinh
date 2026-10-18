<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({ ho_ten: '', email: '', so_dien_thoai: '', mat_khau: '', xac_nhan_mk: '' })
const errors = ref({})
const serverError = ref('')
const showPass = ref(false)
const loading = ref(false)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^0\d{9}$/

const strength = computed(() => {
  const p = form.value.mat_khau
  let s = 0
  if (p.length >= 6) s++
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++
  if (p.length >= 10) s++
  if (/[^A-Za-z0-9]/.test(p) || (/[a-z]/.test(p) && /[A-Z]/.test(p))) s++
  return s
})
const strengthLabel = computed(() => (form.value.mat_khau ? ['Quá yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh'][strength.value] : ''))

function validate() {
  const f = form.value
  const e = {}
  if (!f.ho_ten.trim()) e.ho_ten = 'Vui lòng nhập họ tên'
  if (!f.email.trim()) e.email = 'Vui lòng nhập email'
  else if (!EMAIL_RE.test(f.email.trim())) e.email = 'Email không hợp lệ'
  if (!f.so_dien_thoai.trim()) e.so_dien_thoai = 'Vui lòng nhập số điện thoại'
  else if (!PHONE_RE.test(f.so_dien_thoai.trim())) e.so_dien_thoai = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0'
  if (!f.mat_khau) e.mat_khau = 'Vui lòng nhập mật khẩu'
  else if (!(f.mat_khau.length >= 6 && /[A-Za-z]/.test(f.mat_khau) && /\d/.test(f.mat_khau))) e.mat_khau = 'Tối thiểu 6 ký tự, gồm cả chữ và số'
  if (f.xac_nhan_mk !== f.mat_khau) e.xac_nhan_mk = 'Mật khẩu xác nhận không khớp'
  errors.value = e
  return Object.keys(e).length === 0
}

async function register() {
  serverError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ho_ten: form.value.ho_ten, email: form.value.email,
        so_dien_thoai: form.value.so_dien_thoai, mat_khau: form.value.mat_khau
      })
    })
    const data = await res.json()
    if (!res.ok) {
      if (res.status === 409) errors.value = { email: data.error }
      else serverError.value = data.error
      return
    }
    router.push({ path: '/login', query: { registered: '1', email: form.value.email.trim().toLowerCase() } })
  } catch {
    serverError.value = 'Không kết nối được tới máy chủ, vui lòng thử lại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <aside class="auth-side">
      <RouterLink to="/" class="brand">🏨 Sunrise Hotel & Resort</RouterLink>
      <div>
        <h2>Tạo tài khoản miễn phí</h2>
        <p>Chỉ mất 30 giây để bắt đầu đặt phòng.</p>
        <ul>
          <li>Đặt phòng và theo dõi đơn ngay trên web</li>
          <li>Thanh toán chuyển khoản hoặc trả tại quầy</li>
          <li>Hỗ trợ trực tiếp từ lễ tân khi cần</li>
        </ul>
      </div>
    </aside>

    <main class="auth-main">
      <div class="auth-card">
        <h1>Đăng ký</h1>
        <p class="sub">Điền thông tin để tạo tài khoản</p>
        <p v-if="serverError" class="banner err">{{ serverError }}</p>

        <label class="field-label">Họ và tên</label>
        <input v-model="form.ho_ten" :class="['input', { invalid: errors.ho_ten }]" placeholder="Nguyễn Văn A" @input="errors.ho_ten = ''" />
        <p v-if="errors.ho_ten" class="field-error">{{ errors.ho_ten }}</p>

        <label class="field-label gap">Email</label>
        <input v-model="form.email" :class="['input', { invalid: errors.email }]" placeholder="ten@gmail.com" @input="errors.email = ''" />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>

        <label class="field-label gap">Số điện thoại</label>
        <input v-model="form.so_dien_thoai" :class="['input', { invalid: errors.so_dien_thoai }]" placeholder="0901234567" maxlength="10" @input="errors.so_dien_thoai = ''" />
        <p v-if="errors.so_dien_thoai" class="field-error">{{ errors.so_dien_thoai }}</p>

        <label class="field-label gap">Mật khẩu</label>
        <div class="pw">
          <input v-model="form.mat_khau" :type="showPass ? 'text' : 'password'" :class="['input', { invalid: errors.mat_khau }]" placeholder="Tối thiểu 6 ký tự, có chữ và số" @input="errors.mat_khau = ''" />
          <button type="button" class="eye" @click="showPass = !showPass">{{ showPass ? 'Ẩn' : 'Hiện' }}</button>
        </div>
        <div v-if="form.mat_khau" class="meter">
          <div class="bars"><span v-for="n in 4" :key="n" :class="{ on: n <= strength, [`lv${strength}`]: n <= strength }"></span></div>
          <small>{{ strengthLabel }}</small>
        </div>
        <p v-if="errors.mat_khau" class="field-error">{{ errors.mat_khau }}</p>

        <label class="field-label gap">Xác nhận mật khẩu</label>
        <input v-model="form.xac_nhan_mk" :type="showPass ? 'text' : 'password'" :class="['input', { invalid: errors.xac_nhan_mk }]" placeholder="Nhập lại mật khẩu" @input="errors.xac_nhan_mk = ''" @keyup.enter="register" />
        <p v-if="errors.xac_nhan_mk" class="field-error">{{ errors.xac_nhan_mk }}</p>

        <button class="btn btn-primary btn-block" style="margin-top:20px" :disabled="loading" @click="register">{{ loading ? 'Đang xử lý...' : 'Đăng ký' }}</button>
        <p class="switch">Đã có tài khoản? <RouterLink to="/login">Đăng nhập</RouterLink></p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-shell { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; }
.auth-side { padding: 40px; color: white; display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(rgba(27,42,74,0.84), rgba(27,42,74,0.84)), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80') center/cover; }
.brand { color: white; font-size: 20px; font-weight: 800; text-decoration: none; }
.auth-side h2 { font-size: 30px; margin: 0 0 10px; }
.auth-side p { opacity: 0.85; margin: 0 0 18px; }
.auth-side ul { padding-left: 20px; line-height: 2; opacity: 0.95; }
.auth-main { display: flex; align-items: center; justify-content: center; padding: 30px; background: var(--color-bg); }
.auth-card { width: 100%; max-width: 400px; }
.auth-card h1 { margin: 0 0 4px; color: var(--color-primary); font-size: 28px; }
.sub { color: var(--color-text-light); margin: 0 0 20px; font-size: 14px; }
.gap { margin-top: 14px; }
.input.invalid { border-color: var(--color-danger); }
.field-error { color: var(--color-danger); font-size: 12.5px; margin: 5px 0 0; }
.pw { position: relative; }
.pw .input { padding-right: 64px; }
.eye { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-accent-dark); font-weight: 700; cursor: pointer; font-size: 13px; }
.meter { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.bars { display: flex; gap: 4px; flex: 1; }
.bars span { height: 5px; flex: 1; border-radius: 3px; background: #e5e7eb; }
.bars span.lv1 { background: #dc2626; } .bars span.lv2 { background: #f59e0b; } .bars span.lv3 { background: #84cc16; } .bars span.lv4 { background: #16a34a; }
.meter small { font-size: 12.5px; color: var(--color-text-light); min-width: 70px; text-align: right; }
.banner { padding: 10px 14px; border-radius: 9px; font-size: 14px; margin: 0 0 16px; }
.banner.err { background: #fee2e2; color: #991b1b; }
.switch { margin-top: 18px; text-align: center; font-size: 14px; color: var(--color-text-light); }
.switch a { color: var(--color-accent-dark); font-weight: 700; text-decoration: none; }
@media (max-width: 860px) { .auth-shell { grid-template-columns: 1fr; } .auth-side { display: none; } }
</style>