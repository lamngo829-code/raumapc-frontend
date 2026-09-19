window.formatMoney = function(number) { 
    return new Intl.NumberFormat('vi-VN').format(number) + ' đ'; 
};

window.currentDiscountPercent = 0;

// ==========================================
// DANH SÁCH 34 TỈNH/THÀNH PHỐ VIỆT NAM (theo Nghị quyết 202/2025/QH15, áp dụng từ 01/7/2025)
// Lưu ý: cấp Quận/Huyện đã được bãi bỏ, cả nước chỉ còn 2 cấp Tỉnh -> Xã/Phường
// ==========================================
window.vietnamProvinces = [
    "TP. Hà Nội", "TP. Hải Phòng", "TP. Huế", "TP. Đà Nẵng", "TP. Hồ Chí Minh", "TP. Cần Thơ",
    "Cao Bằng", "Tuyên Quang", "Lào Cai", "Thái Nguyên", "Điện Biên", "Lai Châu", "Sơn La",
    "Lạng Sơn", "Quảng Ninh", "Bắc Ninh", "Phú Thọ", "Hưng Yên", "Ninh Bình", "Thanh Hóa",
    "Nghệ An", "Hà Tĩnh", "Quảng Trị", "Quảng Ngãi", "Gia Lai", "Khánh Hòa", "Lâm Đồng",
    "Đắk Lắk", "Đồng Nai", "Tây Ninh", "Vĩnh Long", "Đồng Tháp", "Cà Mau", "An Giang"
];

window.populateProvinces = function() {
    var citySelect = document.getElementById('cusCity');
    if (!citySelect || citySelect.options.length > 1) return; // Tránh đổ trùng lặp
    window.vietnamProvinces.forEach(function(name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        citySelect.appendChild(opt);
    });
};

document.addEventListener('DOMContentLoaded', window.populateProvinces);

window.renderCartPage = function() {
    if(typeof window.syncCartToCloud === 'function') window.syncCartToCloud();
    var savedCart = JSON.parse(localStorage.getItem('myCart')) || []; 
    var listContainer = document.getElementById('checkout-list');
    if (!listContainer) return;

    if (savedCart.length === 0) {
        listContainer.innerHTML = `
        <div class="empty-cart-state">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>Giỏ hàng của bạn đang trống!</p>
            <a href="../../index.html" class="empty-cart-btn">Tiếp tục mua sắm</a>
        </div>`;
        document.getElementById('checkout-subtotal').innerText = '0 đ';
        document.getElementById('checkout-final-total').innerText = '0 đ';
        return;
    }

    var html = ''; var totalValue = 0;
    savedCart.forEach(function(item, index) {
        var price = parseInt(String(item.price).replace(/\D/g, '')) || 0;
        var qty = parseInt(item.quantity) || 1;
        totalValue += price * qty;
        
        html += `
        <div class="checkout-item">
            <img src="${item.img}" alt="${item.name}">
            <div class="checkout-item-info">
                <div class="checkout-item-name">${item.name}</div>
                <div class="checkout-qty-box" style="margin-top:10px;">
                    <button onclick="window.changeQty(${index}, -1)">-</button>
                    <input type="text" value="${qty}" readonly>
                    <button onclick="window.changeQty(${index}, 1)">+</button>
                </div>
            </div>
            <div class="checkout-item-price">${window.formatMoney(price * qty)}</div>
            <button class="btn-del" onclick="window.removePageItem(${index})">Xóa</button>
        </div>`;
    });
    
    listContainer.innerHTML = html;
    
    // Cập nhật giá tổng
    document.getElementById('checkout-subtotal').innerText = window.formatMoney(totalValue);
    
    var finalValue = totalValue;
    if (window.currentDiscountPercent > 0) {
        finalValue = totalValue - (totalValue * window.currentDiscountPercent / 100);
    }
    document.getElementById('checkout-final-total').innerText = window.formatMoney(finalValue);

    // MỚI: Tự động truyền đúng số tiền sang bảng Mã QR (nếu đang hiển thị)
    const qrAmountEl = document.getElementById('qr-amount');
    if(qrAmountEl) qrAmountEl.innerText = window.formatMoney(finalValue);
    
    // Tạo lại ảnh QR nếu số tiền thay đổi
    if(document.getElementById('qr-payment-section') && document.getElementById('qr-payment-section').style.display === 'block') {
        window.togglePaymentMethod();
    }
};

window.changeQty = function(index, change) {
    var savedCart = JSON.parse(localStorage.getItem('myCart')) || [];
    if (!savedCart[index]) return;
    var newQty = (parseInt(savedCart[index].quantity) || 1) + change;
    if (newQty < 1) {
        if(confirm("Xóa sản phẩm này?")) savedCart.splice(index, 1);
        else return;
    } else { savedCart[index].quantity = newQty; }
    localStorage.setItem('myCart', JSON.stringify(savedCart));
    window.renderCartPage();
};

window.removePageItem = function(index) {
    var savedCart = JSON.parse(localStorage.getItem('myCart')) || [];
    savedCart.splice(index, 1);
    localStorage.setItem('myCart', JSON.stringify(savedCart));
    window.renderCartPage(); 
};

window.applyCartVoucher = async function() {
    const inputEl = document.getElementById('cart-voucher-input');
    const msgEl = document.getElementById('voucher-message');
    
    if(!inputEl || !msgEl) return;
    
    const code = inputEl.value.trim();
    if(!code) return msgEl.innerHTML = '<span style="color:red;">Vui lòng nhập mã giảm giá!</span>';
    
    msgEl.innerHTML = '<span style="color:#1435c3;">Đang kiểm tra mã...</span>';
    
    try {
        const res = await fetch('https://raumapc-backend.onrender.com/api/coupons/apply', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
        });
        const data = await res.json();
        
        if(data.success) {
            window.currentDiscountPercent = data.discountPercent;
            msgEl.innerHTML = `<span style="color:green;">✅ ${data.message}</span>`;
            window.renderCartPage(); 
        } else {
            window.currentDiscountPercent = 0;
            msgEl.innerHTML = `<span style="color:red;">❌ ${data.message}</span>`;
            window.renderCartPage();
        }
    } catch(e) {
        msgEl.innerHTML = '<span style="color:red;">❌ Lỗi kết nối! Vui lòng thử lại.</span>';
    }
};

// ==========================================
// HÀM MÔ PHỎNG MÃ QR CHUYỂN KHOẢN (ĐÃ TÍCH HỢP VIETQR TỰ ĐỘNG ĐIỀN)
// ==========================================
window.togglePaymentMethod = function() {
    const paymentMethods = document.getElementsByName('payment');
    const qrSection = document.getElementById('qr-payment-section');
    const qrContent = document.getElementById('qr-content');
    
    let selectedMethod = 'cod';
    for(let radio of paymentMethods) { if(radio.checked) selectedMethod = radio.value; }

    if(selectedMethod === 'banking') {
        qrSection.style.display = 'block';
        
        // 1. Lấy số tiền thực tế cần thanh toán
        const finalTotalText = document.getElementById('checkout-final-total').innerText;
        const finalTotalNum = parseInt(finalTotalText.replace(/\D/g, '')) || 0;
        
        // 2. Sinh ra mã nội dung chuyển khoản tự động
        const randomCode = 'RM' + Math.floor(Math.random() * 90000 + 10000);
        if(qrContent) qrContent.innerText = randomCode;
        
        // 3. Tự động tạo ảnh VietQR xịn sò chứa sẵn thông tin của bạn
        const qrImg = document.getElementById('dynamic-qr-code');
        if(qrImg) {
            const bankId = "vietinbank"; 
            const accNo = "101882588405"; 
            const accName = "NGO TRUONG LAM";
            
            // Link API VietQR sẽ ghép Bank + STK + Số tiền + Nội dung để sinh ra mã quét chuẩn Napas247
            qrImg.src = `https://img.vietqr.io/image/${bankId}-${accNo}-compact2.png?amount=${finalTotalNum}&addInfo=${randomCode}&accountName=${encodeURIComponent(accName)}`;
        }
        
    } else {
        qrSection.style.display = 'none';
        const confirmPaidEl = document.getElementById('confirmPaid');
        if (confirmPaidEl) confirmPaidEl.checked = false; // Tắt checkbox nếu đổi lại COD
    }
};

// --- XỬ LÝ ĐẶT HÀNG ---
window.processCheckout = function() {
    var currentUser = JSON.parse(localStorage.getItem('currentUser')); 
    if (!currentUser) {
        alert("Bạn cần Đăng nhập để thực hiện thanh toán!");
        window.location.href = '../../pages/account/login.html';
        return;
    }

    var savedCart = JSON.parse(localStorage.getItem('myCart')) || [];
    if (savedCart.length === 0) {
        if (typeof window.showGlobalAlert === 'function') return window.showGlobalAlert("Giỏ hàng đang trống!", false);
        return alert("Giỏ hàng trống!");
    }

    var name = document.getElementById('cusName').value.trim();
    var phone = document.getElementById('cusPhone').value.trim();
    var email = document.getElementById('cusEmail').value.trim(); 
    var address = document.getElementById('cusAddress').value.trim();
    var ward = document.getElementById('cusDistrict') ? document.getElementById('cusDistrict').value.trim() : '';
    var city = document.getElementById('cusCity') ? document.getElementById('cusCity').value.trim() : '';

    if (!name || !phone || !email || !address) {
        if (typeof window.showGlobalAlert === 'function') return window.showGlobalAlert("Vui lòng nhập đầy đủ thông tin bắt buộc (*)", false);
        return alert("Vui lòng nhập đầy đủ thông tin bắt buộc (*)");
    }

    // Ghép địa chỉ đầy đủ: Địa chỉ chi tiết, Phường/Xã, Tỉnh/Thành
    var fullAddress = [address, ward, city].filter(Boolean).join(', ');

    // ==========================================
    // MỚI: BẢO VỆ THANH TOÁN (YÊU CẦU TÍCH CHECKBOX NẾU CHỌN QR)
    // ==========================================
    const paymentMethods = document.getElementsByName('payment');
    let selectedMethod = 'cod';
    for(let radio of paymentMethods) { if(radio.checked) selectedMethod = radio.value; }

    if (selectedMethod === 'banking') {
        const confirmPaid = document.getElementById('confirmPaid');
        if (!confirmPaid || !confirmPaid.checked) {
            if (typeof window.showGlobalAlert === 'function') {
                return window.showGlobalAlert("Vui lòng dùng Điện thoại quét mã QR thanh toán, sau đó đánh dấu vào ô [Tôi đã hoàn tất chuyển khoản]!", false);
            }
            return alert("Vui lòng xác nhận bạn đã thanh toán!");
        }
    }

    var btn = document.getElementById('btn-submit-order');
    btn.innerText = "ĐANG XỬ LÝ...";
    btn.disabled = true;

    var totalValue = 0;
    savedCart.forEach(function(item) {
        var price = parseInt(String(item.price).replace(/\D/g, '')) || 0;
        var qty = parseInt(item.quantity) || 1;
        totalValue += price * qty;
    });
    
    if (window.currentDiscountPercent > 0) {
        totalValue = totalValue - (totalValue * window.currentDiscountPercent / 100);
    }
    
    // Nếu chọn QR, lấy cái mã ngẫu nhiên RM... làm Mã đơn hàng luôn để dễ bề đối chiếu
    const qrContent = document.getElementById('qr-content');
    const orderIdCode = (selectedMethod === 'banking' && qrContent) ? qrContent.innerText : ('RM' + Math.floor(Math.random() * 900000 + 100000));

    // Cập nhật dữ liệu gửi lên Admin
    var newOrder = {
        orderId: orderIdCode, 
        date: new Date().toLocaleString('vi-VN'),
        username: `${name} (${phone} - ${fullAddress})`,
        account: currentUser.username, 
        email: email, 
        items: savedCart,
        total: totalValue,
        // NẾU CHỌN QUÉT MÃ QR -> ĐẨY THẲNG TRẠNG THÁI LÊN THÀNH ĐÃ THANH TOÁN
        status: selectedMethod === 'banking' ? 'Đã thanh toán (Chờ giao)' : 'Chờ duyệt', 
        paymentMethod: selectedMethod === 'banking' ? 'Chuyển khoản QR' : 'Thanh toán COD'
    };

    fetch('https://raumapc-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('myCart'); 
        if (currentUser) {
            currentUser.cart = [];
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        if (typeof window.showGlobalAlert === 'function') {
            window.showGlobalAlert('🎉 Đặt hàng thành công! Hóa đơn chi tiết đã được gửi vào Email.', true, () => {
                window.location.href = '../../pages/account/orders.html';
            });
        } else {
            alert("🎉 Đặt hàng thành công! Hóa đơn chi tiết đã được gửi vào Email.");
            window.location.href = '../../pages/account/orders.html'; 
        }
    })
    .catch(error => {
        alert("Lỗi kết nối máy chủ Render!");
        btn.innerText = "ĐẶT HÀNG";
        btn.disabled = false;
    });
};

document.addEventListener('DOMContentLoaded', window.renderCartPage);