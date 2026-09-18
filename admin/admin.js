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

['mousemove', 'keypress', 'click', 'scroll'].forEach(evt => document.addEventListener(evt, () => idleTime = 0));

window.adminLogout = function() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    if (typeof window.clearDrafts === 'function') window.clearDrafts(); 
    window.location.href = '../../index.html';
};

const API_PRODUCTS = 'https://raumapc-backend.onrender.com/api/products';
const API_ORDERS = 'https://raumapc-backend.onrender.com/api/orders';

function switchTab(tabName) {
    document.querySelectorAll('.sidebar-top .menu-item').forEach(el => el.classList.remove('active'));
    if (tabName === 'products') document.querySelectorAll('.sidebar-top .menu-item')[0].classList.add('active');
    else if (tabName === 'orders') document.querySelectorAll('.sidebar-top .menu-item')[1].classList.add('active');
    else document.querySelectorAll('.sidebar-top .menu-item')[2].classList.add('active');

    document.getElementById('tab-products').style.display = (tabName === 'products') ? 'block' : 'none';
    document.getElementById('tab-orders').style.display = (tabName === 'orders') ? 'block' : 'none';
    document.getElementById('tab-home-settings').style.display = (tabName === 'home-settings') ? 'block' : 'none';

    if (tabName === 'orders') loadOrders();
    else if (tabName === 'products') { loadProducts(); loadRevenue(); }
    else loadHomeSettings();
}

// ================= KHU VỰC CODE SẢN PHẨM =================
let allProducts = []; 

function loadProducts() {
    fetch(API_PRODUCTS).then(res => res.json()).then(products => {
        allProducts = products; 
        const tbody = document.getElementById('product-table-body');
        tbody.innerHTML = '';
        products.forEach(sp => {
            // CẬP NHẬT: Hiển thị thêm "Tình trạng" bên cạnh Giá tiền
            let statusColor = sp.status === 'Còn hàng' ? '#059669' : (sp.status === 'Hết hàng' ? '#dc2626' : '#f59e0b');
            tbody.innerHTML += `
                <tr>
                    <td><img src="${sp.img}" style="width:45px; height:45px; border-radius:6px; object-fit:cover;"></td>
                    <td style="font-weight:bold; color:#2b3674;">${sp.name}<br><span style="font-size:12px; color:#888; font-weight:normal;">Mã SP: <span style="color:#d70018;">${sp.productId || sp.id.slice(-6).toUpperCase()}</span></span></td>
                    <td style="color:#d70018; font-weight:bold;">${sp.price}<br><span style="font-size:12px; color:${statusColor}">${sp.status || 'Còn hàng'}</span></td>
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
    if (document.getElementById('productId')) document.getElementById('productId').value = sp.productId || '';
    if (document.getElementById('name')) document.getElementById('name').value = sp.name || '';
    if (document.getElementById('price')) document.getElementById('price').value = sp.price || '';
    if (document.getElementById('warranty')) document.getElementById('warranty').value = sp.warranty || '36 Tháng';
    
    // Nạp trạng thái Tình trạng từ CSDL lên ô nhập liệu
    if (document.getElementById('status')) document.getElementById('status').value = sp.status || 'Còn hàng';

    const catArray = (sp.category || '').split(',').map(c => c.trim());
    if (document.getElementById('category1')) document.getElementById('category1').value = catArray[0] || '';
    if (document.getElementById('category2')) document.getElementById('category2').value = catArray[1] || '';
    if (document.getElementById('category3')) document.getElementById('category3').value = catArray[2] || '';

    if (document.getElementById('img')) document.getElementById('img').value = sp.img || '';
    
    if (sp.img && sp.img.length > 5) {
        if (document.getElementById('image-preview')) { document.getElementById('image-preview').src = sp.img; document.getElementById('image-preview').style.display = 'block'; }
        if (document.getElementById('drop-zone-text')) document.getElementById('drop-zone-text').style.display = 'none';
        if (document.getElementById('btn-remove-img')) document.getElementById('btn-remove-img').style.display = 'block';
    } else {
        if (typeof resetImageUploader === 'function') resetImageUploader();
    }
    
    if (document.getElementById('specs')) document.getElementById('specs').value = sp.specs || '';
    if (document.getElementById('description')) document.getElementById('description').value = sp.description || '';
    if (document.getElementById('brand')) document.getElementById('brand').value = sp.brand || '';

    if (document.getElementById('form-title')) document.getElementById('form-title').innerText = "✏️ Cập Nhật Sản Phẩm";
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) { btnSubmit.innerText = "LƯU CẬP NHẬT"; btnSubmit.style.background = "#28a745"; }
    
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) { btnCancel.style.display = "block"; btnCancel.innerText = "HỦY SỬA"; }

    galleryBase64 = sp.gallery || [];
    if (typeof window.renderGallery === 'function') window.renderGallery();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
    if (document.getElementById('productForm')) document.getElementById('productForm').reset();
    if (document.getElementById('edit-id')) document.getElementById('edit-id').value = '';
    if (document.getElementById('productId')) document.getElementById('productId').value = '';
    if (document.getElementById('status')) document.getElementById('status').value = 'Còn hàng';
    
    if (document.getElementById('category1')) document.getElementById('category1').value = '';
    if (document.getElementById('category2')) document.getElementById('category2').value = '';
    if (document.getElementById('category3')) document.getElementById('category3').value = '';

    if (document.getElementById('form-title')) document.getElementById('form-title').innerText = "➕ Thêm Sản Phẩm Mới";
    
    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) { btnSubmit.innerText = "LƯU SẢN PHẨM"; btnSubmit.style.background = "#1435c3"; }
    
    const btnCancel = document.getElementById('btn-cancel');
    if (btnCancel) { btnCancel.style.display = "block"; btnCancel.innerText = "XÓA BẢN NHÁP"; }

    galleryBase64 = [];
    if (typeof window.renderGallery === 'function') window.renderGallery();
    if (typeof resetImageUploader === 'function') resetImageUploader();
    if (typeof window.clearDrafts === 'function') window.clearDrafts();
}

const formEl = document.getElementById('productForm');
const formBtn = document.getElementById('btn-submit');

if (formEl) {
    formEl.setAttribute('novalidate', 'true'); 
    formEl.addEventListener('submit', function(e) { e.preventDefault(); submitProductForm(e); });
}

if (formBtn) {
    formBtn.setAttribute('type', 'button');
    formBtn.onclick = function(e) { e.preventDefault(); submitProductForm(e); };
}

async function submitProductForm(e) {
    if (e) e.preventDefault();
    
    const cat1 = document.getElementById('category1') ? document.getElementById('category1').value : '';
    const cat2 = document.getElementById('category2') ? document.getElementById('category2').value : '';
    const cat3 = document.getElementById('category3') ? document.getElementById('category3').value : '';
    let combinedCategory = [cat1, cat2, cat3].filter(c => c && c !== '').join(', ');

    if (combinedCategory === '') return window.showAdminAlert("Vui lòng chọn ít nhất 1 Danh mục sản phẩm!", false);

    const btn = document.getElementById('btn-submit');
    const oldText = btn ? btn.innerText : "LƯU CẬP NHẬT";
    if (btn) btn.innerText = "ĐANG LƯU...";

    const brandInput = document.getElementById('brand');
    const brandValue = brandInput ? brandInput.value.toLowerCase().trim() : '';

    let finalImageBase64 = '';
    const hiddenImgEl = document.getElementById('img');
    if (hiddenImgEl && hiddenImgEl.value.trim() !== '') {
        finalImageBase64 = hiddenImgEl.value; 
    } else {
        const imagePreviewEl = document.getElementById('image-preview');
        if (imagePreviewEl && imagePreviewEl.style.display === 'block') {
            finalImageBase64 = imagePreviewEl.getAttribute('src'); 
        }
    }

    if (!finalImageBase64 || finalImageBase64 === '') {
        if (btn) btn.innerText = oldText;
        return window.showAdminAlert("Vui lòng tải lên Hình Ảnh Sản Phẩm!", false);
    }

    const sp = {
        productId: document.getElementById('productId') ? document.getElementById('productId').value : '',
        name: document.getElementById('name') ? document.getElementById('name').value : '',
        price: document.getElementById('price') ? document.getElementById('price').value : '',
        img: finalImageBase64,
        warranty: document.getElementById('warranty') ? document.getElementById('warranty').value : '36 Tháng',
        status: document.getElementById('status') ? document.getElementById('status').value : 'Còn hàng', // GHI NHẬN TÌNH TRẠNG LÚC LƯU
        category: combinedCategory,
        brand: brandValue, 
        specs: document.getElementById('specs') ? document.getElementById('specs').value : '',
        description: document.getElementById('description') ? document.getElementById('description').value : '',
        gallery: galleryBase64
    };

    const editId = document.getElementById('edit-id') ? document.getElementById('edit-id').value : '';
    const url = editId !== '' ? `${API_PRODUCTS}/${editId}` : API_PRODUCTS;
    const method = editId !== '' ? 'PUT' : 'POST';

    try {
        let res = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sp) });
        if (!res.ok) throw new Error("Server error");
        if(typeof window.showAdminAlert === 'function') window.showAdminAlert(editId !== '' ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm mới thành công!", true);
        if(typeof window.clearDrafts === 'function') window.clearDrafts(); 
        if(typeof cancelEdit === 'function') cancelEdit(); 
        if(typeof loadProducts === 'function') loadProducts(); 
        if (btn) btn.innerText = "LƯU SẢN PHẨM";
    } catch (err) {
        if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Máy chủ đang ngủ đông. Hệ thống đang tự động đánh thức, vui lòng chờ 5-10 giây...", false);
        if (btn) btn.innerText = "ĐANG ĐÁNH THỨC...";
        setTimeout(async () => {
            try {
                let retryRes = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sp) });
                if (!retryRes.ok) throw new Error("Retry failed");
                document.getElementById('admin-custom-alert').style.display = 'none';
                window.showAdminAlert(editId !== '' ? "Cập nhật sản phẩm thành công!" : "Thêm sản phẩm mới thành công!", true);
                if(typeof window.clearDrafts === 'function') window.clearDrafts(); 
                if(typeof cancelEdit === 'function') cancelEdit(); 
                if(typeof loadProducts === 'function') loadProducts();
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
    fetch(API_ORDERS + '?v=' + new Date().getTime())
        .then(res => res.json())
        .then(orders => {
            const tbody = document.getElementById('order-table-body');
            tbody.innerHTML = '';
            if (orders.length === 0) return tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Kho chưa có đơn hàng nào!</td></tr>';

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
                            <td><button onclick="deleteOrder('${order.orderId}')" style="background:#ffe2e5; color:#dc2626; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#ffe2e5'">Xóa</button></td>
                        </tr>`;
            });
        });
}

function changeOrderStatus(orderId, newStatus) { fetch(`${API_ORDERS}/${orderId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }).then(res => res.json()).then(data => { loadOrders(); loadRevenue(); }).catch(err => alert("Lỗi cập nhật!")); }
function deleteOrder(orderId) {
    if (confirm(`⚠️ CẢNH BÁO NGUY HIỂM\n\nBạn có chắc chắn muốn xóa vĩnh viễn đơn hàng #${orderId} không?`)) {
        fetch(`${API_ORDERS}/${orderId}`, { method: 'DELETE' }).then(res => res.json()).then(data => { if(data.success) { if(typeof window.showAdminAlert === 'function') window.showAdminAlert(data.message, true); loadOrders(); loadRevenue(); } else { if(typeof window.showAdminAlert === 'function') window.showAdminAlert(data.message, false); } }).catch(err => { if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Lỗi kết nối máy chủ!", false); });
    }
}

loadProducts();

function loadRevenue() {
    fetch('https://raumapc-backend.onrender.com/api/admin/revenue?v=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            document.getElementById('revenue-total').innerText = new Intl.NumberFormat('vi-VN').format(data.totalRevenue || 0) + ' đ';
            document.getElementById('revenue-orders').innerText = data.totalOrders || 0;
        }).catch(err => console.error("Lỗi tải doanh thu:", err));
}
loadRevenue();

// ================= HỆ THỐNG KÉO THẢ & NÉN ẢNH (DRAG & DROP) =================
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const imagePreview = document.getElementById('image-preview');
const dropZoneText = document.getElementById('drop-zone-text');
const imgHiddenInput = document.getElementById('img');
const btnRemoveImg = document.getElementById('btn-remove-img');

if (dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#1435c3'; dropZone.style.background = '#eef2ff'; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = '#f8fafc'; });
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.style.borderColor = '#cbd5e1'; dropZone.style.background = '#f8fafc'; if (e.dataTransfer.files && e.dataTransfer.files[0]) processImageFile(e.dataTransfer.files[0]); });
}
if (fileInput) fileInput.addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) processImageFile(e.target.files[0]); });
if (btnRemoveImg) btnRemoveImg.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); resetImageUploader(); });

function resetImageUploader() {
    if (imgHiddenInput) imgHiddenInput.value = '';
    if (fileInput) fileInput.value = '';
    if (imagePreview) { imagePreview.src = ''; imagePreview.style.display = 'none'; }
    if (btnRemoveImg) btnRemoveImg.style.display = 'none';
    if (dropZoneText) dropZoneText.style.display = 'block';
}

function processImageFile(file) {
    if (!file.type.match('image.*')) return alert("Vui lòng chỉ chọn file hình ảnh!");
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8); 
            if (imgHiddenInput) imgHiddenInput.value = dataUrl;
            if (imagePreview) { imagePreview.src = dataUrl; imagePreview.style.display = 'block'; }
            if (dropZoneText) dropZoneText.style.display = 'none';
            if (btnRemoveImg) btnRemoveImg.style.display = 'block';
        }
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

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
    document.getElementById('aca-btn').onclick = function() { modal.style.display = 'none'; if(callback) callback(); };
};

// ==========================================
// TÍNH NĂNG TỰ ĐỘNG LƯU NHÁP CHỐNG MẤT DỮ LIỆU
// ==========================================
// CẬP NHẬT: Cho phép lưu nháp Tình trạng
const draftFields = ['productId', 'brand', 'name', 'price', 'warranty', 'status', 'category1', 'category2', 'category3', 'specs', 'description'];

window.clearDrafts = function() {
    draftFields.forEach(id => localStorage.removeItem('draft_product_' + id));
};

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

window.renderGallery = function() {
    if (!galleryPreview) return;
    galleryPreview.innerHTML = '';
    galleryBase64.forEach((dataUrl, index) => {
        galleryPreview.innerHTML += `<div style="position: relative; display: inline-block; flex-shrink: 0; margin-top: 5px; margin-right: 5px;"><img src="${dataUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;"><button type="button" onclick="removeGalleryImage(${index})" style="position: absolute; top: -8px; right: -8px; background: #d70018; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; font-weight: bold; cursor: pointer;">X</button></div>`;
    });
};
window.removeGalleryImage = function(index) { galleryBase64.splice(index, 1); renderGallery(); if (galleryBase64.length === 0 && galleryInput) galleryInput.value = ''; };

if (galleryInput) {
    galleryInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files); let loadedCount = 0; galleryBase64 = []; 
        files.forEach(file => {
            if (!file.type.match('image.*')) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas'); const MAX_WIDTH = 600; let width = img.width; let height = img.height;
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                    galleryBase64.push(canvas.toDataURL('image/jpeg', 0.8)); loadedCount++;
                    if(loadedCount === files.length) renderGallery();
                }
                img.src = evt.target.result;
            }
            reader.readAsDataURL(file);
        });
    });
}

function loadHomeSettings() {
    fetch('https://raumapc-backend.onrender.com/api/settings/home').then(res => res.json()).then(data => {
        const defaultTitles = ['VGA - Card Màn Hình', 'Ổ Cứng', 'RAM - Bộ Nhớ Trong', 'Mainboard - Bo mạch chủ', 'Chuột Không Dây', 'Màn Hình Máy Tính'];
        for (let i = 1; i <= 6; i++) { 
            let titleEl = document.getElementById(`home-title-${i}`); if (titleEl) titleEl.value = data[`homeTitle${i}`] || defaultTitles[i-1];
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
        if(btnTitle) btnTitle.innerText = "ĐANG ĐỒNG BỘ CLOUD..."; if(btnPro) btnPro.innerText = "ĐANG ĐỒNG BỘ CLOUD...";
        const token = localStorage.getItem('authToken');
        let res = await fetch('https://raumapc-backend.onrender.com/api/settings/home', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(configData) });
        if (res.ok) { if(typeof window.showAdminAlert === 'function') window.showAdminAlert(alertMessage, true); } else { if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Lỗi bảo mật hoặc máy chủ!", false); }
        if(btnTitle) btnTitle.innerText = "LƯU TÙY CHỈNH TIÊU ĐỀ"; if(btnPro) btnPro.innerText = "LƯU TÙY CHỈNH SẢN PHẨM";
    } catch (e) { if(typeof window.showAdminAlert === 'function') window.showAdminAlert("Lỗi mạng khi lưu Cloud!", false); }
}
window.saveHomeSettings = function() { syncSettingsToCloud("Đã lưu Tiêu đề trang chủ lên Cloud thành công!"); }
window.saveHomeProducts = function() { syncSettingsToCloud("Đã lưu Cấu hình Sản phẩm lên Cloud thành công!"); }