1. đây là dự án cá nhân dùng cho các thành viên trong clb có thể điểm danh đi đánh cầu hàng tuần
2. dự án này có các chức năng sau:
    - có admin dashboard cho admin đăng nhập và quản lý:
        - thêm/xoá/sửa thành viên
        - thêm/xoá/sửa ngày đánh hàng tuần
        - số tiền dự kiến chi trả (sân + cầu + nước), tiền này sẽ chia đều cho các thành viên
        - số tiền vãng lai được config bởi admin mặc định là 50.000/người/buổi
        - tài khoản admin là fix cứng (user: admin, pass: P@ssw0rd), được set trong env
    - trang điểm danh cho các thành viên
    - cho phép người khác vào đăng ký vãng lai (tên, số lượng, ghi chú)
    - có dùng sepay để tạo mã qf thanh toán cho từng thành viên
    - liên kết với telegram bot để thông báo khi có thành viên thanh toán, có người đăng ký vãng lai, thống kê số người đánh
3. dùng Turos làm database, và sẽ deploy lên vercel (thông tin của turso, vercel có thể dùng chung của folder ../leetcode-daily, nên tách riêng nếu có thể)
4. biến env nên có prefix BCLB