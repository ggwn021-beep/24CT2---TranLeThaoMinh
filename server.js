import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'db_quanlykhachsan'
});

db.connect((err) => {
    if (err) console.log('Kết nối MySQL thất bại!', err);
    else console.log('Đã kết nối Database db_quanlykhachsan thành công!');
});

// ---------- PHÒNG ----------
app.get('/api/phong', (req, res) => {
    db.query('SELECT * FROM Phong', (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(result);
    });
});

app.get('/api/phong/:id', (req, res) => {
    db.query('SELECT * FROM Phong WHERE id_phong = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (result.length === 0) return res.status(404).json({ error: 'Không tìm thấy phòng' });
        res.json(result[0]);
    });
});

// Admin: thêm/sửa/xóa phòng
app.post('/api/phong', (req, res) => {
    const { ten_phong, loai_phong, gia_dem } = req.body;
    db.query("INSERT INTO Phong (ten_phong, loai_phong, gia_dem, trang_thai) VALUES (?, ?, ?, 'Sẵn sàng')",
        [ten_phong, loai_phong, gia_dem], (err, result) => {
            if (err) return res.status(500).json({ error: 'Lỗi server' });
            res.json({ message: 'Đã thêm phòng', id_phong: result.insertId });
        });
});

app.put('/api/phong/:id', (req, res) => {
    const { ten_phong, loai_phong, gia_dem, trang_thai } = req.body;
    db.query("UPDATE Phong SET ten_phong=?, loai_phong=?, gia_dem=?, trang_thai=? WHERE id_phong=?",
        [ten_phong, loai_phong, gia_dem, trang_thai, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: 'Lỗi server' });
            res.json({ message: 'Đã cập nhật phòng' });
        });
});

app.delete('/api/phong/:id', (req, res) => {
    db.query("DELETE FROM Phong WHERE id_phong = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Không thể xóa — phòng đang có đơn đặt liên kết' });
        res.json({ message: 'Đã xóa phòng' });
    });
});

// ---------- ĐĂNG NHẬP ----------
app.post('/api/login', (req, res) => {
    const { ten_dang_nhap, mat_khau } = req.body;
    db.query('SELECT * FROM TaiKhoan WHERE ten_dang_nhap = ? AND mat_khau = ?', [ten_dang_nhap, mat_khau], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (result.length === 0) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
        if (result[0].trang_thai_tk === 'locked') return res.status(403).json({ error: 'Tài khoản đã bị khóa' });
        res.json(result[0]);
    });
});

// ---------- ĐƠN ĐẶT PHÒNG (có chặn spam + chặn trùng lịch) ----------
app.get('/api/dondat', (req, res) => {
    const sql = `
        SELECT d.*, p.ten_phong, p.loai_phong, t.ho_ten AS ten_khach
        FROM DonDatPhong d
        JOIN Phong p ON d.id_phong = p.id_phong
        JOIN TaiKhoan t ON d.id_tai_khoan = t.id_tai_khoan
        ORDER BY d.id_don DESC`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(result);
    });
});

app.post('/api/dondat', (req, res) => {
    const { id_tai_khoan, id_phong, ngay_nhan_phong, ngay_tra_phong, tong_tien, phuong_thuc_thanh_toan } = req.body;

    // Chặn spam: tối đa 3 đơn "Chờ duyệt" cùng lúc / 1 tài khoản
    db.query("SELECT COUNT(*) AS so_don FROM DonDatPhong WHERE id_tai_khoan = ? AND trang_thai_don = 'Chờ duyệt'",
        [id_tai_khoan], (err, countResult) => {
            if (err) return res.status(500).json({ error: 'Lỗi server' });
            if (countResult[0].so_don >= 3) {
                return res.status(429).json({ error: 'Bạn đang có quá nhiều đơn chờ duyệt, vui lòng chờ xử lý trước khi đặt thêm' });
            }

            // Chặn trùng lịch: phòng này đã có ai đặt trùng khoảng ngày chưa
            const checkSql = `
                SELECT * FROM DonDatPhong
                WHERE id_phong = ? AND trang_thai_don != 'Đã hủy'
                AND NOT (ngay_tra_phong <= ? OR ngay_nhan_phong >= ?)`;
            db.query(checkSql, [id_phong, ngay_nhan_phong, ngay_tra_phong], (err2, overlap) => {
                if (err2) return res.status(500).json({ error: 'Lỗi server' });
                if (overlap.length > 0) {
                    return res.status(409).json({ error: 'Phòng đã có khách đặt trong khoảng ngày này, vui lòng chọn phòng hoặc ngày khác' });
                }
                db.query(`INSERT INTO DonDatPhong (id_tai_khoan, id_phong, ngay_nhan_phong, ngay_tra_phong, tong_tien, trang_thai_don, phuong_thuc_thanh_toan)
                          VALUES (?, ?, ?, ?, ?, 'Chờ duyệt', ?)`,
                    [id_tai_khoan, id_phong, ngay_nhan_phong, ngay_tra_phong, tong_tien, phuong_thuc_thanh_toan],
                    (err3, result) => {
                        if (err3) return res.status(500).json({ error: 'Lỗi server' });
                        res.json({ message: 'Đặt phòng thành công', id_don: result.insertId });
                    });
            });
        });
});

app.put('/api/dondat/:id/xacnhan-thanhtoan', (req, res) => {
    db.query("UPDATE DonDatPhong SET trang_thai_don = 'Đã xác nhận' WHERE id_don = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Đã xác nhận thanh toán' });
    });
});

app.put('/api/dondat/:id/checkin', (req, res) => {
    db.query('SELECT id_phong FROM DonDatPhong WHERE id_don = ?', [req.params.id], (err, rows) => {
        if (err || rows.length === 0) return res.status(500).json({ error: 'Lỗi server' });
        const idPhong = rows[0].id_phong;
        db.query("UPDATE DonDatPhong SET trang_thai_don = 'Đã check-in' WHERE id_don = ?", [req.params.id], (err2) => {
            if (err2) return res.status(500).json({ error: 'Lỗi server' });
            db.query("UPDATE Phong SET trang_thai = 'Đang thuê' WHERE id_phong = ?", [idPhong], () => {
                res.json({ message: 'Đã check-in' });
            });
        });
    });
});

app.put('/api/dondat/:id/checkout', (req, res) => {
    db.query('SELECT id_phong FROM DonDatPhong WHERE id_don = ?', [req.params.id], (err, rows) => {
        if (err || rows.length === 0) return res.status(500).json({ error: 'Lỗi server' });
        const idPhong = rows[0].id_phong;
        db.query("UPDATE DonDatPhong SET trang_thai_don = 'Đã hoàn tất' WHERE id_don = ?", [req.params.id], (err2) => {
            if (err2) return res.status(500).json({ error: 'Lỗi server' });
            db.query("UPDATE Phong SET trang_thai = 'Sẵn sàng' WHERE id_phong = ?", [idPhong], () => {
                res.json({ message: 'Đã check-out' });
            });
        });
    });
});

// ---------- THỐNG KÊ ----------
app.get('/api/thongke', (req, res) => {
    db.query("SELECT SUM(tong_tien) AS doanh_thu FROM DonDatPhong WHERE trang_thai_don != 'Đã hủy'", (err, r1) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        db.query('SELECT COUNT(*) AS tong_don FROM DonDatPhong', (err2, r2) => {
            db.query("SELECT COUNT(*) AS dang_o FROM DonDatPhong WHERE trang_thai_don = 'Đã check-in'", (err3, r3) => {
                res.json({ doanh_thu: r1[0].doanh_thu || 0, tong_don: r2[0].tong_don, dang_o: r3[0].dang_o });
            });
        });
    });
});

// ---------- QUẢN LÝ NHÂN VIÊN (ADMIN) ----------
app.get('/api/nhanvien', (req, res) => {
    db.query("SELECT id_tai_khoan, ten_dang_nhap, ho_ten, trang_thai_tk FROM TaiKhoan WHERE vai_tro='staff'", (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(result);
    });
});

app.post('/api/nhanvien', (req, res) => {
    const { ten_dang_nhap, mat_khau, ho_ten } = req.body;
    db.query("INSERT INTO TaiKhoan (ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES (?, ?, ?, 'staff')",
        [ten_dang_nhap, mat_khau, ho_ten], (err, result) => {
            if (err) return res.status(500).json({ error: 'Tên đăng nhập đã tồn tại' });
            res.json({ message: 'Đã thêm nhân viên', id_tai_khoan: result.insertId });
        });
});

app.put('/api/nhanvien/:id/khoa', (req, res) => {
    db.query("UPDATE TaiKhoan SET trang_thai_tk='locked' WHERE id_tai_khoan=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Đã khóa' });
    });
});

app.put('/api/nhanvien/:id/mokhoa', (req, res) => {
    db.query("UPDATE TaiKhoan SET trang_thai_tk='active' WHERE id_tai_khoan=?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Đã mở khóa' });
    });
});

// ---------- ĐÁNH GIÁ & HỖ TRỢ (nền tảng cho bước sau) ----------
app.post('/api/danhgia', (req, res) => {
    const { id_don, so_sao, binh_luan } = req.body;
    db.query("INSERT INTO DanhGia (id_don, so_sao, binh_luan) VALUES (?, ?, ?)", [id_don, so_sao, binh_luan], (err) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cảm ơn bạn đã đánh giá' });
    });
});

app.get('/api/danhgia', (req, res) => {
    const sql = `SELECT dg.*, p.ten_phong, tk.ho_ten AS ten_khach FROM DanhGia dg
                 JOIN DonDatPhong d ON dg.id_don=d.id_don
                 JOIN Phong p ON d.id_phong=p.id_phong
                 JOIN TaiKhoan tk ON d.id_tai_khoan=tk.id_tai_khoan
                 ORDER BY dg.ngay_danh_gia DESC`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(result);
    });
});

app.post('/api/tinnhan', (req, res) => {
    const { id_khach_hang, noi_dung, nguoi_gui } = req.body;
    db.query("INSERT INTO TinNhan (id_khach_hang, noi_dung, nguoi_gui) VALUES (?, ?, ?)",
        [id_khach_hang, noi_dung, nguoi_gui], (err) => {
            if (err) return res.status(500).json({ error: 'Lỗi server' });
            res.json({ message: 'Đã gửi' });
        });
});

app.get('/api/tinnhan', (req, res) => {
    const sql = `SELECT t.*, tk.ho_ten AS ten_khach FROM TinNhan t
                 JOIN TaiKhoan tk ON t.id_khach_hang=tk.id_tai_khoan ORDER BY t.thoi_gian ASC`;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(result);
    });
});

app.listen(3000, () => console.log('Backend API đang chạy tại http://localhost:3000'));