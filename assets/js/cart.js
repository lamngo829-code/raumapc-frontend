window.formatMoney = function(number) { 
    return new Intl.NumberFormat('vi-VN').format(number) + ' đ'; 
};

window.renderCartPage = function() {
    if(typeof window.syncCartToCloud === 'function') window.syncCartToCloud();
    var savedCart = JSON.parse(localStorage.getItem('myCart')) || []; 
    var listContainer = document.getElementById('checkout-list');
    if (!listContainer) return;

    if (savedCart.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding: 40px; color: #888;">Giỏ hàng của bạn đang trống!</div>';
        document.getElementById('checkout-subtotal').innerText = '0 đ';
        document.getElementById('checkout-final-total').innerText = '0 đ';
        return;
    }

    var html = ''; var totalValue = 0;
    savedCart.forEach(function(item, index) {
        // KHẮC PHỤC LỖI TÀNG HÌNH BẰNG String()
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
    document.getElementById('checkout-subtotal').innerText = window.formatMoney(totalValue);
    document.getElementById('checkout-final-total').innerText = window.formatMoney(totalValue);
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


// --- XỬ LÝ ĐẶT HÀNG & GỬI EMAIL XỊN SÒ (ĐỒNG BỘ GIAO DIỆN CHỜ DUYỆT) ---
// --- XỬ LÝ ĐẶT HÀNG AN TOÀN (GIAO VIỆC GỬI MAIL CHO BACKEND) ---
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

    if (!name || !phone || !email || !address) {
        if (typeof window.showGlobalAlert === 'function') return window.showGlobalAlert("Vui lòng nhập đầy đủ thông tin bắt buộc (*)", false);
        return alert("Vui lòng nhập đầy đủ thông tin bắt buộc (*)");
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
    
    var newOrder = {
        orderId: 'RM' + Math.floor(Math.random() * 900000 + 100000), 
        date: new Date().toLocaleString('vi-VN'),
        username: `${name} (${phone} - ${address})`,
        account: currentUser.username, 
        email: email, 
        items: savedCart,
        total: totalValue,
        status: 'Chờ duyệt'
    };

    // Đẩy thông tin lên Backend an toàn
    fetch('https://raumapc-backend.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
    })
    .then(response => response.json())
    .then(data => {
        localStorage.removeItem('myCart'); 
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