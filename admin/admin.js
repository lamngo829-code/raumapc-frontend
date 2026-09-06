// =========================================================
// KIỂM TRA QUYỀN TRUY CẬP TỪ DATABASE & TỰ ĐỘNG ĐĂNG XUẤT
// =========================================================
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const token = localStorage.getItem('authToken');

if (!currentUser || !token || currentUser.role !== 'admin') {
    alert("⛔ CẢNH BÁO: Bạn không có đặc quyền truy cập khu vực này!");
    window.location.href = '../../index.html'; 
}

let idleTime = 0;
const idleLimit = 15; 

const idleInterval = setInterval(() => {
    idleTime++;
    if (idleTime >= idleLimit) {
        clearInterval(idleInterval);
        alert("⏳ Phiên làm việc đã hết hạn để bảo mật. Hệ thống tự động đăng xuất!");
        adminLogout();
    }
}, 60000); 

['mousemove', 'keypress', 'click', 'scroll'].forEach(evt => 
    document.addEventListener(evt, () => idleTime = 0)
);

window.adminLogout = function() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = '../../index.html';
};
// =========================================================

const API_PRODUCTS = 'https://raumapc-backend.onrender.com/api/products';
const API_ORDERS = 'https://raumapc-backend.onrender.com/api/orders';

function switchTab(tabName) {
    document.querySelectorAll('.sidebar-top .menu-item').forEach(el => el.classList.remove('active'));
    if (tabName === 'products') document.querySelectorAll('.sidebar-top .menu-item')[0].classList.add('active');
    else document.querySelectorAll('.sidebar-top .menu-item')[1].classList.add('active');

    document.getElementById('tab-products').style.display = (tabName === 'products') ? 'block' : 'none';
    document.getElementById('tab-orders').style.display = (tabName === 'orders') ? 'block' : 'none';

    if (tabName === 'orders') {
        loadOrders();
    } else {
        loadProducts();
        loadRevenue(); 
    }
}

// ================= KHU VỰC CODE SẢN PHẨM =================
let allProducts = []; 

function loadProducts() {
    fetch(API_PRODUCTS).then(res => res.json()).then(products => {
        allProducts = products; 
        const tbody = document.getElementById('product-table-body');
        tbody.innerHTML = '';
        products.forEach(sp => {
            tbody.innerHTML += `
                        <tr>
                            <td><img src="${sp.img}" style="width:45px; height:45px; border-radius:6px; object-fit:cover;"></td>
                            <td style="font-weight:bold; color:#2b3674;">${sp.name}<br><span style="font-size:12px; color:#888; font-weight:normal;">Mã SP: <span style="color:#d70018;">${sp.productId || sp.id.slice(-6).toUpperCase()}</span></span></td>
                            <td style="color:#d70018; font-weight:bold;">${sp.price}</td>
                            <td>
                                <button onclick="editProduct('${sp.id}')" style="background:#e3f2fd; color:#1976d2; border:none; padding:5px 12px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:5px;">Sửa</button>
                                <button onclick="deleteProduct('${sp.id}')" style="background:#ffe2e5; color:#d70018; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold;">Xóa</button>
                            </td>
                        </tr>
                    `;
        });
    });
}

function editProduct(id) {
    const sp = allProducts.find(item => item.id === id);
    if (!sp) return;

    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = sp.id;
    if (document.getElementById('productId')) document.getElementById('productId').value = sp.productId || ''; // MỚI THÊM
    if (document.getElementById('name')) document.getElementById('name').value = sp.name || '';
    if (document.getElementById('price')) document.getElementById('price').value = sp.price || '';
    if (document.getElementById('warranty')) document.getElementById('warranty').value = sp.warranty || '36 Tháng';
    
    // Tách chuỗi danh mục để hiển thị lên 3 ô (Bảo vệ an toàn chống lỗi null)
    const catArray = (sp.category || '').split(',').map(c => c.trim());
    
    const cat1 = document.getElementById('category1');
    const cat2 = document.getElementById('category2');
    const cat3 = document.getElementById('category3');
    const catOld = document.getElementById('category'); // Đề phòng file HTML vẫn dùng thẻ cũ

    if (cat1) cat1.value = catArray[0] || '';
    if (cat2) cat2.value = catArray[1] || '';
    if (cat3) cat3.value = catArray[2] || '';
    if (catOld && !cat1) catOld.value = catArray[0] || 'intel';

    if (document.getElementById('img')) document.getElementById('img').value = sp.img || '';
    
    // Load ảnh vào khung Kéo thả
    if (sp.img && sp.img.length > 5) {
        if (document.getElementById('image-preview')) {
            document.getElementById('image-preview').src = sp.img;
            document.getElementById('image-preview').style.display = 'block';
        }
        if (document.getElementById('drop-zone-text')) document.getElementById('drop-zone-text').style.display = 'none';
        if (document.getElementById('btn-remove-img')) document.getElementById('btn-remove-img').style.display = 'block';
    } else {
        if (typeof resetImageUploader === 'function') resetImageUploader();
    }
    
    if (document.getElementById('specs')) document.getElementById('specs').value = sp.specs || '';
    if (document.getElementById('description')) document.getElementById('description').value = sp.description || '';
    
    const brandInput = document.getElementById('brand');
    if (brandInput) brandInput.value = sp.brand || '';

    if (document.getElementById('form-title')) document.getElementById('form-title').innerText = "✏️ Cập Nhật Sản Phẩm";
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        btnSubmit.innerText = "LƯU CẬP NHẬT";
        btnSubmit.style.background = "#28a745"; 
    }
    if (document.getElementById('btn-cancel')) document.getElementById('btn-cancel').style.display = "block"; 

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    if (document.getElementById('productForm')) document.getElementById('productForm').reset();
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
    if (document.getElementById('productId')) document.getElementById('productId').value = ''; // MỚI THÊM
    
    // Dọn dẹp lại 3 ô danh mục an toàn
    if (document.getElementById('category1')) document.getElementById('category1').value = '';
    if (document.getElementById('category2')) document.getElementById('category2').value = '';
    if (document.getElementById('category3')) document.getElementById('category3').value = '';
    if (document.getElementById('category')) document.getElementById('category').value = '';

    if (document.getElementById('form-title')) document.getElementById('form-title').innerText = "➕ Thêm Sản Phẩm Mới";
    
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        btnSubmit.innerText = "LƯU SẢN PHẨM";
        btnSubmit.style.background = "#1435c3"; 
    }
    if (document.getElementById('btn-cancel')) document.getElementById('btn-cancel').style.display = "none";
    
    if (typeof resetImageUploader === 'function') resetImageUploader();
}


// ĐÃ FIX TOÀN DIỆN HÀM LƯU: Bọc thép chống lỗi null và gộp 3 danh mục
document.getElementById('productForm').addEventListener('submit', function (e) {
    e.preventDefault();
    
    // 1. Lấy giá trị an toàn từ 3 ô danh mục mới
    const cat1 = document.getElementById('category1') ? document.getElementById('category1').value : '';
    const cat2 = document.getElementById('category2') ? document.getElementById('category2').value : '';
    const cat3 = document.getElementById('category3') ? document.getElementById('category3').value : '';

    // Gộp 3 danh mục lại, bỏ qua các ô trống
    let combinedCategory = [cat1, cat2, cat3].filter(c => c && c !== '').join(', ');

    // Chốt chặn: Phải chọn ít nhất 1 danh mục
    if (combinedCategory === '') {
        return window.showAdminAlert("Vui lòng chọn ít nhất 1 Danh mục sản phẩm!", false);
    }

    const btn = document.getElementById('btn-submit');
    const oldText = btn ? btn.innerText : "LƯU CẬP NHẬT";
    if (btn) btn.innerText = "ĐANG LƯU...";

    const brandInput = document.getElementById('brand');
    const brandValue = brandInput ? brandInput.value.toLowerCase().trim() : '';

    // 2. Gom dữ liệu sản phẩm an toàn (Chống lỗi null)
    const sp = {
        productId: document.getElementById('productId') ? document.getElementById('productId').value : '',
        name: document.getElementById('name') ? document.getElementById('name').value : '',
        price: document.getElementById('price') ? document.getElementById('price').value : '',
        img: document.getElementById('img') ? document.getElementById('img').value : '',
        warranty: document.getElementById('warranty') ? document.getElementById('warranty').value : '36 Tháng',
        category: combinedCategory,
        brand: brandValue, 
        specs: document.getElementById('specs') ? document.getElementById('specs').value : '',
        description: document.getElementById('description') ? document.getElementById('description').value : ''
    };

    const editIdInput = document.getElementById('edit-id');
    const editId = editIdInput ? editIdInput.value : '';

    // 3. Gửi lên máy chủ
    if (editId !== '') {
        fetch(`${API_PRODUCTS}/${editId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sp)
        })
        .then(res => {
            if(!res.ok) throw new Error("Server error");
            if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Cập nhật sản phẩm thành công!", true);
            if(typeof cancelEdit === 'function') cancelEdit(); 
            if(typeof loadProducts === 'function') loadProducts(); 
        })
        .catch(err => {
            if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Máy chủ đang khởi động hoặc mất kết nối. Vui lòng thử lại!", false);
            if (btn) btn.innerText = oldText;
        });
    } else {
        fetch(API_PRODUCTS, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sp)
        })
        .then(res => {
            if(!res.ok) throw new Error("Server error");
            if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Thêm sản phẩm mới thành công!", true);
            if(typeof cancelEdit === 'function') cancelEdit(); 
            if(typeof loadProducts === 'function') loadProducts();
        })
        .catch(err => {
            if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Máy chủ đang khởi động hoặc mất kết nối. Vui lòng thử lại!", false);
            if (btn) btn.innerText = oldText;
        });
    }
});

function deleteProduct(id) {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này?')) {
        fetch(`${API_PRODUCTS}/${id}`, { method: 'DELETE' }).then(() => {
            window.showAdminAlert("Đã xóa sản phẩm thành công!", true);
            loadProducts();
        });
    }
}

// ================= KHU VỰC CODE ĐƠN HÀNG =================
function loadOrders() {
    fetch(API_ORDERS + '?v=' + new Date().getTime())
        .then(res => res.json())
        .then(orders => {
            const tbody = document.getElementById('order-table-body');
            tbody.innerHTML = '';

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Kho chưa có đơn hàng nào!</td></tr>';
                return;
            }

            orders.reverse().forEach(order => {
                let itemsHtml = order.items.map(item => `<div style="margin-bottom:4px;">- ${item.name} <strong style="color:#d70018;">(x${item.quantity})</strong></div>`).join('');

                let badgeColor = "#1976d2"; let badgeBg = "#e3f2fd";
                if (order.status === "Đang giao hàng") { badgeColor = "#ff9800"; badgeBg = "#fff3e0"; }
                if (order.status === "Hoàn thành") { badgeColor = "#28a745"; badgeBg = "#e8f5e9"; }
                if (order.status === "Đã hủy") { badgeColor = "#dc3545"; badgeBg = "#ffe2e5"; }

                tbody.innerHTML += `
                        <tr>
                            <td style="font-weight:bold; color:#1435c3; font-size: 16px;">${order.orderId}<br><span style="font-size:12px; color:#888; font-weight:normal;">${order.date}</span></td>
                            <td style="font-weight:bold;">${order.username}</td>
                            <td style="font-size:13px; color:#444;">${itemsHtml}</td>
                            <td style="color:#d70018; font-weight:bold; font-size:16px;">${new Intl.NumberFormat('vi-VN').format(order.total)}đ</td>
                            <td><span class="status-badge" style="color:${badgeColor}; background:${badgeBg};">${order.status}</span></td>
                            <td>
                                <select class="status-select" onchange="changeOrderStatus('${order.orderId}', this.value)">
                                    <option value="Chờ duyệt" ${order.status === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option>
                                    <option value="Đang giao hàng" ${order.status === 'Đang giao hàng' ? 'selected' : ''}>Giao hàng</option>
                                    <option value="Hoàn thành" ${order.status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
                                    <option value="Đã hủy" ${order.status === 'Đã hủy' ? 'selected' : ''}>Hủy đơn</option>
                                </select>
                            </td>
                        </tr>
                    `;
            });
        });
}

function changeOrderStatus(orderId, newStatus) {
    fetch(`${API_ORDERS}/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
        .then(res => res.json())
        .then(data => {
            loadOrders(); 
            loadRevenue(); 
        })
        .catch(err => alert("Lỗi khi cập nhật trạng thái!"));
}

loadProducts();

function loadRevenue() {
    fetch('https://raumapc-backend.onrender.com/api/admin/revenue?v=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            document.getElementById('revenue-total').innerText = new Intl.NumberFormat('vi-VN').format(data.totalRevenue || 0) + ' đ';
            document.getElementById('revenue-orders').innerText = data.totalOrders || 0;
        })
        .catch(err => console.error("Lỗi tải doanh thu:", err));
}

loadRevenue();


// ================= HỆ THỐNG KÉO THẢ & NÉN ẢNH (DRAG & DROP) =================
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const dropZoneText = document.getElementById('drop-zone-text');
const imgHiddenInput = document.getElementById('img');
const btnRemoveImg = document.getElementById('btn-remove-img');

// Đổi màu viền khi đang kéo ảnh lơ lửng bên trên
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#1435c3';
    dropZone.style.background = '#eef2ff';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#cbd5e1';
    dropZone.style.background = '#f8fafc';
});

// Xử lý khi thả file vào ô
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#cbd5e1';
    dropZone.style.background = '#f8fafc';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processImageFile(e.dataTransfer.files[0]);
    }
});

// Xử lý khi click chọn file thủ công
fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        processImageFile(e.target.files[0]);
    }
});

// Xóa ảnh đã chọn
btnRemoveImg.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); 
    resetImageUploader();
});

function resetImageUploader() {
    imgHiddenInput.value = '';
    fileInput.value = '';
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    btnRemoveImg.style.display = 'none';
    dropZoneText.style.display = 'block';
}

// Chuyển file thành Base64 (Có nén kích thước để nhẹ Database)
function processImageFile(file) {
    if (!file.type.match('image.*')) return alert("Vui lòng chỉ chọn file hình ảnh!");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Ép kích thước tối đa 800px để chống nặng máy chủ
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Ép kiểu JPEG nén 80%
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8); 
            
            // Nạp dữ liệu vào form
            imgHiddenInput.value = dataUrl;
            imagePreview.src = dataUrl;
            imagePreview.style.display = 'block';
            dropZoneText.style.display = 'none';
            btnRemoveImg.style.display = 'block';
        }
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// =========================================================
// HỆ THỐNG BẢNG THÔNG BÁO TÙY CHỈNH CHO TRANG ADMIN
// =========================================================
window.showAdminAlert = function(message, isSuccess = true, callback = null) {
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
    document.getElementById('aca-btn').onclick = function() {
        modal.style.display = 'none';
        if(callback) callback();
    };
};


// =========================================================
// TÍNH NĂNG TỰ ĐỘNG LƯU NHÁP CHỐNG MẤT DỮ LIỆU
// =========================================================
const draftFields = ['productId', 'brand', 'name', 'price', 'warranty', 'category1', 'category2', 'category3', 'specs', 'description'];

// 1. Phục hồi dữ liệu nháp ngay khi trang vừa được tải lại
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('edit-id') && document.getElementById('edit-id').value === '') {
        draftFields.forEach(id => {
            const el = document.getElementById(id);
            const savedValue = localStorage.getItem('draft_product_' + id);
            if (el && savedValue !== null) el.value = savedValue;
        });
    }
});

// 2. Lắng nghe từng phím gõ và lưu ngay vào bộ nhớ trình duyệt
document.getElementById('productForm').addEventListener('input', (e) => {
    if (draftFields.includes(e.target.id)) {
        // Chỉ lưu nháp khi đang "Thêm mới" (Tuyệt đối không lưu đè khi đang "Sửa" sản phẩm)
        if (document.getElementById('edit-id') && document.getElementById('edit-id').value === '') {
            localStorage.setItem('draft_product_' + e.target.id, e.target.value);
        }
    }
});

// 3. Xóa sạch bản nháp sau khi đã bấm Lưu Sản Phẩm thành công
document.getElementById('productForm').addEventListener('submit', () => {
    if (document.getElementById('edit-id') && document.getElementById('edit-id').value === '') {
        draftFields.forEach(id => localStorage.removeItem('draft_product_' + id));
    }
});