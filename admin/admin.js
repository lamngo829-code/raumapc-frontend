// =========================================================
// KIỂM TRA QUYỀN TRUY CẬP TỪ DATABASE & TỰ ĐỘNG ĐĂNG XUẤT
// =========================================================
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const token = localStorage.getItem('authToken');

if (!currentUser || !token || currentUser.role !== 'admin') {
    alert("⛔ CẢNH BÁO: Bạn không có đặc quyền truy cập khu vực này!");
    window.location.href = '../../index.html';
}

let idleTime = 0; const idleLimit = 15;
const idleInterval = setInterval(() => { idleTime++; if (idleTime >= idleLimit) { clearInterval(idleInterval); alert("⏳ Phiên làm việc đã hết hạn để bảo mật. Hệ thống tự động đăng xuất!"); adminLogout(); } }, 60000);
['mousemove', 'keypress', 'click', 'scroll'].forEach(evt => document.addEventListener(evt, () => idleTime = 0));

window.adminLogout = function () {
    localStorage.removeItem('currentUser'); localStorage.removeItem('authToken');
    if (typeof window.clearDrafts === 'function') window.clearDrafts();
    window.location.href = '../../index.html';
};

const API_PRODUCTS = 'https://raumapc-backend-fms3.onrender.com/api/products';
const API_ORDERS = 'https://raumapc-backend-fms3.onrender.com/api/orders';
const API_COUPONS = 'https://raumapc-backend-fms3.onrender.com/api/admin/coupons';
const API_USERS = 'https://raumapc-backend-fms3.onrender.com/api/admin/users';

function switchTab(tabName) {
    // Đổi màu Menu
    document.querySelectorAll('.sidebar-top .menu-item').forEach(el => el.classList.remove('active'));

    if (tabName === 'dashboard') document.querySelectorAll('.sidebar-top .menu-item')[0].classList.add('active');
    else if (tabName === 'products') document.querySelectorAll('.sidebar-top .menu-item')[1].classList.add('active');
    else if (tabName === 'orders') document.querySelectorAll('.sidebar-top .menu-item')[2].classList.add('active');
    else if (tabName === 'users') document.querySelectorAll('.sidebar-top .menu-item')[3].classList.add('active');
    else if (tabName === 'coupons') document.querySelectorAll('.sidebar-top .menu-item')[4].classList.add('active');
    else document.querySelectorAll('.sidebar-top .menu-item')[5].classList.add('active');

    // Ẩn/Hiện Tab an toàn (Khắc phục lỗi cannot read properties of null)
    const tDash = document.getElementById('tab-dashboard');
    const tProd = document.getElementById('tab-products');
    const tOrd = document.getElementById('tab-orders');
    const tUser = document.getElementById('tab-users');
    const tCoup = document.getElementById('tab-coupons');
    const tRev = document.getElementById('tab-reviews');
    const tSet = document.getElementById('tab-home-settings');

    if (tDash) tDash.style.display = (tabName === 'dashboard') ? 'block' : 'none';
    if (tProd) tProd.style.display = (tabName === 'products') ? 'block' : 'none';
    if (tOrd) tOrd.style.display = (tabName === 'orders') ? 'block' : 'none';
    if (tUser) tUser.style.display = (tabName === 'users') ? 'block' : 'none';
    if (tCoup) tCoup.style.display = (tabName === 'coupons') ? 'block' : 'none';
    if (tRev) tRev.style.display = (tabName === 'reviews') ? 'block' : 'none';
    if (tSet) tSet.style.display = (tabName === 'home-settings') ? 'block' : 'none';

    // Chạy lệnh tải dữ liệu tương ứng
    if (tabName === 'dashboard') loadRevenue();
    else if (tabName === 'orders') loadOrders();
    else if (tabName === 'products') { loadProducts(); }
    else if (tabName === 'coupons') loadCoupons();
    else if (tabName === 'users') loadUsers();
    else if (tabName === 'reviews') loadReviews();
    else loadHomeSettings();
}

// ================= KHU VỰC QUẢN LÝ USER MỚI THÊM =================
function loadUsers() {
    fetch(API_USERS, { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('user-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chưa có khách hàng nào đăng ký!</td></tr>';

            data.forEach(u => {
                let dateStr = new Date(u.createdAt).toLocaleDateString('vi-VN');

                let lastLogin = u.loginHistory && u.loginHistory.length > 0 ? u.loginHistory[u.loginHistory.length - 1] : 'Chưa đăng nhập';
                let loginCount = u.loginHistory ? u.loginHistory.length : 0;

                let lockBtnText = u.isLocked ? "Mở Khóa" : "Khóa TK";
                let lockBtnColor = u.isLocked ? "#059669" : "#ea580c";
                let lockBgColor = u.isLocked ? "#dcfce7" : "#ffedd5";
                let statusText = u.isLocked ? '<span style="color:#dc2626;font-weight:bold;">Đã Bị Khóa</span>' : '<span style="color:#059669;font-weight:bold;">Hoạt động</span>';

                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight:bold; color:#1435c3;">${u.fullName}<br><span style="font-size:12px; color:#666;">${u.email}</span></td>
                        <td style="font-weight:bold;">${u.username}<br>${statusText}</td>
                        <td><span style="font-size:13px; color:#444;">${dateStr}</span></td>
                        <td>
                            <span style="font-size:13px; color:#10b981; font-weight:bold;">${lastLogin}</span><br>
                            <span style="font-size:11px; color:#888;">(Tổng: ${loginCount} lần)</span>
                        </td>
                        <td>
                            <!-- NÚT ĐỔI MẬT KHẨU MỚI -->
                            <button onclick="changeUserPassword('${u._id}', '${u.username}')" style="background:#e0f2fe; color:#0284c7; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:5px; margin-bottom:5px;">Đổi MK</button>
                            <button onclick="toggleLockUser('${u._id}')" style="background:${lockBgColor}; color:${lockBtnColor}; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:5px; margin-bottom:5px;">${lockBtnText}</button>
                            <button onclick="deleteUser('${u._id}')" style="background:#ffe2e5; color:#dc2626; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">Xóa</button>
                        </td>
                    </tr>
                `;
            });
        });
}

// Bật tắt trạng thái Khóa
window.toggleLockUser = function (id) {
    if (confirm("Xác nhận thay đổi trạng thái Khóa / Mở Khóa của tài khoản này? (Tài khoản bị khóa sẽ bị văng khỏi web ngay lập tức)")) {
        fetch(`${API_USERS}/${id}/lock`, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => res.json())
            .then(data => {
                window.showAdminAlert(data.message, data.success);
                loadUsers();
            });
    }
};

window.deleteUser = function (id) {
    if (confirm("⚠️ CẢNH BÁO: BẠN CÓ CHẮC MUỐN XÓA TÀI KHOẢN NÀY KHỎI CƠ SỞ DỮ LIỆU?\nHành động này không thể hoàn tác!")) {
        fetch(`${API_USERS}/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => res.json())
            .then(data => {
                window.showAdminAlert(data.message, data.success);
                loadUsers();
            });
    }
};

// ==========================================
// TÍNH NĂNG ĐỔI MẬT KHẨU KHÁCH HÀNG BỞI ADMIN (GIAO DIỆN MỚI)
// ==========================================
let currentUserIdForPasswordChange = null;

// Hàm mở Modal
window.changeUserPassword = function (id, username) {
    currentUserIdForPasswordChange = id;
    document.getElementById('cpm-username').innerText = 'Tài khoản: ' + username;
    document.getElementById('cpm-input').value = '';

    // Gắn sự kiện click cho nút Xác nhận (tránh lỗi cộng dồn sự kiện)
    const submitBtn = document.getElementById('cpm-submit-btn');
    submitBtn.onclick = executeChangeUserPassword;

    document.getElementById('custom-password-modal').style.display = 'flex';
    // Tự động focus vào ô nhập
    setTimeout(() => document.getElementById('cpm-input').focus(), 100);
};

// Hàm đóng Modal
window.closeChangePasswordModal = function () {
    document.getElementById('custom-password-modal').style.display = 'none';
    currentUserIdForPasswordChange = null;
};

// Hàm gửi dữ liệu lên Backend
async function executeChangeUserPassword() {
    if (!currentUserIdForPasswordChange) return;

    const newPass = document.getElementById('cpm-input').value.trim();

    if (newPass.length < 6) {
        return window.showAdminAlert("Mật khẩu mới phải từ 6 ký tự trở lên!", false);
    }

    const btn = document.getElementById('cpm-submit-btn');
    btn.innerText = "ĐANG XỬ LÝ...";
    btn.disabled = true;

    try {
        let res = await fetch(`https://raumapc-backend-fms3.onrender.com/api/admin/users/${currentUserIdForPasswordChange}/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ newPassword: newPass })
        });

        let data = await res.json();

        if (res.ok && data.success) {
            closeChangePasswordModal();
            window.showAdminAlert(data.message, true);
        } else {
            window.showAdminAlert(data.message || "Đã xảy ra lỗi khi đổi mật khẩu!", false);
        }
    } catch (e) {
        window.showAdminAlert("Lỗi kết nối đến máy chủ!", false);
    } finally {
        btn.innerText = "Xác nhận Đổi";
        btn.disabled = false;
    }
}

function loadCoupons() {
    fetch(API_COUPONS, { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('coupon-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Kho chưa có mã giảm giá nào!</td></tr>';

            data.forEach(c => {
                let statusHtml = c.isActive
                    ? '<span class="status-badge" style="background:#e8f5e9; color:#28a745;">Đang hoạt động</span>'
                    : '<span class="status-badge" style="background:#ffe2e5; color:#dc2626;">Tạm khóa</span>';

                tbody.innerHTML += `
                    <tr>
                        <td style="font-weight:bold; color:#d70018; font-size:18px;">${c.code}</td>
                        <td style="font-weight:bold; color:#1435c3; font-size:16px;">Giảm ${c.discountPercent}%</td>
                        <td>${statusHtml}</td>
                        <td><button onclick="deleteCoupon('${c._id}')" style="background:#ffe2e5; color:#dc2626; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">Xóa</button></td>
                    </tr>
                `;
            });
        });
}

window.submitCoupon = async function () {
    const code = document.getElementById('couponCode').value.toUpperCase();
    const percent = document.getElementById('couponPercent').value;
    const isActive = document.getElementById('couponStatus').value === 'true';

    if (!code || !percent) return window.showAdminAlert("Vui lòng nhập đủ thông tin!", false);

    try {
        let res = await fetch(API_COUPONS, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ code, discountPercent: percent, isActive })
        });
        let data = await res.json();
        if (res.ok) {
            window.showAdminAlert(data.message, true); document.getElementById('couponForm').reset(); loadCoupons();
        } else { window.showAdminAlert(data.message, false); }
    } catch (e) { window.showAdminAlert("Lỗi kết nối máy chủ!", false); }
};

window.deleteCoupon = function (id) {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn Mã giảm giá này không?")) {
        fetch(`${API_COUPONS}/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } })
            .then(res => res.json())
            .then(data => { window.showAdminAlert(data.message, data.success); loadCoupons(); });
    }
};

let allProducts = [];
function loadProducts() {
    // VÁ LỖI 1: Thêm ?limit=1000 để Admin thấy được TOÀN BỘ sản phẩm trong kho
    fetch(API_PRODUCTS + '?limit=1000').then(res => res.json()).then(result => {

        // VÁ LỖI 2: Mở khóa đúng mảng dữ liệu (result.data)
        const products = result.data ? result.data : result;

        allProducts = products;
        const tbody = document.getElementById('product-table-body'); tbody.innerHTML = '';

        let lowStockCount = 0;

        products.forEach(sp => {
            let currentStock = sp.stock !== undefined ? sp.stock : 10;
            if (currentStock < 5) lowStockCount++;

            let statusColor = sp.status === 'Còn hàng' ? '#059669' : (sp.status === 'Hết hàng' ? '#dc2626' : '#f59e0b');
            let stockHtml = currentStock < 5
                ? `<span style="color: #dc2626; font-weight: bold; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">Kho: ${currentStock} (Sắp hết)</span>`
                : `<span style="color: #059669; font-weight: bold;">Kho: ${currentStock}</span>`;

            // KHAI BÁO BIẾN Ở NGOÀI CHUỖI HTML
            let displayPrice = typeof sp.price === 'number' 
                ? new Intl.NumberFormat('vi-VN').format(sp.price) + 'đ' 
                : (sp.price || '0đ');

            // BÂY GIỜ MỚI CỘNG VÀO HTML
            tbody.innerHTML += `
                <tr>
                    <td><img src="${sp.img}" style="width:45px; height:45px; border-radius:6px; object-fit:cover;"></td>
                    <td style="font-weight:bold; color:#2b3674;">${sp.name}<br><span style="font-size:12px; color:#888; font-weight:normal;">Mã SP: <span style="color:#d70018;">${sp.productId || sp.id.slice(-6).toUpperCase()}</span></span></td>
                    <td style="color:#d70018; font-weight:bold;">${displayPrice}<br>
                        <span style="font-size:12px; color:${statusColor}">${sp.status || 'Còn hàng'}</span> • 
                        <span style="font-size:12px;">${stockHtml}</span>
                    </td>
                    <td>
                        <button onclick="editProduct('${sp.id}')" style="background:#e3f2fd; color:#1976d2; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:5px;">Sửa</button>
                        <button onclick="deleteProduct('${sp.id}')" style="background:#ffe2e5; color:#d70018; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold;">Xóa</button>
                    </td>
                </tr>
            `;
        });

        const alertBox = document.getElementById('low-stock-alert');
        const alertText = document.getElementById('low-stock-text');
        if (alertBox && alertText) {
            if (lowStockCount > 0) {
                alertBox.style.display = 'block';
                alertText.innerText = `Hệ thống phát hiện có ${lowStockCount} sản phẩm sắp hết hàng (Kho < 5). Vui lòng kiểm tra và nhập thêm!`;
            } else { alertBox.style.display = 'none'; }
        }
    });
}

function editProduct(id) {
    const sp = allProducts.find(item => item.id === id); if (!sp) return;
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = sp.id;
    if (document.getElementById('productId')) document.getElementById('productId').value = sp.productId || '';
    if (document.getElementById('name')) document.getElementById('name').value = sp.name || '';
    if (document.getElementById('price')) {
        let displayP = typeof sp.price === 'number' ? new Intl.NumberFormat('vi-VN').format(sp.price) + 'đ' : (sp.price || '');
        document.getElementById('price').value = displayP;
    }
    if (document.getElementById('warranty')) document.getElementById('warranty').value = sp.warranty || '36 Tháng';
    if (document.getElementById('status')) document.getElementById('status').value = sp.status || 'Còn hàng';
    if (document.getElementById('stock')) document.getElementById('stock').value = sp.stock !== undefined ? sp.stock : 10;

    const catArray = (sp.category || '').split(',').map(c => c.trim());
    if (document.getElementById('category1')) document.getElementById('category1').value = catArray[0] || '';
    if (document.getElementById('category2')) document.getElementById('category2').value = catArray[1] || '';
    if (document.getElementById('category3')) document.getElementById('category3').value = catArray[2] || '';
    if (document.getElementById('img')) document.getElementById('img').value = sp.img || '';

    if (sp.img && sp.img.length > 5) {
        if (document.getElementById('image-preview')) { document.getElementById('image-preview').src = sp.img; document.getElementById('image-preview').style.display = 'block'; }
        if (document.getElementById('drop-zone-text')) document.getElementById('drop-zone-text').style.display = 'none';
        if (document.getElementById('btn-remove-img')) document.getElementById('btn-remove-img').style.display = 'block';
    } else { if (typeof resetImageUploader === 'function') resetImageUploader(); }

    if (document.getElementById('specs')) document.getElementById('specs').value = sp.specs || '';
    if (document.getElementById('description')) document.getElementById('description').value = sp.description || '';
    if (document.getElementById('brand')) document.getElementById('brand').value = sp.brand || '';

    if (document.getElementById('form-title')) document.getElementById('form-title').innerText = "✏️ Cập Nhật Sản Phẩm";
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) { btnSubmit.innerText = "LƯU CẬP NHẬT"; btnSubmit.style.background = "#28a745"; }
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) { btnCancel.style.display = "block"; btnCancel.innerText = "HỦY SỬA"; }

    galleryBase64 = sp.gallery || []; if (typeof window.renderGallery === 'function') window.renderGallery();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    if (document.getElementById('productForm')) document.getElementById('productForm').reset();
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
    if (document.getElementById('productId')) document.getElementById('productId').value = '';
    if (document.getElementById('status')) document.getElementById('status').value = 'Còn hàng';
    if (document.getElementById('stock')) document.getElementById('stock').value = '10';
    if (document.getElementById('category1')) document.getElementById('category1').value = '';
    if (document.getElementById('category2')) document.getElementById('category2').value = '';
    if (document.getElementById('category3')) document.getElementById('category3').value = '';
    if (document.getElementById('form-title')) document.getElementById('form-title').innerText = "➕ Thêm Sản Phẩm Mới";

    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) { btnSubmit.innerText = "LƯU SẢN PHẨM"; btnSubmit.style.background = "#1435c3"; }
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) { btnCancel.style.display = "block"; btnCancel.innerText = "XÓA BẢN NHÁP"; }

    galleryBase64 = []; if (typeof window.renderGallery === 'function') window.renderGallery();
    if (typeof resetImageUploader === 'function') resetImageUploader();
    if (typeof window.clearDrafts === 'function') window.clearDrafts();
}

const formEl = document.getElementById('productForm'); const formBtn = document.getElementById('btn-submit');
if (formEl) { formEl.setAttribute('novalidate', 'true'); formEl.addEventListener('submit', function (e) { e.preventDefault(); submitProductForm(e); }); }
if (formBtn) { formBtn.setAttribute('type', 'button'); formBtn.onclick = function (e) { e.preventDefault(); submitProductForm(e); }; }

async function submitProductForm(e) {
    if (e) e.preventDefault();
    const cat1 = document.getElementById('category1') ? document.getElementById('category1').value : '';
    const cat2 = document.getElementById('category2') ? document.getElementById('category2').value : '';
    const cat3 = document.getElementById('category3') ? document.getElementById('category3').value : '';
    let combinedCategory = [cat1, cat2, cat3].filter(c => c && c !== '').join(', ');
    if (combinedCategory === '') return window.showAdminAlert("Vui lòng chọn ít nhất 1 Danh mục sản phẩm!", false);

    const btn = document.getElementById('btn-submit'); const oldText = btn ? btn.innerText : "LƯU CẬP NHẬT";
    if (btn) btn.innerText = "ĐANG LƯU...";

    const brandInput = document.getElementById('brand'); const brandValue = brandInput ? brandInput.value.toLowerCase().trim() : '';

    let finalImageBase64 = ''; const hiddenImgEl = document.getElementById('img');
    if (hiddenImgEl && hiddenImgEl.value.trim() !== '') { finalImageBase64 = hiddenImgEl.value; }
    else { const imagePreviewEl = document.getElementById('image-preview'); if (imagePreviewEl && imagePreviewEl.style.display === 'block') { finalImageBase64 = imagePreviewEl.getAttribute('src'); } }
    if (!finalImageBase64 || finalImageBase64 === '') { if (btn) btn.innerText = oldText; return window.showAdminAlert("Vui lòng tải lên Hình Ảnh Sản Phẩm!", false); }

    // Dọn dẹp ô nhập Giá: "5.000.000đ" -> 5000000
    let rawPriceInput = document.getElementById('price') ? document.getElementById('price').value : '0';
    let numericPrice = parseInt(rawPriceInput.replace(/\D/g, '')) || 0;

    const sp = {
        productId: document.getElementById('productId') ? document.getElementById('productId').value : '',
        name: document.getElementById('name') ? document.getElementById('name').value : '',
        price: numericPrice,
        img: finalImageBase64, warranty: document.getElementById('warranty') ? document.getElementById('warranty').value : '36 Tháng',
        status: document.getElementById('status') ? document.getElementById('status').value : 'Còn hàng',
        stock: parseInt(document.getElementById('stock') ? document.getElementById('stock').value : 10) || 0,
        category: combinedCategory, brand: brandValue,
        specs: document.getElementById('specs') ? document.getElementById('specs').value : '',
        description: document.getElementById('description') ? document.getElementById('description').value : '',
        gallery: galleryBase64
    };

    const editId = document.getElementById('edit-id') ? document.getElementById('edit-id').value : '';
    const url = editId !== '' ? `${API_PRODUCTS}/${editId}` : API_PRODUCTS; const method = editId !== '' ? 'PUT' : 'POST';

    try {
        let res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sp) });
        if (!res.ok) throw new Error("Server error");
        if (typeof window.showAdminAlert === 'function') window.showAdminAlert(editId !== '' ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm mới thành công!", true);
        if (typeof window.clearDrafts === 'function') window.clearDrafts();
        if (typeof cancelEdit === 'function') cancelEdit();
        if (typeof loadProducts === 'function') loadProducts();
        if (btn) btn.innerText = "LƯU SẢN PHẨM";
    } catch (err) {
        if (typeof window.showAdminAlert === 'function') window.showAdminAlert("Máy chủ đang ngủ đông. Hệ thống đang tự động đánh thức, vui lòng chờ 5-10 giây...", false);
        if (btn) btn.innerText = "ĐANG ĐÁNH THỨC...";
        setTimeout(async () => {
            try {
                let retryRes = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sp) });
                if (!retryRes.ok) throw new Error("Retry failed");
                document.getElementById('admin-custom-alert').style.display = 'none';
                window.showAdminAlert(editId !== '' ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm mới thành công!", true);
                if (typeof window.clearDrafts === 'function') window.clearDrafts();
                if (typeof cancelEdit === 'function') cancelEdit();
                if (typeof loadProducts === 'function') loadProducts();
                if (btn) btn.innerText = "LƯU SẢN PHẨM";
            } catch (retryErr) {
                window.showAdminAlert("Vẫn chưa thể kết nối. Vui lòng kiểm tra mạng và ấn Lưu lại!", false);
                if (btn) btn.innerText = oldText;
            }
        }, 5000);
    }
}

function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này?')) {
        fetch(`${API_PRODUCTS}/${id}`, { method: 'DELETE' }).then(() => { window.showAdminAlert("Đã xóa sản phẩm thành công!", true); loadProducts(); });
    }
}

function loadOrders() {
    fetch(API_ORDERS + '?v=' + new Date().getTime()).then(res => res.json()).then(orders => {
        const tbody = document.getElementById('order-table-body'); tbody.innerHTML = '';
        if (orders.length === 0) return tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Kho chưa có đơn hàng nào!</td></tr>';
        orders.reverse().forEach(order => {
            let itemsHtml = order.items.map(item => `<div style="margin-bottom:4px;">- ${item.name} <strong style="color:#d70018;">(x${item.quantity})</strong></div>`).join('');
            let badgeColor = "#1976d2"; let badgeBg = "#e3f2fd";
            if (order.status === "Đang giao hàng") { badgeColor = "#ff9800"; badgeBg = "#fff3e0"; }
            if (order.status === "Hoàn thành") { badgeColor = "#28a745"; badgeBg = "#e8f5e9"; }
            if (order.status === "Đã hủy") { badgeColor = "#dc3545"; badgeBg = "#ffe2e5"; }
            tbody.innerHTML += `<tr><td style="font-weight:bold; color:#1435c3; font-size: 16px;">${order.orderId}<br><span style="font-size:12px; color:#888; font-weight:normal;">${order.date}</span></td><td style="font-weight:bold;">${order.username}</td><td style="font-size:13px; color:#444;">${itemsHtml}</td><td style="color:#d70018; font-weight:bold; font-size:16px;">${new Intl.NumberFormat('vi-VN').format(order.total)}đ</td><td><span class="status-badge" style="color:${badgeColor}; background:${badgeBg};">${order.status}</span></td><td><select class="status-select" onchange="changeOrderStatus('${order.orderId}', this.value)"><option value="Chờ duyệt" ${order.status === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option><option value="Đang giao hàng" ${order.status === 'Đang giao hàng' ? 'selected' : ''}>Giao hàng</option><option value="Hoàn thành" ${order.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option><option value="Đã hủy" ${order.status === 'Đã hủy' ? 'selected' : ''}>Hủy đơn</option></select></td><td><button onclick="deleteOrder('${order.orderId}')" style="background:#ffe2e5; color:#dc2626; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#ffe2e5'">Xóa</button></td></tr>`;
        });
    });
}
function changeOrderStatus(orderId, newStatus) { fetch(`${API_ORDERS}/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }).then(res => res.json()).then(data => { loadOrders(); loadRevenue(); }).catch(err => alert("Lỗi cập nhật!")); }
function deleteOrder(orderId) {
    if (confirm(`⚠️ CẢNH BÁO NGUY HIỂM\n\nBạn có chắc chắn muốn xóa vĩnh viễn đơn hàng #${orderId} không?`)) {
        fetch(`${API_ORDERS}/${orderId}`, { method: 'DELETE' }).then(res => res.json()).then(data => { if (data.success) { if (typeof window.showAdminAlert === 'function') window.showAdminAlert(data.message, true); loadOrders(); loadRevenue(); } else { if (typeof window.showAdminAlert === 'function') window.showAdminAlert(data.message, false); } }).catch(err => { if (typeof window.showAdminAlert === 'function') window.showAdminAlert("Lỗi kết nối máy chủ!", false); });
    }
}

loadProducts();

let chartInstances = {}; // Lưu trữ để hủy biểu đồ cũ, chống lỗi đè nháy

function createChart(canvasId, type, label, labelsData, dataData, color) {
    const ctxEl = document.getElementById(canvasId);
    if (!ctxEl) return;

    // Hủy biểu đồ cũ nếu đã vẽ trước đó
    if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

    chartInstances[canvasId] = new Chart(ctxEl.getContext('2d'), {
        type: type, // 'bar' cho cột đứng, 'line' cho biểu đồ đường
        data: {
            labels: labelsData.length > 0 ? labelsData : ['Trống'],
            datasets: [{
                label: label,
                data: dataData.length > 0 ? dataData : [0],
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1,
                borderRadius: type === 'bar' ? 6 : 0,
                tension: 0.3, // Làm cong đường line
                fill: type === 'line' ? { target: 'origin', above: color.replace('1)', '0.1)') } : false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function loadRevenue() {
    // 1. Tải số liệu Thống Kê Thẻ
    fetch('https://raumapc-backend-fms3.onrender.com/api/admin/revenue?v=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            if (document.getElementById('revenue-total')) document.getElementById('revenue-total').innerText = new Intl.NumberFormat('vi-VN').format(data.totalRevenue || 0) + ' đ';
            if (document.getElementById('revenue-orders')) document.getElementById('revenue-orders').innerText = data.totalOrders || 0;
            if (document.getElementById('rev-week')) document.getElementById('rev-week').innerText = new Intl.NumberFormat('vi-VN').format(data.weekRev || 0) + ' đ';
            if (document.getElementById('rev-month')) document.getElementById('rev-month').innerText = new Intl.NumberFormat('vi-VN').format(data.monthRev || 0) + ' đ';
            if (document.getElementById('rev-year')) document.getElementById('rev-year').innerText = new Intl.NumberFormat('vi-VN').format(data.yearRev || 0) + ' đ';
        }).catch(err => console.error("Lỗi tải doanh thu:", err));

    // 2. Tải và vẽ 4 loại Biểu đồ
    fetch('https://raumapc-backend-fms3.onrender.com/api/admin/revenue-chart', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.json())
        .then(data => {
            createChart('chartDaily', 'bar', 'Doanh thu Ngày (VNĐ)', data.daily.labels, data.daily.data, 'rgba(20, 53, 195, 0.9)'); // Màu xanh đậm

            createChart('chartWeekly', 'bar', 'Doanh thu Tuần (VNĐ)', data.weekly.labels, data.weekly.data, 'rgba(16, 185, 129, 0.9)');

            createChart('chartMonthly', 'bar', 'Doanh thu Tháng (VNĐ)', data.monthly.labels, data.monthly.data, 'rgba(245, 158, 11, 0.9)'); // Màu cam
            createChart('chartYearly', 'bar', 'Doanh thu Năm (VNĐ)', data.yearly.labels, data.yearly.data, 'rgba(139, 92, 246, 0.9)'); // Màu tím
        }).catch(err => console.error("Lỗi vẽ biểu đồ:", err));
}

// Khi vừa vào Admin, mặc định tải màn hình Dashboard
loadRevenue();

// ================= HỆ THỐNG KÉO THẢ & NÉN ẢNH =================
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const dropZoneText = document.getElementById('drop-zone-text');
const imgHiddenInput = document.getElementById('img');
const btnRemoveImg = document.getElementById('btn-remove-img');

if (dropZone) {
    // Ngăn chặn hành vi mặc định của trình duyệt để cho phép thả file
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#1435c3';
        dropZone.style.background = '#eef2ff';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.background = '#f8fafc';
    });

    // Xử lý khi người dùng thả file vào
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.background = '#f8fafc';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files; // Gắn file bị thả vào thẻ input ẩn
            processImageFile(e.dataTransfer.files[0]);
        }
    });

    // MỚI: Bổ sung sự kiện click vào dropZone để mở cửa sổ chọn file
    dropZone.addEventListener('click', () => {
        if (fileInput) fileInput.click();
    });
}

// Xử lý khi người dùng ấn nút "Chọn tệp" hoặc click vào khung
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processImageFile(e.target.files[0]);
        }
    });
}

if (btnRemoveImg) {
    btnRemoveImg.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetImageUploader();
    });
}

function resetImageUploader() {
    if (imgHiddenInput) imgHiddenInput.value = '';
    if (fileInput) fileInput.value = '';
    if (imagePreview) { imagePreview.src = ''; imagePreview.style.display = 'none'; }
    if (btnRemoveImg) btnRemoveImg.style.display = 'none';
    if (dropZoneText) dropZoneText.style.display = 'block';
}

function processImageFile(file) {
    if (!file.type.match('image.*')) return alert("Vui lòng chỉ chọn file hình ảnh!");
    if (file.size > 2 * 1024 * 1024) return alert("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 500;
            let width = img.width;
            let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
            if (imgHiddenInput) imgHiddenInput.value = dataUrl;
            if (imagePreview) { imagePreview.src = dataUrl; imagePreview.style.display = 'block'; }
            if (dropZoneText) dropZoneText.style.display = 'none';
            if (btnRemoveImg) btnRemoveImg.style.display = 'block';
        }
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.showAdminAlert = function (message, isSuccess = true, callback = null) {
    let modal = document.getElementById('admin-custom-alert');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-custom-alert';
        modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); z-index: 999999; justify-content: center; align-items: center; backdrop-filter: blur(4px);';
        modal.innerHTML = `
            <div style="background: #fff; padding: 30px 25px; border-radius: 16px; width: 350px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transform: scale(0.95); animation: popIn 0.2s forwards;">
                <div id="aca-icon" style="margin-bottom: 15px;"></div>
                <h3 id="aca-title" style="margin-bottom: 10px; font-size: 20px; font-weight: bold;">Thông báo</h3>
                <p id="aca-message" style="font-size: 15px; color: #475569; margin-bottom: 25px; line-height: 1.5;"></p>
                <button id="aca-btn" style="background: #1435c3; color: white; border: none; padding: 12px 35px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; transition: 0.2s; width: 100%;">Đồng ý</button>
            </div>
            <style>@keyframes popIn { to { transform: scale(1); } }</style>
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('aca-message').innerText = message.replace(/^([❌✅🎉👑⚠️🗑️⛔⏳]\s*)/, '');
    const iconBox = document.getElementById('aca-icon');
    const title = document.getElementById('aca-title');
    if (isSuccess) {
        iconBox.innerHTML = '<div style="background: #dcfce7; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
        title.innerText = 'Thành Công!'; title.style.color = '#059669';
    } else {
        iconBox.innerHTML = '<div style="background: #fee2e2; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>';
        title.innerText = 'Cảnh Báo!'; title.style.color = '#dc2626';
    }
    modal.style.display = 'flex';
    document.getElementById('aca-btn').onclick = function () { modal.style.display = 'none'; if (callback) callback(); };
};

const draftFields = ['productId', 'brand', 'name', 'price', 'warranty', 'status', 'stock', 'category1', 'category2', 'category3', 'specs', 'description'];

window.clearDrafts = function () { draftFields.forEach(id => localStorage.removeItem('draft_product_' + id)); };

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('edit-id') && document.getElementById('edit-id').value === '') {
        draftFields.forEach(id => {
            const el = document.getElementById(id);
            const savedValue = localStorage.getItem('draft_product_' + id);
            if (el && savedValue !== null) el.value = savedValue;
        });
        const btnCancel = document.getElementById('btn-cancel');
        if (btnCancel) { btnCancel.style.display = 'block'; btnCancel.innerText = 'XÓA BẢN NHÁP'; }
    }
});

const prodForm = document.getElementById('productForm');
if (prodForm) {
    prodForm.addEventListener('input', (e) => {
        if (draftFields.includes(e.target.id)) {
            if (document.getElementById('edit-id') && document.getElementById('edit-id').value === '') localStorage.setItem('draft_product_' + e.target.id, e.target.value);
        }
    });
}

let galleryBase64 = [];
const galleryInput = document.getElementById('gallery-input');
const galleryPreview = document.getElementById('gallery-preview');

window.renderGallery = function () {
    if (!galleryPreview) return;
    galleryPreview.innerHTML = '';
    galleryBase64.forEach((dataUrl, index) => {
        galleryPreview.innerHTML += `<div style="position: relative; display: inline-block; flex-shrink: 0; margin-top: 5px; margin-right: 5px;"><img src="${dataUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;"><button type="button" onclick="removeGalleryImage(${index})" style="position: absolute; top: -8px; right: -8px; background: #d70018; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; font-weight: bold; cursor: pointer;">X</button></div>`;
    });
};
window.removeGalleryImage = function (index) { galleryBase64.splice(index, 1); renderGallery(); if (galleryBase64.length === 0 && galleryInput) galleryInput.value = ''; };

if (galleryInput) {
    galleryInput.addEventListener('change', function (e) {
        const files = Array.from(e.target.files); let loadedCount = 0; galleryBase64 = [];
        files.forEach(file => {
            if (!file.type.match('image.*')) return;
            const reader = new FileReader();
            reader.onload = function (evt) {
                const img = new Image();
                img.onload = function () {
                    const canvas = document.createElement('canvas'); const MAX_WIDTH = 600; let width = img.width; let height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                    galleryBase64.push(canvas.toDataURL('image/jpeg', 0.8)); loadedCount++;
                    if (loadedCount === files.length) renderGallery();
                }
                img.src = evt.target.result;
            }
            reader.readAsDataURL(file);
        });
    });
}

function loadHomeSettings() {
    fetch('https://raumapc-backend-fms3.onrender.com/api/settings/home').then(res => res.json()).then(data => {
        const defaultTitles = ['VGA - Card Màn Hình', 'Ổ Cứng', 'RAM - Bộ Nhớ Trong', 'Mainboard - Bo mạch chủ', 'Chuột Không Dây', 'Màn Hình Máy Tính'];
        for (let i = 1; i <= 6; i++) {
            let titleEl = document.getElementById(`home-title-${i}`); if (titleEl) titleEl.value = data[`homeTitle${i}`] || defaultTitles[i - 1];
            for (let j = 1; j <= 6; j++) { let elId = `home-sp${i}-${j}`; let el = document.getElementById(elId); if (el) el.value = data[elId] || ''; }
        }
    }).catch(err => console.error("Lỗi tải cấu hình:", err));
}
async function syncSettingsToCloud(alertMessage) {
    let configData = {};
    for (let i = 1; i <= 6; i++) {
        let titleEl = document.getElementById(`home-title-${i}`); if (titleEl) configData[`homeTitle${i}`] = titleEl.value;
        for (let j = 1; j <= 6; j++) { let elId = `home-sp${i}-${j}`; let el = document.getElementById(elId); if (el) configData[elId] = el.value; }
    }
    try {
        const btnTitle = document.querySelector('button[onclick="saveHomeSettings()"]'); const btnPro = document.querySelector('button[onclick="saveHomeProducts()"]');
        if (btnTitle) btnTitle.innerText = "ĐANG ĐỒNG BỘ CLOUD..."; if (btnPro) btnPro.innerText = "ĐANG ĐỒNG BỘ CLOUD...";
        const token = localStorage.getItem('authToken');
        let res = await fetch('https://raumapc-backend-fms3.onrender.com/api/settings/home', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(configData) });
        if (res.ok) { if (typeof window.showAdminAlert === 'function') window.showAdminAlert(alertMessage, true); } else { if (typeof window.showAdminAlert === 'function') window.showAdminAlert("Lỗi bảo mật hoặc máy chủ!", false); }
        if (btnTitle) btnTitle.innerText = "LƯU TÙY CHỈNH TIÊU ĐỀ"; if (btnPro) btnPro.innerText = "LƯU TÙY CHỈNH SẢN PHẨM";
    } catch (e) { if (typeof window.showAdminAlert === 'function') window.showAdminAlert("Lỗi mạng khi lưu Cloud!", false); }
}
window.saveHomeSettings = function () { syncSettingsToCloud("Đã lưu Tiêu đề trang chủ lên Cloud thành công!"); }
window.saveHomeProducts = function () { syncSettingsToCloud("Đã lưu Cấu hình Sản phẩm lên Cloud thành công!"); }

// ==========================================
// TÍNH NĂNG ĐỔI MẬT KHẨU ADMIN
// ==========================================
window.changeAdminPassword = async function () {
    const newPass = document.getElementById('adminNewPass').value.trim();

    if (!newPass || newPass.length < 6) {
        return window.showAdminAlert("Mật khẩu mới phải từ 6 ký tự trở lên!", false);
    }

    if (!confirm("⚠️ CẢNH BÁO BẢO MẬT:\n\nBạn có chắc chắn muốn đổi mật khẩu Admin sang mật khẩu mới này không?")) return;

    try {
        let res = await fetch('https://raumapc-backend-fms3.onrender.com/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ newPassword: newPass })
        });

        let data = await res.json();

        if (res.ok && data.success) {
            window.showAdminAlert(data.message, true);
            document.getElementById('adminNewPass').value = ''; // Xóa trắng ô nhập sau khi đổi thành công
        } else {
            window.showAdminAlert(data.message || "Đã xảy ra lỗi khi đổi mật khẩu!", false);
        }
    } catch (e) {
        window.showAdminAlert("Lỗi kết nối đến máy chủ!", false);
    }
};

// ==========================================
// TÍNH NĂNG QUẢN LÝ BÌNH LUẬN & ĐÁNH GIÁ
// ==========================================
function loadReviews() {
    fetch('https://raumapc-backend-fms3.onrender.com/api/admin/comments', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('review-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';
            if (!data || data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Hệ thống chưa có đánh giá nào!</td></tr>';

            data.forEach(c => {
                let stars = '<span style="color:#f59e0b; letter-spacing:1px; font-size:14px;">' + '★'.repeat(c.rating) + '<span style="color:#e2e8f0">' + '★'.repeat(5 - c.rating) + '</span></span>';
                let imgHtml = c.img ? `<br><img src="${c.img}" style="width:70px; height:70px; object-fit:cover; border-radius:6px; margin-top:8px; border: 1px solid #cbd5e1; cursor:pointer;" onclick="window.open('${c.img}')">` : '';
                
                let replyHtml = c.adminReply 
                    ? `<div style="margin-top: 10px; padding: 10px; background: #e0f2fe; border-left: 3px solid #0284c7; border-radius: 4px; font-size: 13px; color: #0369a1;"><strong>Rau Má PC đã trả lời:</strong><br>${c.adminReply}</div>` 
                    : '';
                
                let btnReplyText = c.adminReply ? "Sửa trả lời" : "Trả lời";

                tbody.innerHTML += `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:12px;">
                                <img src="${c.productImg}" style="width:45px; height:45px; object-fit:cover; border-radius:6px; border: 1px solid #eee;">
                                <span style="font-size:13px; font-weight:bold; color:#1435c3; line-height:1.4;">${c.productName}</span>
                            </div>
                        </td>
                        <td>
                            <strong style="color:#1e293b; font-size: 14px;">${c.userName}</strong><br>
                            ${stars}<br>
                            <span style="font-size:12px; color:#64748b;">${c.date}</span>
                        </td>
                        <td style="font-size:14px; line-height:1.6; color: #334155;">
                            ${c.content}
                            ${imgHtml}
                            ${replyHtml}
                        </td>
                        <td>
                            <button onclick="replyReview('${c.productId}', '${c.id}')" style="background:#e0f2fe; color:#0284c7; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; margin-right:5px; margin-bottom:5px; transition:0.2s;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'">${btnReplyText}</button>
                            <button onclick="deleteReview('${c.productId}', '${c.id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">Xóa</button>
                        </td>
                    </tr>
                `;
            });
        });
}

// Các biến lưu tạm ID để gửi đi
let currentReplyProductId = null;
let currentReplyCommentId = null;

// Hàm mở Modal Giao diện đẹp
window.replyReview = function(productId, commentId) {
    currentReplyProductId = productId;
    currentReplyCommentId = commentId;
    document.getElementById('crm-input').value = ''; // Xóa trắng ô nhập cũ
    document.getElementById('custom-reply-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('crm-input').focus(), 100); // Tự động trỏ chuột vào ô nhập
};

// Hàm đóng Modal
window.closeReplyModal = function() {
    document.getElementById('custom-reply-modal').style.display = 'none';
    currentReplyProductId = null;
    currentReplyCommentId = null;
};

// Hàm gửi API lên Backend khi Admin bấm "Gửi Phản Hồi"
window.executeReplyReview = function() {
    if (!currentReplyProductId || !currentReplyCommentId) return;
    
    let replyText = document.getElementById('crm-input').value.trim();
    if (!replyText) {
        return window.showAdminAlert("Vui lòng nhập nội dung câu trả lời!", false);
    }

    let btn = document.getElementById('crm-submit-btn');
    btn.innerText = "ĐANG XỬ LÝ...";
    btn.disabled = true;

    fetch(`https://raumapc-backend-fms3.onrender.com/api/admin/comments/${currentReplyProductId}/${currentReplyCommentId}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ replyText: replyText })
    }).then(res => res.json()).then(data => {
        btn.innerText = "Gửi Phản Hồi";
        btn.disabled = false;
        
        if (data.success) {
            closeReplyModal();
            window.showAdminAlert(data.message, true);
            loadReviews(); // Tải lại danh sách bình luận
        } else {
            window.showAdminAlert(data.message, false);
        }
    }).catch(err => {
        btn.innerText = "Gửi Phản Hồi";
        btn.disabled = false;
        window.showAdminAlert("Lỗi kết nối máy chủ!", false);
    });
};

window.deleteReview = function(productId, commentId) {
    if (confirm("⚠️ CẢNH BÁO BẢO MẬT\n\nBạn có chắc chắn muốn xóa vĩnh viễn bình luận này (Bao gồm cả ảnh đính kèm nếu có)?")) {
        fetch(`https://raumapc-backend-fms3.onrender.com/api/admin/comments/${productId}/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(res => res.json()).then(data => {
            window.showAdminAlert(data.message, data.success);
            if (data.success) loadReviews();
        });
    }
};