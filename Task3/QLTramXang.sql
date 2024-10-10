
-- Tạo cơ sở dữ liệu nếu chưa tồn tại
CREATE DATABASE QLTramXang;

-- Sử dụng cơ sở dữ liệu
USE QLTramXang;

-- Tạo bảng TRAMXANG: Quản lý thông tin về các trạm xăng
CREATE TABLE IF NOT EXISTS TRAMXANG (
    MaTram INT AUTO_INCREMENT PRIMARY KEY,    -- ID của trạm xăng
    TenTram VARCHAR(100) NOT NULL UNIQUE,     -- Tên trạm xăng (không trùng lặp)
    ViTri VARCHAR(255) NOT NULL,              -- Vị trí trạm xăng
    NguoiQL VARCHAR(100) NOT NULL,            -- Người quản lý trạm xăng
    INDEX (TenTram)                           -- Thêm index cho TenTram để tối ưu tìm kiếm
);

-- Tạo bảng HANGHOA: Quản lý thông tin các loại hàng hóa (xăng, dầu)
CREATE TABLE IF NOT EXISTS HANGHOA (
    MaHH INT AUTO_INCREMENT PRIMARY KEY,      -- ID của hàng hoá (xăng, dầu)
    TenHH VARCHAR(50) NOT NULL UNIQUE,        -- Tên hàng hoá (không trùng lặp)
    DonGia DECIMAL(10, 2) NOT NULL CHECK (DonGia > 0),  -- Đơn giá của hàng hoá (phải lớn hơn 0)
    INDEX (TenHH)                             -- Thêm index cho TenHH để tối ưu tìm kiếm
);

-- Tạo bảng TRUBOM: Quản lý thông tin các trụ bơm tại các trạm xăng
CREATE TABLE IF NOT EXISTS TRUBOM (
    MaTru INT AUTO_INCREMENT PRIMARY KEY,         -- ID của trụ bơm
    MaTram INT NOT NULL,                          -- ID của trạm xăng liên kết
    MaHH INT NOT NULL,                            -- ID của hàng hoá được bơm tại trụ
    FOREIGN KEY (MaTram) REFERENCES TRAMXANG(MaTram) 
        ON DELETE CASCADE ON UPDATE CASCADE,      -- Liên kết với bảng TRAMXANG, đồng bộ cập nhật và xóa
    FOREIGN KEY (MaHH) REFERENCES HANGHOA(MaHH) 
        ON DELETE CASCADE ON UPDATE CASCADE       -- Liên kết với bảng HANGHOA, đồng bộ cập nhật và xóa
);

-- Tạo bảng GIAODICH: Lưu trữ thông tin về các giao dịch diễn ra tại các trạm xăng
CREATE TABLE IF NOT EXISTS GIAODICH (
    MaGD INT AUTO_INCREMENT PRIMARY KEY,          -- ID của giao dịch
    MaTru INT NOT NULL,                           -- ID của trụ bơm diễn ra giao dịch
    MaHH INT NOT NULL,                            -- ID của hàng hoá giao dịch
    NgayGD DATE NOT NULL,                         -- Ngày diễn ra giao dịch
    GioGD TIME NOT NULL,                          -- Giờ diễn ra giao dịch
    SoLuong DECIMAL(10, 2) NOT NULL CHECK (SoLuong > 0),  -- Số lượng hàng hoá giao dịch (lít, >0)
    ThanhTien DECIMAL(10, 2) NOT NULL CHECK (ThanhTien > 0),  -- Thành tiền của giao dịch (phải lớn hơn 0)
    TTTT ENUM('Tiền mặt', 'Chờ chuyển khoản') NOT NULL,        -- Trạng thái thanh toán
    FOREIGN KEY (MaTru) REFERENCES TRUBOM(MaTru) 
        ON DELETE CASCADE ON UPDATE CASCADE,      -- Liên kết với bảng TRUBOM
    FOREIGN KEY (MaHH) REFERENCES HANGHOA(MaHH) 
        ON DELETE CASCADE ON UPDATE CASCADE,      -- Liên kết với bảng HANGHOA
    INDEX (MaTru),                                -- Thêm index để tối ưu truy vấn theo MaTru
    INDEX (MaHH)                                  -- Thêm index để tối ưu truy vấn theo MaHH
);
