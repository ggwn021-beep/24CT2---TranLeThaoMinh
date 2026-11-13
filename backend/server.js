import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    dateStrings: true
});

db.connect((err) => {
    if (err) console.log('Kết nối MySQL thất bại!', err);
    else console.log('Đã kết nối Database thành công!');
});

// TẠO TÀI KHOẢN EMAIL TEST TỰ ĐỘNG (Không cần mật khẩu)
let transporter;
nodemailer.createTestAccount((err, account) => {
    if (err) {
        console.error('Không tạo được tài khoản test mail', err);
        return;
    }
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
    });
    console.log('Đã sẵn sàng hệ thống Email Test!');
});

const sendBookingEmail = async (email, tenKhach, tenPhong, ngayNhan, ngayTra, tongTien) => {
    if (!transporter) return; // Nếu chưa kịp khởi tạo thì bỏ qua
    try {
        const info = await transporter.sendMail({
            from: '"Sunrise Hotel & Resort" <no-reply@sunrise.com>',
            to: email,
            subject: 'Xác nhận đặt phòng thành công - Sunrise Hotel & Resort',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #1b2a4a; text-align: center;">🏨 Sunrise Hotel & Resort</h2>
                    <h3>Xin chào ${tenKhach},</h3>
                    <p>Cảm ơn bạn đã lựa chọn Sunrise Hotel & Resort. Đơn đặt phòng của bạn đã được ghi nhận thành công!</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phòng:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${tenPhong}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Ngày nhận:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${ngayNhan}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Ngày trả:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${ngayTra}</td></tr>
                        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tổng tiền:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee; color: #d97706; font-weight: bold;">${Number(tongTien).toLocaleString()} VNĐ</td></tr>
                    </table>
                    <p style="margin-top: 20px;">Vui lòng đến quầy lễ tân để làm thủ tục nhận phòng đúng giờ.</p>
                    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">© 2026 Sunrise Hotel & Resort</p>
                </div>
            `
        });
        console.log(`\n=========================================`);
        console.log(`ĐÃ GỬI EMAIL THÀNH CÔNG TỚI: ${email}`);
        // IN RA ĐƯỜNG LINK ĐỂ BẠN XEM EMAIL (DÀNH CHO DEMO)
        console.log(`BẤM VÀO LINK NÀY ĐỂ XEM EMAIL: ${nodemailer.getTestMessageUrl(info)}`);
        console.log(`=========================================\n`);
    } catch (error) {
        console.log('Lỗi gửi email:', error);
    }
};
// ... (Phần còn lại của server.js giữ nguyên)

// ================= TIỆN ÍCH DÙNG CHUNG =================
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9}$/;
const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const matKhauHopLe = (mk) => typeof mk === 'string' && mk.length >= 6 && /[A-Za-z]/.test(mk) && /\d/.test(mk);
const loi = (res, ma, noiDung) => res.status(ma).json({ error: noiDung });
const loiServer = (res) => loi(res, 500, 'Lỗi server');

// ================= XÁC THỰC =================
const JWT_SECRET = process.env.JWT_SECRET || 'sunrise-doi-khoa-nay-trong-env';
const taoToken = (u) => jwt.sign({ id: u.id_tai_khoan, vai_tro: u.vai_tro }, JWT_SECRET, { expiresIn: '8h' });

function xacThuc(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return loi(res, 401, 'Bạn chưa đăng nhập');
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch { return loi(res, 401, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'); }
    
    db.query('SELECT vai_tro, trang_thai_tk FROM TaiKhoan WHERE id_tai_khoan = ?', [payload.id], (err, rows) => {
        if (err) return loiServer(res);
        if (rows.length === 0 || rows[0].trang_thai_tk === 'locked') return loi(res, 401, 'Tài khoản không còn hiệu lực');
        req.user = { id: payload.id, vai_tro: rows[0].vai_tro };
        next();
    });
}
const chiVaiTro = (...dsVaiTro) => (req, res, next) =>
    dsVaiTro.includes(req.user.vai_tro) ? next() : loi(res, 403, 'Bạn không có quyền thực hiện thao tác này');

// ================= CÔNG KHAI =================
app.get('/api/phong', (req, res) => {
    db.query('SELECT * FROM Phong', (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.get('/api/phong/:id', (req, res) => {
    db.query('SELECT * FROM Phong WHERE id_phong = ?', [req.params.id], (err, rows) => {
        if (err) return loiServer(res);
        if (rows.length === 0) return loi(res, 404, 'Không tìm thấy phòng');
        res.json(rows[0]);
    });
});

app.post('/api/register', (req, res) => {
    const ho_ten = (req.body.ho_ten || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const so_dien_thoai = (req.body.so_dien_thoai || '').trim();
    const mat_khau = req.body.mat_khau || '';

    if (!ho_ten || !email || !so_dien_thoai || !mat_khau) return loi(res, 400, 'Vui lòng điền đầy đủ thông tin');
    if (!EMAIL_RE.test(email)) return loi(res, 400, 'Email không hợp lệ');
    if (!PHONE_RE.test(so_dien_thoai)) return loi(res, 400, 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0');
    if (!matKhauHopLe(mat_khau)) return loi(res, 400, 'Mật khẩu tối thiểu 6 ký tự, gồm cả chữ và số');

    db.query('SELECT id_tai_khoan FROM TaiKhoan WHERE email = ? OR ten_dang_nhap = ?', [email, email], async (err, existing) => {
        if (err) return loiServer(res);
        if (existing.length > 0) return loi(res, 409, 'Email này đã được đăng ký');
        const hash = await bcrypt.hash(mat_khau, 10);
        db.query("INSERT INTO TaiKhoan (ten_dang_nhap, email, so_dien_thoai, mat_khau, ho_ten, vai_tro) VALUES (?, ?, ?, ?, ?, 'customer')",
            [email, email, so_dien_thoai, hash, ho_ten], (err2, kq) => {
                if (err2) return loiServer(res);
                res.json({ message: 'Đăng ký thành công', id_tai_khoan: kq.insertId });
            });
    });
});

app.post('/api/login', (req, res) => {
    const email = (req.body.email || '').trim();
    const mat_khau = req.body.mat_khau || '';
    if (!email || !mat_khau) return loi(res, 400, 'Vui lòng nhập email và mật khẩu');

    db.query('SELECT * FROM TaiKhoan WHERE email = ? OR ten_dang_nhap = ?', [email, email], async (err, result) => {
        if (err) return loiServer(res);
        if (result.length === 0) return loi(res, 401, 'Sai email hoặc mật khẩu');

        const user = result[0];
        let ok = false;
        if (user.mat_khau.startsWith('$2')) {
            ok = await bcrypt.compare(mat_khau, user.mat_khau);
        } else if (user.mat_khau === mat_khau) {
            ok = true;
            const hash = await bcrypt.hash(mat_khau, 10);
            db.query('UPDATE TaiKhoan SET mat_khau = ? WHERE id_tai_khoan = ?', [hash, user.id_tai_khoan]);
        }
        if (!ok) return loi(res, 401, 'Sai email hoặc mật khẩu');
        if (user.trang_thai_tk === 'locked') return loi(res, 403, 'Tài khoản đã bị khóa');

        delete user.mat_khau;
        res.json({ ...user, token: taoToken(user) });
    });
});

// ================= TÀI KHOẢN =================
const COT_CONG_KHAI = 'id_tai_khoan, ten_dang_nhap, email, so_dien_thoai, ho_ten, vai_tro';

app.get('/api/me', xacThuc, (req, res) => {
    db.query(`SELECT ${COT_CONG_KHAI} FROM TaiKhoan WHERE id_tai_khoan = ?`, [req.user.id], (err, rows) => {
        if (err) return loiServer(res);
        res.json(rows[0]);
    });
});

app.put('/api/me', xacThuc, (req, res) => {
    const ho_ten = (req.body.ho_ten || '').trim();
    const so_dien_thoai = (req.body.so_dien_thoai || '').trim();
    if (!ho_ten) return loi(res, 400, 'Họ tên không được để trống');
    if (so_dien_thoai && !PHONE_RE.test(so_dien_thoai)) return loi(res, 400, 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0');
    db.query('UPDATE TaiKhoan SET ho_ten = ?, so_dien_thoai = ? WHERE id_tai_khoan = ?', [ho_ten, so_dien_thoai || null, req.user.id], (err) => {
        if (err) return loiServer(res);
        db.query(`SELECT ${COT_CONG_KHAI} FROM TaiKhoan WHERE id_tai_khoan = ?`, [req.user.id], (err2, rows) => {
            if (err2) return loiServer(res);
            res.json(rows[0]);
        });
    });
});

app.put('/api/me/mat-khau', xacThuc, (req, res) => {
    const { mat_khau_cu, mat_khau_moi } = req.body;
    if (!matKhauHopLe(mat_khau_moi)) return loi(res, 400, 'Mật khẩu mới tối thiểu 6 ký tự, gồm cả chữ và số');
    db.query('SELECT mat_khau FROM TaiKhoan WHERE id_tai_khoan = ?', [req.user.id], async (err, rows) => {
        if (err || rows.length === 0) return loiServer(res);
        const luu = rows[0].mat_khau;
        const dung = luu.startsWith('$2') ? await bcrypt.compare(mat_khau_cu || '', luu) : luu === mat_khau_cu;
        if (!dung) return loi(res, 400, 'Mật khẩu hiện tại không đúng');
        const hash = await bcrypt.hash(mat_khau_moi, 10);
        db.query('UPDATE TaiKhoan SET mat_khau = ? WHERE id_tai_khoan = ?', [hash, req.user.id], (err2) => {
            if (err2) return loiServer(res);
            res.json({ message: 'Đã đổi mật khẩu' });
        });
    });
});

// API: Khách hàng tự xóa tài khoản của mình
app.delete('/api/me', xacThuc, chiVaiTro('customer'), (req, res) => {
    // Kiểm tra xem khách có đơn nào đang chạy không
    db.query("SELECT id_don FROM DonDatPhong WHERE id_tai_khoan = ? AND trang_thai_don NOT IN ('Đã hủy', 'Đã hoàn tất')", [req.user.id], (err, orders) => {
        if (err) return loiServer(res);
        if (orders.length > 0) return loi(res, 400, 'Bạn đang có đơn đặt phòng chưa hoàn tất, không thể xóa tài khoản!');
        
        // Xóa mềm: Khóa tài khoản và xóa thông tin cá nhân (giữ lại ID để lưu lịch sử đơn hàng)
        db.query("UPDATE TaiKhoan SET trang_thai_tk = 'locked', ho_ten = 'Tài khoản đã xóa', email = NULL, so_dien_thoai = NULL WHERE id_tai_khoan = ?", [req.user.id], (err2) => {
            if (err2) return loiServer(res);
            res.json({ message: 'Tài khoản đã được xóa vĩnh viễn' });
        });
    });
});

// ================= KHÁCH HÀNG =================
app.post('/api/dondat', xacThuc, chiVaiTro('customer'), (req, res) => {
    const { id_phong, ngay_nhan_phong, ngay_tra_phong, phuong_thuc_thanh_toan } = req.body;
    const homNay = new Date().toLocaleDateString('en-CA');

    if (!id_phong || !NGAY_RE.test(ngay_nhan_phong || '') || !NGAY_RE.test(ngay_tra_phong || '')) return loi(res, 400, 'Vui lòng chọn phòng và ngày ở');
    if (ngay_nhan_phong < homNay) return loi(res, 400, 'Ngày nhận phòng không được ở quá khứ');
    if (ngay_tra_phong <= ngay_nhan_phong) return loi(res, 400, 'Ngày trả phòng phải sau ngày nhận phòng');
    const soDem = Math.round((new Date(ngay_tra_phong) - new Date(ngay_nhan_phong)) / 86400000);
    if (soDem > 30) return loi(res, 400, 'Thời gian đặt phòng tối đa là 30 đêm');

    db.query('SELECT gia_dem, trang_thai, ten_phong FROM Phong WHERE id_phong = ?', [id_phong], (err, ph) => {
        if (err) return loiServer(res);
        if (ph.length === 0) return loi(res, 404, 'Không tìm thấy phòng');
        if (ph[0].trang_thai === 'Bảo trì') return loi(res, 409, 'Phòng đang bảo trì');

        db.query("SELECT COUNT(*) AS so_don FROM DonDatPhong WHERE id_tai_khoan = ? AND trang_thai_don = 'Chờ duyệt'", [req.user.id], (err2, dem) => {
            if (err2) return loiServer(res);
            if (dem[0].so_don >= 3) return loi(res, 429, 'Bạn đang có quá nhiều đơn chờ duyệt, vui lòng chờ xử lý trước khi đặt thêm');

            const sqlTrung = `SELECT id_don FROM DonDatPhong
                WHERE id_phong = ? AND trang_thai_don NOT IN ('Đã hủy', 'Đã hoàn tất')
                AND NOT (ngay_tra_phong <= ? OR ngay_nhan_phong >= ?)`;
            db.query(sqlTrung, [id_phong, ngay_nhan_phong, ngay_tra_phong], (err3, trung) => {
                if (err3) return loiServer(res);
                if (trung.length > 0) return loi(res, 409, 'Phòng đã có khách đặt trong khoảng ngày này, vui lòng chọn phòng hoặc ngày khác');

                const tongTien = Number(ph[0].gia_dem) * soDem;
                db.query("INSERT INTO DonDatPhong (id_tai_khoan, id_phong, ngay_nhan_phong, ngay_tra_phong, tong_tien, trang_thai_don, phuong_thuc_thanh_toan) VALUES (?, ?, ?, ?, ?, 'Chờ duyệt', ?)",
                    [req.user.id, id_phong, ngay_nhan_phong, ngay_tra_phong, tongTien, phuong_thuc_thanh_toan || 'Tại quầy'], (err4, kq) => {
                        if (err4) return loiServer(res);
                        
                        // GỬI EMAIL XÁC NHẬN
                        db.query('SELECT email, ho_ten FROM TaiKhoan WHERE id_tai_khoan = ?', [req.user.id], (err5, userRows) => {
                            if (!err5 && userRows.length > 0 && userRows[0].email) {
                                sendBookingEmail(userRows[0].email, userRows[0].ho_ten, ph[0].ten_phong, ngay_nhan_phong, ngay_tra_phong, tongTien);
                            }
                            res.json({ message: 'Đặt phòng thành công', id_don: kq.insertId, tong_tien: tongTien });
                        });
                    });
            });
        });
    });
});

app.get('/api/dondat/khach/:id', xacThuc, (req, res) => {
    if (req.user.vai_tro === 'customer' && String(req.user.id) !== req.params.id) return loi(res, 403, 'Bạn chỉ xem được đơn của chính mình');
    const sql = `SELECT d.*, p.ten_phong, p.loai_phong,
        (SELECT COUNT(*) FROM DanhGia g WHERE g.id_don = d.id_don) AS da_danh_gia
        FROM DonDatPhong d JOIN Phong p ON d.id_phong = p.id_phong
        WHERE d.id_tai_khoan = ? ORDER BY d.id_don DESC`;
    db.query(sql, [req.params.id], (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.put('/api/dondat/:id/huy', xacThuc, chiVaiTro('customer'), (req, res) => {
    db.query("UPDATE DonDatPhong SET trang_thai_don = 'Đã hủy' WHERE id_don = ? AND id_tai_khoan = ? AND trang_thai_don = 'Chờ duyệt'",
        [req.params.id, req.user.id], (err, kq) => {
            if (err) return loiServer(res);
            if (kq.affectedRows === 0) return loi(res, 400, 'Chỉ hủy được đơn của bạn đang ở trạng thái chờ duyệt');
            res.json({ message: 'Đã hủy đơn' });
        });
});

app.post('/api/danhgia', xacThuc, chiVaiTro('customer'), (req, res) => {
    const { id_don, binh_luan } = req.body;
    const soSao = Number(req.body.so_sao);
    if (!(soSao >= 1 && soSao <= 5)) return loi(res, 400, 'Số sao phải từ 1 đến 5');
    db.query("SELECT id_don FROM DonDatPhong WHERE id_don = ? AND id_tai_khoan = ? AND trang_thai_don = 'Đã hoàn tất'", [id_don, req.user.id], (err, don) => {
        if (err) return loiServer(res);
        if (don.length === 0) return loi(res, 400, 'Chỉ đánh giá được đơn của bạn đã hoàn tất');
        db.query('SELECT id_danh_gia FROM DanhGia WHERE id_don = ?', [id_don], (err2, daCo) => {
            if (err2) return loiServer(res);
            if (daCo.length > 0) return loi(res, 409, 'Đơn này đã được đánh giá');
            db.query('INSERT INTO DanhGia (id_don, so_sao, binh_luan) VALUES (?, ?, ?)', [id_don, soSao, (binh_luan || '').trim()], (err3) => {
                if (err3) return loiServer(res);
                res.json({ message: 'Cảm ơn bạn đã đánh giá' });
            });
        });
    });
});

// ================= TIN NHẮN & HỖ TRỢ =================
app.get('/api/tinnhan/khach/:id', xacThuc, (req, res) => {
    if (req.user.vai_tro === 'customer' && String(req.user.id) !== req.params.id) return loi(res, 403, 'Bạn chỉ xem được tin nhắn của chính mình');
    db.query('SELECT * FROM TinNhan WHERE id_khach_hang = ? ORDER BY thoi_gian ASC', [req.params.id], (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.post('/api/tinnhan', xacThuc, (req, res) => {
    const noiDung = (req.body.noi_dung || '').trim();
    if (!noiDung) return loi(res, 400, 'Nội dung tin nhắn đang trống');
    const laKhach = req.user.vai_tro === 'customer';
    const idKhach = laKhach ? req.user.id : req.body.id_khach_hang;
    if (!idKhach) return loi(res, 400, 'Thiếu thông tin khách hàng');
    db.query('INSERT INTO TinNhan (id_khach_hang, noi_dung, nguoi_gui) VALUES (?, ?, ?)', [idKhach, noiDung, laKhach ? 'customer' : 'staff'], (err) => {
        if (err) return loiServer(res);
        res.json({ message: 'Đã gửi' });
    });
});

app.get('/api/tinnhan', xacThuc, chiVaiTro('staff', 'admin'), (req, res) => {
    const sql = `SELECT t.*, tk.ho_ten AS ten_khach FROM TinNhan t
                 JOIN TaiKhoan tk ON t.id_khach_hang = tk.id_tai_khoan ORDER BY t.thoi_gian ASC`;
    db.query(sql, (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.get('/api/danhgia', xacThuc, chiVaiTro('staff', 'admin'), (req, res) => {
    const sql = `SELECT dg.*, p.ten_phong, tk.ho_ten AS ten_khach FROM DanhGia dg
                 JOIN DonDatPhong d ON dg.id_don = d.id_don
                 JOIN Phong p ON d.id_phong = p.id_phong
                 JOIN TaiKhoan tk ON d.id_tai_khoan = tk.id_tai_khoan
                 ORDER BY dg.ngay_danh_gia DESC`;
    db.query(sql, (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

// ================= LỄ TÂN =================
app.get('/api/dondat', xacThuc, chiVaiTro('staff', 'admin'), (req, res) => {
    const sql = `SELECT d.*, p.ten_phong, p.loai_phong, t.ho_ten AS ten_khach
        FROM DonDatPhong d
        JOIN Phong p ON d.id_phong = p.id_phong
        JOIN TaiKhoan t ON d.id_tai_khoan = t.id_tai_khoan
        ORDER BY d.id_don DESC`;
    db.query(sql, (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.get('/api/ca/hien-tai/:idNV', xacThuc, chiVaiTro('staff'), (req, res) => {
    db.query('SELECT * FROM CaLamViec WHERE id_nhan_vien = ? AND gio_ket_thuc IS NULL ORDER BY id_ca DESC LIMIT 1', [req.user.id], (err, rows) => {
        if (err) return loiServer(res);
        res.json(rows[0] || null);
    });
});

app.post('/api/ca/bat-dau', xacThuc, chiVaiTro('staff'), (req, res) => {
    db.query('SELECT id_ca FROM CaLamViec WHERE id_nhan_vien = ? AND gio_ket_thuc IS NULL', [req.user.id], (err, dangMo) => {
        if (err) return loiServer(res);
        if (dangMo.length > 0) return loi(res, 409, 'Bạn đang trong ca làm việc rồi');
        db.query('INSERT INTO CaLamViec (id_nhan_vien, gio_bat_dau) VALUES (?, NOW())', [req.user.id], (err2, kq) => {
            if (err2) return loiServer(res);
            res.json({ message: 'Đã bắt đầu ca', id_ca: kq.insertId });
        });
    });
});

app.put('/api/ca/:id/ket-thuc', xacThuc, chiVaiTro('staff'), (req, res) => {
    db.query('UPDATE CaLamViec SET gio_ket_thuc = NOW() WHERE id_ca = ? AND id_nhan_vien = ? AND gio_ket_thuc IS NULL', [req.params.id, req.user.id], (err, kq) => {
        if (err) return loiServer(res);
        if (kq.affectedRows === 0) return loi(res, 400, 'Ca này đã kết thúc hoặc không phải của bạn');
        db.query('SELECT * FROM CaLamViec WHERE id_ca = ?', [req.params.id], (err2, rows) => (err2 ? loiServer(res) : res.json(rows[0])));
    });
});

app.get('/api/ca', xacThuc, chiVaiTro('staff', 'admin'), (req, res) => {
    const idNV = req.user.vai_tro === 'staff' ? req.user.id : req.query.id_nhan_vien;
    const sql = `SELECT c.*, t.ho_ten AS ten_nhan_vien FROM CaLamViec c
                 JOIN TaiKhoan t ON c.id_nhan_vien = t.id_tai_khoan
                 ${idNV ? 'WHERE c.id_nhan_vien = ?' : ''} ORDER BY c.id_ca DESC LIMIT 30`;
    db.query(sql, idNV ? [idNV] : [], (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.put('/api/dondat/:id/xacnhan-thanhtoan', xacThuc, chiVaiTro('staff'), (req, res) => {
    db.query('SELECT id_ca FROM CaLamViec WHERE id_nhan_vien = ? AND gio_ket_thuc IS NULL ORDER BY id_ca DESC LIMIT 1', [req.user.id], (err, ca) => {
        if (err) return loiServer(res);
        if (ca.length === 0) return loi(res, 400, 'Bạn cần bấm Bắt đầu ca trước khi thu tiền');
        const idCa = ca[0].id_ca;
        db.query("SELECT tong_tien FROM DonDatPhong WHERE id_don = ? AND trang_thai_don = 'Chờ duyệt'", [req.params.id], (err2, don) => {
            if (err2) return loiServer(res);
            if (don.length === 0) return loi(res, 400, 'Đơn không ở trạng thái chờ duyệt');
            db.query("UPDATE DonDatPhong SET trang_thai_don = 'Đã xác nhận', id_nhan_vien_thu = ?, id_ca = ?, thoi_gian_thu = NOW() WHERE id_don = ?",
                [req.user.id, idCa, req.params.id], (err3) => {
                    if (err3) return loiServer(res);
                    db.query('UPDATE CaLamViec SET tong_doanh_thu = tong_doanh_thu + ? WHERE id_ca = ?', [don[0].tong_tien, idCa], (err4) => {
                        if (err4) return loiServer(res);
                        res.json({ message: 'Đã xác nhận thanh toán', tong_tien: don[0].tong_tien });
                    });
                });
        });
    });
});

function doiTrangThai(res, idDon, tu, den, trangThaiPhong, thongBao) {
    db.query('UPDATE DonDatPhong SET trang_thai_don = ? WHERE id_don = ? AND trang_thai_don = ?', [den, idDon, tu], (err, kq) => {
        if (err) return loiServer(res);
        if (kq.affectedRows === 0) return loi(res, 400, `Đơn không ở trạng thái "${tu}"`);
        db.query('UPDATE Phong p JOIN DonDatPhong d ON d.id_phong = p.id_phong SET p.trang_thai = ? WHERE d.id_don = ?', [trangThaiPhong, idDon], (err2) => {
            if (err2) return loiServer(res);
            res.json({ message: thongBao });
        });
    });
}
app.put('/api/dondat/:id/checkin', xacThuc, chiVaiTro('staff'), (req, res) =>
    doiTrangThai(res, req.params.id, 'Đã xác nhận', 'Đã check-in', 'Đang thuê', 'Đã check-in'));
app.put('/api/dondat/:id/checkout', xacThuc, chiVaiTro('staff'), (req, res) =>
    doiTrangThai(res, req.params.id, 'Đã check-in', 'Đã hoàn tất', 'Sẵn sàng', 'Đã check-out'));

app.get('/api/doanhthu', xacThuc, chiVaiTro('staff', 'admin'), (req, res) => {
    const dinhDang = { ngay: '%Y-%m-%d', thang: '%Y-%m', nam: '%Y' }[req.query.kieu] || '%Y-%m-%d';
    const idNV = req.user.vai_tro === 'staff' ? req.user.id : req.query.id_nhan_vien;
    const sql = `SELECT DATE_FORMAT(thoi_gian_thu, '${dinhDang}') AS ky, COUNT(*) AS so_don, SUM(tong_tien) AS doanh_thu
                 FROM DonDatPhong WHERE thoi_gian_thu IS NOT NULL ${idNV ? 'AND id_nhan_vien_thu = ?' : ''}
                 GROUP BY ky ORDER BY ky DESC LIMIT 60`;
    db.query(sql, idNV ? [idNV] : [], (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

// ================= QUẢN TRỊ =================
app.get('/api/thongke', xacThuc, chiVaiTro('admin'), (req, res) => {
    db.query('SELECT COALESCE(SUM(tong_tien), 0) AS doanh_thu FROM DonDatPhong WHERE thoi_gian_thu IS NOT NULL', (err, r1) => {
        if (err) return loiServer(res);
        db.query('SELECT COUNT(*) AS tong_don FROM DonDatPhong', (err2, r2) => {
            if (err2) return loiServer(res);
            db.query("SELECT COUNT(*) AS dang_o FROM DonDatPhong WHERE trang_thai_don = 'Đã check-in'", (err3, r3) => {
                if (err3) return loiServer(res);
                res.json({ doanh_thu: r1[0].doanh_thu, tong_don: r2[0].tong_don, dang_o: r3[0].dang_o });
            });
        });
    });
});

app.post('/api/phong', xacThuc, chiVaiTro('admin'), (req, res) => {
    const { ten_phong, loai_phong, gia_dem } = req.body;
    if (!ten_phong || !ten_phong.trim()) return loi(res, 400, 'Tên phòng không được để trống');
    if (!(Number(gia_dem) > 0)) return loi(res, 400, 'Giá phòng phải lớn hơn 0');
    db.query("INSERT INTO Phong (ten_phong, loai_phong, gia_dem, trang_thai) VALUES (?, ?, ?, 'Sẵn sàng')", [ten_phong.trim(), loai_phong, gia_dem], (err, kq) => {
        if (err) return loiServer(res);
        res.json({ message: 'Đã thêm phòng', id_phong: kq.insertId });
    });
});

app.put('/api/phong/:id', xacThuc, chiVaiTro('admin'), (req, res) => {
    const { ten_phong, loai_phong, gia_dem, trang_thai } = req.body;
    if (!ten_phong || !ten_phong.trim()) return loi(res, 400, 'Tên phòng không được để trống');
    if (!(Number(gia_dem) > 0)) return loi(res, 400, 'Giá phòng phải lớn hơn 0');
    if (!['Sẵn sàng', 'Đang thuê', 'Bảo trì'].includes(trang_thai)) return loi(res, 400, 'Trạng thái không hợp lệ');
    db.query('UPDATE Phong SET ten_phong = ?, loai_phong = ?, gia_dem = ?, trang_thai = ? WHERE id_phong = ?',
        [ten_phong.trim(), loai_phong, gia_dem, trang_thai, req.params.id], (err) => {
            if (err) return loiServer(res);
            res.json({ message: 'Đã cập nhật phòng' });
        });
});

app.delete('/api/phong/:id', xacThuc, chiVaiTro('admin'), (req, res) => {
    db.query('DELETE FROM Phong WHERE id_phong = ?', [req.params.id], (err) => {
        if (err) return loi(res, 409, 'Không thể xóa: phòng đang có đơn đặt liên kết');
        res.json({ message: 'Đã xóa phòng' });
    });
});

app.get('/api/nhanvien', xacThuc, chiVaiTro('admin'), (req, res) => {
    db.query("SELECT id_tai_khoan, ten_dang_nhap, email, ho_ten, trang_thai_tk FROM TaiKhoan WHERE vai_tro = 'staff'", (err, rows) => (err ? loiServer(res) : res.json(rows)));
});

app.post('/api/nhanvien', xacThuc, chiVaiTro('admin'), async (req, res) => {
    const ho_ten = (req.body.ho_ten || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const mat_khau = req.body.mat_khau || '';
    if (!ho_ten || !email) return loi(res, 400, 'Vui lòng nhập họ tên và email');
    if (!EMAIL_RE.test(email)) return loi(res, 400, 'Email không hợp lệ');
    if (!matKhauHopLe(mat_khau)) return loi(res, 400, 'Mật khẩu tối thiểu 6 ký tự, gồm cả chữ và số');
    const hash = await bcrypt.hash(mat_khau, 10);
    db.query("INSERT INTO TaiKhoan (ten_dang_nhap, email, mat_khau, ho_ten, vai_tro) VALUES (?, ?, ?, ?, 'staff')", [email, email, hash, ho_ten], (err, kq) => {
        if (err) return loi(res, 409, 'Email này đã tồn tại');
        res.json({ message: 'Đã thêm nhân viên', id_tai_khoan: kq.insertId });
    });
});

app.put('/api/nhanvien/:id/khoa', xacThuc, chiVaiTro('admin'), (req, res) => {
    db.query("UPDATE TaiKhoan SET trang_thai_tk = 'locked' WHERE id_tai_khoan = ? AND vai_tro = 'staff'", [req.params.id], (err) => (err ? loiServer(res) : res.json({ message: 'Đã khóa' })));
});
app.put('/api/nhanvien/:id/mokhoa', xacThuc, chiVaiTro('admin'), (req, res) => {
    db.query("UPDATE TaiKhoan SET trang_thai_tk = 'active' WHERE id_tai_khoan = ? AND vai_tro = 'staff'", [req.params.id], (err) => (err ? loiServer(res) : res.json({ message: 'Đã mở khóa' })));
});

// API: Admin xóa nhân viên (chỉ xóa được nếu chưa có lịch sử ca làm)
app.delete('/api/nhanvien/:id', xacThuc, chiVaiTro('admin'), (req, res) => {
    db.query("SELECT id_ca FROM CaLamViec WHERE id_nhan_vien = ? LIMIT 1", [req.params.id], (err, cas) => {
        if (err) return loiServer(res);
        if (cas.length > 0) return loi(res, 400, 'Nhân viên này đã có lịch sử ca làm việc, chỉ có thể Khóa tài khoản (không được xóa)');
        
        db.query("DELETE FROM TaiKhoan WHERE id_tai_khoan = ? AND vai_tro = 'staff'", [req.params.id], (err2) => {
            if (err2) return loiServer(res);
            res.json({ message: 'Đã xóa nhân viên' });
        });
    });
});

const CONG = process.env.PORT || 3000;
app.listen(CONG, () => console.log(`Backend API đang chạy tại http://localhost:${CONG}`));