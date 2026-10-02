<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const roomId = route.query.roomId
const roomType = route.query.roomType
const price = Number(route.query.price)

const user = ref(null)
const form = ref({ checkin: '', checkout: '' })
const paymentMethod = ref('qr')
const step = ref(1)

onMounted(() => {
  const saved = localStorage.getItem('user')
  if (!saved) {
    alert('Vui lòng đăng nhập trước khi đặt phòng')
    router.push('/login')
    return
  }
  user.value = JSON.parse(saved)
})

async function submitBooking() {
  if (!form.value.checkin || !form.value.checkout) {
    alert('Vui lòng chọn ngày nhận/trả phòng')
    return
  }
  const today = new Date().toISOString().split('T')[0]
  if (form.value.checkin < today) {
    alert('Ngày nhận phòng không được ở quá khứ')
    return
  }
  if (form.value.checkout <= form.value.checkin) {
    alert('Ngày trả phòng phải sau ngày nhận phòng')
    return
  }
  try {
    const res = await fetch('http://localhost:3000/api/dondat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_tai_khoan: user.value.id_tai_khoan,
        id_phong: roomId,
        ngay_nhan_phong: form.value.checkin,
        ngay_tra_phong: form.value.checkout,
        tong_tien: price,
        phuong_thuc_thanh_toan: paymentMethod.value === 'qr' ? 'Chuyển khoản QR' : 'Tại quầy'
      })
    })
    if (!res.ok) throw new Error('Lỗi khi tạo đơn')
    step.value = 2
  } catch (err) {
    alert('Đặt phòng thất bại: ' + err.message)
  }
}

function finish() { router.push('/') }
</script>

<template>
  <div class="page" v-if="user">
    <h1>Đặt phòng</h1>
    <div class="summary">
      <div>
        <h3>Loại phòng: {{ roomType }}</h3>
        <p class="price">{{ price.toLocaleString() }}đ / đêm</p>
        <p>Người đặt: {{ user.ho_ten }}</p>
      </div>
    </div>

    <div v-if="step === 1" class="form-box">
      <h3>Chọn ngày</h3>
      <div class="date-row">
        <div><label>Nhận phòng</label><input v-model="form.checkin" type="date" /></div>
        <div><label>Trả phòng</label><input v-model="form.checkout" type="date" /></div>
      </div>
      <h3>Phương thức thanh toán</h3>
      <div class="payment-options">
        <label :class="{ active: paymentMethod === 'qr' }">
          <input type="radio" value="qr" v-model="paymentMethod" /> Chuyển khoản / QR Code
        </label>
        <label :class="{ active: paymentMethod === 'counter' }">
          <input type="radio" value="counter" v-model="paymentMethod" /> Thanh toán khi nhận phòng
        </label>
      </div>
      <button class="submit-btn" @click="submitBooking">Xác nhận đặt phòng</button>
    </div>

    <div v-if="step === 2" class="form-box qr-box">
      <h3>✅ Đặt phòng thành công, đã lưu vào hệ thống</h3>
      <p v-if="paymentMethod === 'qr'">Vui lòng chuyển khoản <strong>{{ price.toLocaleString() }}đ</strong>, nhân viên sẽ xác nhận khi nhận được tiền.</p>
      <p v-else>Vui lòng thanh toán <strong>{{ price.toLocaleString() }}đ</strong> khi nhận phòng tại quầy.</p>
      <button class="submit-btn" @click="finish">Về trang chủ</button>
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 600px; margin: 0 auto; padding: 20px; }
.summary { background: white; padding: 15px; border-radius: 10px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.price { color: #2563eb; font-weight: bold; }
.form-box { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.date-row { display: flex; gap: 10px; margin-bottom: 10px; }
.date-row > div { flex: 1; }
.date-row label { font-size: 13px; color: #666; }
.date-row input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
.payment-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.payment-options label { border: 2px solid #ddd; padding: 12px; border-radius: 8px; cursor: pointer; }
.payment-options label.active { border-color: #2563eb; background: #eff6ff; }
.submit-btn { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 15px; }
.qr-box { text-align: center; }
</style>