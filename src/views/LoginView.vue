<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const ten_dang_nhap = ref('')
const mat_khau = ref('')
const errorMsg = ref('')

async function login() {
  errorMsg.value = ''
  if (!ten_dang_nhap.value || !mat_khau.value) {
    errorMsg.value = 'Vui lòng nhập đầy đủ'
    return
  }
  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ten_dang_nhap: ten_dang_nhap.value, mat_khau: mat_khau.value })
    })
    const data = await res.json()
    if (!res.ok) {
      errorMsg.value = data.error
      return
    }
    // Lưu tài khoản tạm vào trình duyệt để các trang khác biết ai đang đăng nhập
    localStorage.setItem('user', JSON.stringify(data))

    if (data.vai_tro === 'admin') router.push('/admin')
    else if (data.vai_tro === 'staff') router.push('/staff')
    else router.push('/')
  } catch (err) {
    errorMsg.value = 'Không kết nối được tới server'
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <h2>Đăng nhập</h2>
      <input v-model="ten_dang_nhap" placeholder="Tên đăng nhập" />
      <input v-model="mat_khau" type="password" placeholder="Mật khẩu" />
      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <button @click="login">Đăng nhập</button>
      <p class="switch">Chưa có tài khoản? <RouterLink to="/">Về trang chủ</RouterLink></p>
    </div>
  </div>
</template>

<style scoped>
.login-page { display: flex; justify-content: center; align-items: center; height: 100vh; }
.login-box { background: white; padding: 30px; border-radius: 10px; width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.login-box input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 6px; }
.login-box button { width: 100%; background: #2563eb; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; }
.error { color: #dc2626; font-size: 13px; margin-bottom: 10px; }
.switch { margin-top: 15px; text-align: center; font-size: 14px; }
</style>