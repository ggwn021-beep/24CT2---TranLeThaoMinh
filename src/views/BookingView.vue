<!-- src/views/BookingView.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchAPI } from '../utils/api'

const route = useRoute()
const router = useRouter()
const roomId = route.query.roomId
const roomType = route.query.roomType
const price = Number(route.query.price)

const user = ref(null)
const form = ref({ checkin: '', checkout: '' })
const paymentMethod = ref('qr')
const step = ref(1)
const submitting = ref(false)
const bookingResult = ref(null)

onMounted(() => {
  const saved = localStorage.getItem('user')
  if (!saved) { 
    alert('Vui lòng đăng nhập trước khi đặt phòng'); 
    router.push('/login'); 
    return 
  }
  user.value = JSON.parse(saved)
})

const totalPrice = computed(() => {
  if (!form.value.checkin || !form.value.checkout) return 0;
  const days = (new Date(form.value.checkout) - new Date(form.value.checkin)) / (1000 * 60 * 60 * 24);
  return days > 0 ? days * price : 0;
});

const qrUrl = computed(() => {
  const amount = totalPrice.value;
  const addInfo = `Thanh toan phong ${roomType}`;
  return `https://img.vietqr.io/image/MB-0123456789-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=SUNRISE%20HOTEL`;
});

async function submitBooking() {
  if (!form.value.checkin || !form.value.checkout) { alert('Vui lòng chọn ngày nhận/trả phòng'); return }
  const today = new Date().toISOString().split('T')[0]
  if (form.value.checkin < today) { alert('Ngày nhận phòng không được ở quá khứ'); return }
  if (form.value.checkout <= form.value.checkin) { alert('Ngày trả phòng phải sau ngày nhận phòng'); return }
  const soNgay = (new Date(form.value.checkout) - new Date(form.value.checkin)) / (1000 * 60 * 60 * 24)
  if (soNgay > 30) { alert('Thời gian đặt phòng tối đa là 30 đêm'); return }

  submitting.value = true
  try {
    const data = await fetchAPI('/api/dondat', {
      method: 'POST',
      body: JSON.stringify({
        id_phong: roomId,
        ngay_nhan_phong: form.value.checkin,
        ngay_tra_phong: form.value.checkout,
        phuong_thuc_thanh_toan: paymentMethod.value === 'qr' ? 'Chuyển khoản QR' : 'Tại quầy'
      })
    })
    bookingResult.value = data;
    step.value = 2
  } catch (error) {
    alert(error.message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <header class="navbar"><RouterLink to="/" class="logo">🏨 Sunrise Hotel & Resort</RouterLink><nav><RouterLink to="/">← Về trang chủ</RouterLink></nav></header>

    <div class="page-container narrow" v-if="user">
      <h1 class="title">Đặt phòng</h1>

      <div class="card card-pad summary">
        <span class="room-type">{{ roomType }}</span>
        <p class="price">{{ price.toLocaleString() }}đ <span>/ đêm</span></p>
        <p class="guest">Người đặt: <strong>{{ user.ho_ten }}</strong></p>
      </div>

      <div v-if="step === 1" class="card card-pad" style="margin-top:18px">
        <h3>Chọn ngày</h3>
        <div class="date-row">
          <div><label class="field-label">Nhận phòng</label><input v-model="form.checkin" type="date" class="input" /></div>
          <div><label class="field-label">Trả phòng</label><input v-model="form.checkout" type="date" class="input" /></div>
        </div>

        <div v-if="totalPrice > 0" class="alert info">
          Tạm tính: <strong>{{ totalPrice.toLocaleString() }}đ</strong> cho {{ (totalPrice/price) }} đêm.
        </div>

        <h3 style="margin-top:22px">Phương thức thanh toán</h3>
        <label :class="['pay-option', { active: paymentMethod === 'qr' }]">
          <input type="radio" value="qr" v-model="paymentMethod" /> Chuyển khoản / QR Code
        </label>
        <label :class="['pay-option', { active: paymentMethod === 'counter' }]">
          <input type="radio" value="counter" v-model="paymentMethod" /> Thanh toán khi nhận phòng
        </label>

        <button class="btn btn-primary btn-block" style="margin-top:20px" :disabled="submitting" @click="submitBooking">
          {{ submitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng' }}
        </button>
      </div>

      <div v-if="step === 2 && bookingResult" class="card card-pad done-box">
        <div class="check">✅</div>
        <h3>Đặt phòng thành công!</h3>
        <p>Mã đơn hàng: <strong>#{{ bookingResult.id_don }}</strong></p>
        
        <div v-if="paymentMethod === 'qr'" class="qr-container">
          <p>Vui lòng quét mã QR dưới đây để thanh toán:</p>
          <img :src="qrUrl" alt="Mã QR Thanh Toán" class="qr-img" />
          <p>Số tiền: <strong>{{ bookingResult.tong_tien.toLocaleString() }}đ</strong></p>
          <p class="muted">Hệ thống sẽ tự động xác nhận sau khi nhận được tiền.</p>
        </div>
        <p v-else>Vui lòng thanh toán <strong>{{ bookingResult.tong_tien.toLocaleString() }}đ</strong> khi nhận phòng tại quầy.</p>
        
        <button class="btn btn-primary btn-block" style="margin-top:16px" @click="router.push('/account')">Xem đơn của tôi</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title { color: var(--color-primary); }
.room-type { font-size: 11.5px; color: var(--color-accent-dark); font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; }
.price { color: var(--color-primary); font-weight: 800; font-size: 20px; margin: 6px 0; }
.price span { color: var(--color-text-light); font-weight: 400; font-size: 13px; }
.guest { color: var(--color-text-light); font-size: 14px; margin: 0; }
h3 { color: var(--color-primary); margin: 0 0 12px; font-size: 16px; }
.date-row { display: flex; gap: 12px; }
.date-row > div { flex: 1; }
.pay-option { display: block; border: 1.5px solid var(--color-border); padding: 14px; border-radius: 9px; cursor: pointer; margin-bottom: 10px; font-size: 14.5px; }
.pay-option.active { border-color: var(--color-accent); background: #fdf8ef; }
.done-box { text-align: center; margin-top: 18px; }
.check { font-size: 36px; }
.qr-container { text-align: center; margin-top: 15px; padding: 15px; background: #f8fafc; border-radius: 10px; }
.qr-img { width: 200px; height: 200px; margin: 10px auto; display: block; border: 1px solid #ddd; border-radius: 8px; }
.alert.info { background: #e0f2fe; color: #0369a1; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 14px; }
</style>