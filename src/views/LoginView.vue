<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const mat_khau = ref('')
const showPass = ref(false)
const errors = ref({ email: '', mat_khau: '' })
const serverError = ref('')
const loading = ref(false)
const justRegistered = route.query.registered === '1'
const expired = route.query.expired === '1'

function validate() {
  errors.value = { email: '', mat_khau: '' }
  if (!email.value.trim()) errors.value.email = 'Vui lòng nhập email'
  if (!mat_khau.value) errors.value.mat_khau = 'Vui lòng nhập mật khẩu'
  return !errors.value.email && !errors.value.mat_khau
}

async function login() {
  serverError.value = ''
  if (!validate()) return
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value.trim(), mat_khau: mat_khau.value })
    })
    const data = await res.json()
    if (!res.ok) { serverError.value = data.error; return }
    localStorage.setItem('user', JSON.stringify(data))
    if (data.vai_tro === 'admin') router.push('/admin')
    else if (data.vai_tro === 'staff') router.push('/staff')
    else router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
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
        <h2>Chào mừng bạn quay lại</h2>
        <p>Đăng nhập để quản lý đơn đặt phòng và nhận hỗ trợ từ lễ tân.</p>
        <ul>
          <li>Theo dõi trạng thái đơn đặt phòng của bạn</li>
          <li>Nhắn tin trực tiếp với lễ tân khi cần hỗ trợ</li>
          <li>Đánh giá kỳ nghỉ sau khi trả phòng</li>
        </ul>
      </div>
    </aside>

    <main class="auth-main">
      <div class="auth-card">
        <h1>Đăng nhập</h1>
        <p class="sub">Nhập thông tin tài khoản của bạn</p>

        <p v-if="justRegistered" class="banner ok">Đăng ký thành công! Hãy đăng nhập để tiếp tục.</p>
        <p v-if="expired" class="banner warn">Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.</p>
        <p v-if="serverError" class="banner err">{{ serverError }}</p>

        <label class="field-label">Email</label>
        <input v-model="email" :class="['input', { invalid: errors.email }]" placeholder="ten@gmail.com" @input="errors.email = ''" @keyup.enter="login" />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>

        <label class="field-label gap">Mật khẩu</label>
        <div class="pw">
          <input v-model="mat_khau" :type="showPass ? 'text' : 'password'" :class="['input', { invalid: errors.mat_khau }]" placeholder="Nhập mật khẩu" @input="errors.mat_khau = ''" @keyup.enter="login" />
          <button type="button" class="eye" @click="showPass = !showPass">{{ showPass ? 'Ẩn' : 'Hiện' }}</button>
        </div>
        <p v-if="errors.mat_khau" class="field-error">{{ errors.mat_khau }}</p>
        <p class="forgot">Quên mật khẩu? Liên hệ lễ tân để được cấp lại.</p>

        <button class="btn btn-primary btn-block" :disabled="loading" @click="login">{{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}</button>
        <p class="switch">Chưa có tài khoản? <RouterLink to="/register">Đăng ký ngay</RouterLink></p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.auth-shell { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; }
.auth-side { padding: 40px; color: white; display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(rgba(27,42,74,0.84), rgba(27,42,74,0.84)), url('https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80') center/cover; }
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
.forgot { font-size: 12.5px; color: var(--color-text-light); margin: 8px 0 18px; }
.banner { padding: 10px 14px; border-radius: 9px; font-size: 14px; margin: 0 0 16px; }
.banner.ok { background: #dcfce7; color: #166534; }
.banner.warn { background: #fef3c7; color: #92400e; }
.banner.err { background: #fee2e2; color: #991b1b; }
.switch { margin-top: 18px; text-align: center; font-size: 14px; color: var(--color-text-light); }
.switch a { color: var(--color-accent-dark); font-weight: 700; text-decoration: none; }
@media (max-width: 860px) { .auth-shell { grid-template-columns: 1fr; } .auth-side { display: none; } }
</style>