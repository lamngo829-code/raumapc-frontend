window.showCustomAlert = function (message, isSuccess = false, redirectUrl = null) {
    let modal = document.getElementById('custom-alert-modal');
    if (!modal) return alert(message); // Dự phòng nếu quên gắn HTML

    document.getElementById('custom-alert-message').innerText = message;
    
    const iconBox = document.getElementById('custom-alert-icon');
    const title = document.getElementById('custom-alert-title');
    const btn = document.getElementById('custom-alert-btn');
    
    // Giao diện khi Thành công (Màu xanh lá)
    if (isSuccess) {
        iconBox.innerHTML = '<div style="background: #dcfce7; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
        title.innerText = 'Thành Công!'; 
        title.style.color = '#059669';
        btn.style.background = '#059669';
    } 
    // Giao diện khi Cảnh báo/Lỗi (Màu đỏ)
    else {
        iconBox.innerHTML = '<div style="background: #fee2e2; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>';
        title.innerText = 'Cảnh Báo!'; 
        title.style.color = '#dc2626';
        btn.style.background = '#dc2626';
    }
    
    modal.style.display = 'flex';
    
    // Xử lý khi bấm nút "Đồng ý"
    btn.onclick = function () { 
        modal.style.display = 'none'; 
        // Nếu có truyền link thì tự động chuyển trang (VD: chuyển đến trang đăng nhập)
        if (redirectUrl) {
            window.location.href = redirectUrl; 
        }
    };
};

window.formatMoney = function (number) {
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

window.populateProvinces = function () {
    var citySelect = document.getElementById('cusCity');
    if (!citySelect || citySelect.options.length > 1) return; // Tránh đổ trùng lặp
    window.vietnamProvinces.forEach(function (name) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        citySelect.appendChild(opt);
    });
};

document.addEventListener('DOMContentLoaded', window.populateProvinces);

window.renderCartPage = function () {
    if (typeof window.syncCartToCloud === 'function') window.syncCartToCloud();
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
    savedCart.forEach(function (item, index) {
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
    if (qrAmountEl) qrAmountEl.innerText = window.formatMoney(finalValue);

    // Tạo lại ảnh QR nếu số tiền thay đổi
    if (document.getElementById('qr-payment-section') && document.getElementById('qr-payment-section').style.display === 'block') {
        window.togglePaymentMethod();
    }
};

window.changeQty = function (index, change) {
    var savedCart = JSON.parse(localStorage.getItem('myCart')) || [];
    if (!savedCart[index]) return;
    var newQty = (parseInt(savedCart[index].quantity) || 1) + change;
    if (newQty < 1) {
        if (confirm("Xóa sản phẩm này?")) savedCart.splice(index, 1);
        else return;
    } else { savedCart[index].quantity = newQty; }
    localStorage.setItem('myCart', JSON.stringify(savedCart));
    window.renderCartPage();
};

window.removePageItem = function (index) {
    var savedCart = JSON.parse(localStorage.getItem('myCart')) || [];
    savedCart.splice(index, 1);
    localStorage.setItem('myCart', JSON.stringify(savedCart));
    window.renderCartPage();
};

window.applyCartVoucher = async function () {
    const inputEl = document.getElementById('cart-voucher-input');
    const msgEl = document.getElementById('voucher-message');

    if (!inputEl || !msgEl) return;

    const code = inputEl.value.trim();
    if (!code) return msgEl.innerHTML = '<span style="color:red;">Vui lòng nhập mã giảm giá!</span>';

    msgEl.innerHTML = '<span style="color:#1435c3;">Đang kiểm tra mã...</span>';

    try {
        const res = await fetch('https://raumapc-backend-fms3.onrender.com/api/coupons/apply', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
        });
        const data = await res.json();

        if (data.success) {
            window.currentDiscountPercent = data.discountPercent;
            msgEl.innerHTML = `<span style="color:green;">✅ ${data.message}</span>`;
            window.renderCartPage();
        } else {
            window.currentDiscountPercent = 0;
            msgEl.innerHTML = `<span style="color:red;">❌ ${data.message}</span>`;
            window.renderCartPage();
        }
    } catch (e) {
        msgEl.innerHTML = '<span style="color:red;">❌ Lỗi kết nối! Vui lòng thử lại.</span>';
    }
};

// ==========================================
// HÀM MÔ PHỎNG MÃ QR CHUYỂN KHOẢN (ĐÃ TÍCH HỢP VIETQR TỰ ĐỘNG ĐIỀN)
// ==========================================
window.togglePaymentMethod = function () {
    const paymentMethods = document.getElementsByName('payment');
    const vnpaySection = document.getElementById('vnpay-info-section');

    let selectedMethod = 'cod';
    for (let radio of paymentMethods) { if (radio.checked) selectedMethod = radio.value; }

    if (selectedMethod === 'vnpay' || selectedMethod === 'banking') {
        if (vnpaySection) vnpaySection.style.display = 'block';
    } else {
        if (vnpaySection) vnpaySection.style.display = 'none';
    }
};

// --- XỬ LÝ ĐẶT HÀNG ---
window.processCheckout = function () {
    var currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.showCustomAlert("Bạn cần Đăng nhập để thực hiện thanh toán!", false, '../../pages/account/login.html');
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
    for (let radio of paymentMethods) { if (radio.checked) selectedMethod = radio.value; }

    var btn = document.getElementById('btn-submit-order');
    btn.innerText = "ĐANG XỬ LÝ...";
    btn.disabled = true;

    var totalValue = 0;
    savedCart.forEach(function (item) {
        var price = parseInt(String(item.price).replace(/\D/g, '')) || 0;
        var qty = parseInt(item.quantity) || 1;
        totalValue += price * qty;
    });

    if (window.currentDiscountPercent > 0) {
        totalValue = totalValue - (totalValue * window.currentDiscountPercent / 100);
    }

    // Nếu chọn QR, lấy cái mã ngẫu nhiên RM... làm Mã đơn hàng luôn để dễ bề đối chiếu
    const qrContent = document.getElementById('qr-content');
    // Tạo mã đơn hàng ngẫu nhiên
    const orderIdCode = 'RM' + Math.floor(Math.random() * 900000 + 100000);

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
        status: (selectedMethod === 'vnpay' || selectedMethod === 'banking') ? 'Đang chờ thanh toán' : 'Chờ duyệt',
        paymentMethod: (selectedMethod === 'vnpay' || selectedMethod === 'banking') ? 'Thanh toán VNPay' : 'Thanh toán COD'
    };

    fetch('https://raumapc-backend-fms3.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('authToken') },
        body: JSON.stringify(newOrder)
    })
        .then(response => response.json())
        .then(data => {
            // KIỂM TRA NẾU KHÁCH CHỌN CHUYỂN KHOẢN (VNPAY)
            // KIỂM TRA NẾU KHÁCH CHỌN CHUYỂN KHOẢN (VNPAY)
            if (selectedMethod === 'vnpay') {
                if (typeof window.showGlobalAlert === 'function') {
                    window.showGlobalAlert('Đang tạo mã bảo mật VNPay...', true);
                } else { alert('Đang tạo mã bảo mật VNPay...'); }

                // Xây dựng đường dẫn Return URL động an toàn nhất
                let currentHost = window.location.protocol + "//" + window.location.host;
                let safeReturnUrl = currentHost + "/pages/info/tracking.html";

                // Lấy nhanh IP thật của thiết bị khách hàng để gửi cho VNPay (Tùy chọn gia cố)
                fetch('https://api.ipify.org?format=json')
                    .then(ipRes => ipRes.json())
                    .then(ipData => {
                        const clientIp = ipData.ip || '113.190.233.15';

                        // Gọi API tạo link VNPay có đính kèm IP thật
                        return fetch('https://raumapc-backend-fms3.onrender.com/api/vnpay/create_url', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderId: orderIdCode,
                                amount: Math.round(totalValue),
                                returnUrl: safeReturnUrl,
                                ipAddr: clientIp // Truyền IP thẳng từ Client
                            })
                        });
                    })
                    .then(res2 => res2.json())
                    .then(vnpayData => {
                        if (vnpayData.success) {
                            // Xóa giỏ hàng an toàn trước khi chuyển hướng
                            localStorage.removeItem('myCart');
                            if (currentUser) {
                                currentUser.cart = [];
                                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                            }
                            // Chuyển hướng
                            window.location.href = vnpayData.url;
                        } else {
                            alert("VNPay phản hồi lỗi: " + (vnpayData.message || "Không xác định"));
                            btn.innerText = "ĐẶT HÀNG";
                            btn.disabled = false;
                        }
                    })
                    .catch(err => {
                        console.error("Lỗi VNPay Flow:", err);
                        alert("Lỗi khi kết nối cổng thanh toán VNPay!");
                        btn.innerText = "ĐẶT HÀNG";
                        btn.disabled = false;
                    });

            } else {
                // NẾU KHÁCH CHỌN TIỀN MẶT (COD) THÌ CHẠY NHƯ CŨ
                localStorage.removeItem('myCart');
                if (currentUser) {
                    currentUser.cart = [];
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }

                if (typeof window.showGlobalAlert === 'function') {
                    window.showGlobalAlert('🎉 Đặt hàng thành công! Hóa đơn chi tiết đã được gửi vào Email.', true, () => {
                        window.location.href = '../../pages/info/tracking.html';
                    });
                } else {
                    alert("🎉 Đặt hàng thành công! Hóa đơn chi tiết đã được gửi vào Email.");
                    window.location.href = '../../pages/info/tracking.html';
                }
            }
        })
        .catch(error => {
            alert("Lỗi kết nối máy chủ Render!");
            btn.innerText = "ĐẶT HÀNG";
            btn.disabled = false;
        });
};

document.addEventListener('DOMContentLoaded', window.renderCartPage);