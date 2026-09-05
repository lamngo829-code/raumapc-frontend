/* ==========================================================================
   RAU MÁ PC - CORE SYSTEM SCRIPT (LAYOUT & AUTHENTICATION)
   ========================================================================== */

/* ==========================================================================
   PHẦN 1: GIỎ HÀNG (CLOUD CART ĐỒNG BỘ MONGODB)
   ========================================================================== */

window.formatCurrency = function (number) { 
    return new Intl.NumberFormat('vi-VN').format(number) + 'đ'; 
};

window.parsePrice = function (priceString) { 
    return parseInt(priceString.replace(/\./g, '').replace('đ', '')) || 0; 
};

window.syncCartToCloud = function () {
    var token = localStorage.getItem('authToken');
    if (!token) return; 
    var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
    fetch('https://raumapc-backend.onrender.com/api/users/cart', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer ' + token 
        },
        body: JSON.stringify({ cart: currentCart })
    }).catch(err => console.log("Lỗi đồng bộ giỏ hàng nền"));
};

window.updateCartUI = function () {
    var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
    var totalQuantity = 0; 
    var totalPrice = 0;

    currentCart.forEach(item => {
        totalQuantity += parseInt(item.quantity) || 0;
        totalPrice += (parseInt(item.price) || 0) * (parseInt(item.quantity) || 0);
    });

    document.querySelectorAll('.cart-badge').forEach(badge => badge.innerText = totalQuantity);

    var cartHTML = '';
    if (currentCart.length === 0) {
        cartHTML = '<li class="empty-cart">Giỏ hàng của bạn đang trống</li>';
    } else {
        currentCart.forEach(item => {
            cartHTML += `
                <li class="cart-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${window.formatCurrency(item.price)} x ${item.quantity}</div>
                    </div>
                    <div class="cart-item-remove" onclick="window.removeFromCart('${item.id}')">X</div>
                </li>`;
        });
    }

    document.querySelectorAll('.cart-list').forEach(list => list.innerHTML = cartHTML);
    document.querySelectorAll('.total-price').forEach(priceEl => priceEl.innerText = window.formatCurrency(totalPrice));
};

window.addToCart = function (id, name, price, img) {
    var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
    var existingItem = currentCart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.quantity = parseInt(existingItem.quantity) + 1;
    } else {
        currentCart.push({ id: id, name: name, price: price, img: img, quantity: 1 });
    }

    localStorage.setItem('myCart', JSON.stringify(currentCart));
    window.updateCartUI();
    window.syncCartToCloud();
    
    if (typeof window.showGlobalAlert === 'function') {
        window.showGlobalAlert('Đã thêm sản phẩm vào giỏ hàng!', true);
    } else {
        alert('Đã thêm sản phẩm vào giỏ hàng!');
    }
};

window.removeFromCart = function (id) {
    var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
    currentCart = currentCart.filter(item => item.id !== id);
    localStorage.setItem('myCart', JSON.stringify(currentCart));

    window.updateCartUI();
    window.syncCartToCloud();
    if (typeof window.renderCartPage === 'function') window.renderCartPage();
};

document.addEventListener('DOMContentLoaded', function () {
    window.updateCartUI();
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            var productCard = this.closest('.product-card');
            var id = this.getAttribute('data-product-id');
            var name = productCard.querySelector('.product-name').innerText;
            var price = window.parsePrice(productCard.querySelector('.product-price').innerText);
            var img = productCard.querySelector('.product-img img').src;
            window.addToCart(id, name, price, img);
        });
    });
});

/* ==========================================================================
   PHẦN 2: HEADER TRƯỢT & MENU ĐIỀU HƯỚNG
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
    var stickyHeader = document.getElementById('myStickyHeader');
    var fullHeader = document.querySelector('.header');

    if (stickyHeader && fullHeader) {
        window.addEventListener('scroll', function () {
            var triggerPoint = fullHeader.offsetHeight;
            if (window.scrollY > triggerPoint) {
                stickyHeader.classList.add('show');
            } else {
                stickyHeader.classList.remove('show');
                var categoryParent = document.getElementById('stickyCategory');
                if (categoryParent) categoryParent.classList.remove('active');
            }
        });
    }

    var toggleCategoryBtn = document.getElementById('toggleCategory');
    var categoryParent = document.getElementById('stickyCategory');

    if (toggleCategoryBtn && categoryParent) {
        toggleCategoryBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            categoryParent.classList.toggle('active');
        });
    }

    document.addEventListener('click', function (e) {
        var dropdownMenu = document.getElementById('categoryDropdown');
        if (categoryParent && dropdownMenu && !toggleCategoryBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            categoryParent.classList.remove('active');
        }
    });
});

/* ==========================================================================
   PHẦN 3: TÌM KIẾM SẢN PHẨM TRỰC TIẾP
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const searchInputs = document.querySelectorAll('.search-input');
    if (searchInputs.length === 0) return;

    searchInputs.forEach(function (input) {
        let container = input.parentElement;
        container.style.position = 'relative';

        let resultBox = container.querySelector('.search-results');
        if (!resultBox) {
            resultBox = document.createElement('div');
            resultBox.className = 'search-results';
            container.appendChild(resultBox);
        }

        let timeoutId;

        input.addEventListener('input', function (e) {
            clearTimeout(timeoutId);
            const keyword = e.target.value.trim().toLowerCase();

            if (!keyword) {
                resultBox.classList.remove('active');
                resultBox.innerHTML = '';
                return;
            }

            const isSubPage = window.location.pathname.includes('/pages/');
            const basePath = isSubPage ? '../../' : '';
            const detailPath = `${basePath}pages/shop/product-detail.html`;

            resultBox.innerHTML = '<div style="padding:15px; text-align:center; color:#1435c3; font-size:14px; font-weight:bold;">⏳ Đang tìm kiếm...</div>';
            resultBox.classList.add('active');

            timeoutId = setTimeout(async () => {
                try {
                    const response = await fetch(`https://raumapc-backend.onrender.com/api/products`);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const allProducts = await response.json();

                    const filteredProducts = allProducts.filter(p => p.name && p.name.toLowerCase().includes(keyword));

                    if (!filteredProducts || filteredProducts.length === 0) {
                        resultBox.innerHTML = '<div style="padding:15px; text-align:center; color:#888; font-size:14px;">Không tìm thấy sản phẩm nào!</div>';
                    } else {
                        const displayProducts = filteredProducts.slice(0, 10);
                        resultBox.innerHTML = displayProducts.map(p => {
                            let safeImg = `${basePath}assets/images/icons/logo.jpg`;
                            if (p.img && p.img.trim() !== '') {
                                let imgPath = p.img.trim().replace(/"/g, '').replace(/\\/g, '/');
                                safeImg = (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:image')) ? imgPath : encodeURI(`${basePath}${imgPath}`);
                            }
                            let priceStr = typeof p.price === 'number' ? new Intl.NumberFormat('vi-VN').format(p.price) + 'đ' : p.price;
                            
                            // TẠO LINK CHUẨN SEO
                            let slug = (p.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                            let isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                            let linkHref = isLocal ? `${detailPath}?id=${p.id || p._id}` : `/${slug}`;

                            return `
                                <a href="${linkHref}" style="display:flex; align-items:center; padding:10px 12px; gap:12px; text-decoration:none; border-bottom:1px solid #f1f5f9; background:#fff; transition:0.2s;">
                                    <img src="${safeImg}" alt="${p.name}" style="width:45px; height:45px; object-fit:contain; border-radius:4px; border:1px solid #eee;" onerror="this.onerror=null; this.src='${basePath}assets/images/icons/logo.jpg';">
                                    <div style="flex:1; overflow:hidden;">
                                        <div style="font-size:13.5px; font-weight:600; color:#2b3674; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
                                        <div style="color:#d70018; font-weight:bold; font-size:13px; margin-top:3px;">${priceStr}</div>
                                    </div>
                                </a>`;
                        }).join('');
                    }
                } catch (err) {
                    resultBox.innerHTML = '<div style="padding:15px; text-align:center; color:#d70018; font-size:14px;">Lỗi tải dữ liệu. Vui lòng kiểm tra lại kết nối hoặc Server!</div>';
                }
            }, 500);
        });

        document.addEventListener('click', function (e) {
            if (!container.contains(e.target)) resultBox.classList.remove('active');
        });
    });
});

/* ==========================================================================
   PHẦN 4: ĐĂNG NHẬP, ĐĂNG XUẤT & ĐỒNG BỘ GIAO DIỆN TÀI KHOẢN
   ========================================================================== */

let loginTimerInterval;

window.handleLoginDedicated = function (event) {
    if (event) event.preventDefault();
    var usernameInput = document.getElementById('loginUser').value.trim();
    var passwordInput = document.getElementById('loginPass').value.trim();

    if (!usernameInput || !passwordInput) return window.showGlobalAlert("Vui lòng nhập đầy đủ tên tài khoản và mật khẩu!", false);

    var btn = document.querySelector('.btn-auth-primary');
    if (btn) { btn.innerText = "ĐANG KIỂM TRA..."; btn.disabled = true; }

    fetch('https://raumapc-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
    }).then(res => res.json()).then(data => {
        if (btn) { btn.innerText = "ĐĂNG NHẬP"; btn.disabled = false; }
        
        if (data.success) {
            if (data.requireOtp) {
                document.getElementById('login-otp-email-display').innerText = data.email;
                document.getElementById('login-otp-email-hidden').value = data.email;
                var otpBoxes = document.querySelectorAll('#login-otp-inputs .f-otp');
                otpBoxes.forEach(input => input.value = '');
                document.getElementById('login-otp-modal').style.display = 'flex';
                if (otpBoxes.length > 0) otpBoxes[0].focus();
                
                clearInterval(loginTimerInterval);
                let timeLeft = 60;
                let timerEl = document.getElementById('login-otp-timer');
                let resendBtn = document.getElementById('btn-resend-login-otp');
                if (timerEl) { timerEl.style.display = 'inline'; timerEl.innerHTML = `Mã sẽ hết hạn sau: <strong style="color: #d70018; font-size: 16px;">${timeLeft}s</strong>`; }
                if (resendBtn) resendBtn.style.display = 'none';

                loginTimerInterval = setInterval(() => {
                    timeLeft--;
                    if (timerEl) timerEl.innerHTML = `Mã sẽ hết hạn sau: <strong style="color: #d70018; font-size: 16px;">${timeLeft}s</strong>`;
                    if (timeLeft <= 0) {
                        clearInterval(loginTimerInterval);
                        if (timerEl) timerEl.style.display = 'none';
                        if (resendBtn) resendBtn.style.display = 'inline';
                    }
                }, 1000);
            } else {
                processLoginSuccess(data.token, data.user);
            }
        } else { window.showGlobalAlert(data.message, false); }
    }).catch(err => {
        window.showGlobalAlert("Lỗi kết nối máy chủ!", false);
        if (btn) { btn.innerText = "ĐĂNG NHẬP"; btn.disabled = false; }
    });
};

window.submitLoginOtp = function () {
    var email = document.getElementById('login-otp-email-hidden').value;
    var otpInputs = document.querySelectorAll('#login-otp-inputs .f-otp');
    var otp = Array.from(otpInputs).map(input => input.value).join('');

    if (!otp || otp.length !== 6) return window.showGlobalAlert("Vui lòng điền đầy đủ 6 số OTP!", false);

    var btnVerify = document.getElementById('btn-verify-login-otp');
    btnVerify.innerText = "ĐANG XÁC NHẬN..."; btnVerify.disabled = true;

    fetch('https://raumapc-backend.onrender.com/api/login-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: otp })
    }).then(res => res.json()).then(data => {
        btnVerify.innerText = "XÁC NHẬN VÀO WEB"; btnVerify.disabled = false;
        if (data.success) { processLoginSuccess(data.token, data.user); } 
        else { window.showGlobalAlert(data.message, false); }
    }).catch(err => {
        window.showGlobalAlert("Lỗi kết nối máy chủ!", false);
        btnVerify.innerText = "XÁC NHẬN VÀO WEB"; btnVerify.disabled = false;
    });
};

function processLoginSuccess(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify(user));

    var localCart = JSON.parse(localStorage.getItem('myCart')) || [];
    if (localCart.length > 0 && typeof window.syncCartToCloud === 'function') window.syncCartToCloud();
    else if (user.cart && user.cart.length > 0) localStorage.setItem('myCart', JSON.stringify(user.cart));
    else localStorage.removeItem('myCart');

    if (user.role === 'admin') {
        window.showGlobalAlert("Xin chào Quản trị viên! Đang chuyển vào khu vực Admin...", true, () => window.location.href = '../../admin/admin.html');
    } else {
        window.showGlobalAlert("Đăng nhập thành công!", true, () => window.location.href = '../../index.html');
    }
}

window.closeLoginOtpModal = function(e) {
    if(e) e.preventDefault();
    document.getElementById('login-otp-modal').style.display = 'none';
    clearInterval(loginTimerInterval);
};

window.resendLoginOtp = function(e) {
    e.preventDefault();
    window.handleLoginDedicated(); 
}

window.handleLogout = function (e) {
    if (e) e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('myCart');

    const finishLogout = () => {
        if (window.location.pathname.includes('/pages/')) {
            window.location.href = '../../index.html';
        } else {
            window.updateAccountUI();
            if (typeof window.updateCartUI === 'function') window.updateCartUI();
        }
    };

    if (typeof window.showGlobalAlert === 'function') {
        window.showGlobalAlert("Bạn đã đăng xuất thành công!", true, finishLogout);
    } else {
        alert("Bạn đã đăng xuất!");
        finishLogout();
    }
};

window.updateAccountUI = function () {
    var currentUser = null; 
    try { currentUser = JSON.parse(localStorage.getItem('currentUser')); } catch (e) { }
    
    document.querySelectorAll('.account-wrapper').forEach(wrapper => {
        var inPagesFolder = window.location.pathname.includes('/pages/');
        var prefix = inPagesFolder ? '../../' : ''; 
        var pagesPrefix = inPagesFolder ? '../' : 'pages/';

        if (currentUser) {
            var firstName = currentUser.fullName.split(' ')[0];
            wrapper.innerHTML = `
                <div class="account-trigger">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffeb3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <div class="account-text-wrap">
                        <span class="acc-small" style="color:#ffeb3b;">Xin chào,</span>
                        <span class="acc-large" style="color:#ffeb3b;">${firstName} ▾</span>
                    </div>
                </div>
                <div class="account-dropdown-menu">
                    <a href="${prefix}${pagesPrefix}../../pages/account/profile.html" class="user-menu-link">Thông tin cá nhân</a>
                    <a href="${prefix}${pagesPrefix}../../pages/account/orders.html" class="user-menu-link">Đơn hàng của tôi</a>
                    <a href="#" class="user-menu-link logout-text" onclick="window.handleLogout(event)">Đăng xuất</a>
                </div>`;
        } else {
            wrapper.innerHTML = `
                <div class="account-trigger">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <div class="account-text-wrap"><span class="acc-small">Đăng nhập / Đăng ký</span><span class="acc-large">Tài khoản ▾</span></div>
                </div>
                <div class="account-dropdown-menu">
                    <a href="${prefix}${pagesPrefix}../../pages/account/login.html" style="display:block; text-align:center; text-decoration:none; background:#1435c3; color:white; padding:10px; border-radius:4px; font-weight:bold; margin-bottom:10px;">Đăng nhập</a>
                    <a href="${prefix}${pagesPrefix}../../pages/account/register.html" style="display:block; text-align:center; text-decoration:none; background:white; color:#333; border:1px solid #ccc; padding:10px; border-radius:4px; font-weight:bold;">Đăng ký</a>
                </div>`;
        }
    });
};
document.addEventListener('DOMContentLoaded', window.updateAccountUI);

/* ==========================================================================
   PHẦN 5: ĐĂNG KÝ TÀI KHOẢN (OTP 6 Ô TỰ NHẢY & ĐẾM NGƯỢC 60S)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function() {
    function setupSmartOTP(selector) {
        const otpInputs = document.querySelectorAll(selector);
        if (otpInputs.length === 0) return;

        otpInputs.forEach((input, index) => {
            input.setAttribute('type', 'tel');
            input.setAttribute('autocomplete', 'one-time-code');

            input.addEventListener("paste", (e) => {
                e.preventDefault(); 
                let pasteData = (e.clipboardData || window.clipboardData).getData("text");
                let numbers = pasteData.replace(/[^0-9]/g, '').split('');
                
                numbers.forEach((num, i) => {
                    if (index + i < otpInputs.length) {
                        otpInputs[index + i].value = num;
                    }
                });
                
                let nextFocus = Math.min(index + numbers.length, otpInputs.length) - 1;
                setTimeout(() => otpInputs[nextFocus].focus(), 10);
            });

            input.addEventListener("input", (e) => {
                let val = input.value.replace(/[^0-9]/g, ''); 
                
                if (val.length > 1) {
                    let chars = val.split('');
                    chars.forEach((char, i) => {
                        if (index + i < otpInputs.length) {
                            otpInputs[index + i].value = char;
                        }
                    });
                    input.value = chars[0]; 
                    let nextFocus = Math.min(index + chars.length, otpInputs.length) - 1;
                    setTimeout(() => otpInputs[nextFocus].focus(), 10);
                } else {
                    input.value = val;
                    if (val !== '' && index < otpInputs.length - 1) {
                        setTimeout(() => otpInputs[index + 1].focus(), 10);
                    }
                }
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && input.value === '' && index > 0) {
                    setTimeout(() => otpInputs[index - 1].focus(), 10);
                }
            });
        });
    }

    setupSmartOTP("#otp-inputs .otp-box"); 
    setupSmartOTP(".f-otp");               
});

let otpCountdownInterval;

function startOtpCountdown() {
    clearInterval(otpCountdownInterval);
    let timeLeft = 60;
    var timerEl = document.getElementById('otp-timer');
    var resendBtn = document.getElementById('btn-resend-otp');

    if (timerEl) {
        timerEl.style.display = 'inline';
        timerEl.innerHTML = `Mã sẽ hết hạn sau: <strong style="color: #d70018; font-size: 16px;">${timeLeft}s</strong>`;
    }
    if (resendBtn) resendBtn.style.display = 'none';

    otpCountdownInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.innerHTML = `Mã sẽ hết hạn sau: <strong style="color: #d70018; font-size: 16px;">${timeLeft}s</strong>`;

        if (timeLeft <= 0) {
            clearInterval(otpCountdownInterval);
            if (timerEl) timerEl.style.display = 'none';
            if (resendBtn) resendBtn.style.display = 'inline';
        }
    }, 1000);
}

window.handleRegisterDedicated = function (e) {
    e.preventDefault();
    var name = document.getElementById('regName').value.trim();
    var user = document.getElementById('regUser').value.trim();
    var pass = document.getElementById('regPass').value.trim();
    var phone = document.getElementById('regPhone').value.trim();
    var email = document.getElementById('regEmail').value.trim();

    if (!name || !user || !pass || !phone || !email) return alert("Vui lòng nhập đầy đủ thông tin!");

    var btn = document.querySelector('.btn-auth-primary');
    btn.innerText = "ĐANG GỬI MÃ OTP...";
    btn.disabled = true;

    fetch('https://raumapc-backend.onrender.com/api/request-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, username: user })
    }).then(res => res.json()).then(data => {
        btn.innerText = "ĐĂNG KÝ MỚI";
        btn.disabled = false;
        if (!data.success) return alert("⚠️ " + data.message);

        document.getElementById('otp-email-display').innerText = email;
        var otpBoxes = document.querySelectorAll('#otp-inputs .otp-box');
        otpBoxes.forEach(input => input.value = '');
        document.getElementById('otp-modal').style.display = 'flex';
        if (otpBoxes.length > 0) otpBoxes[0].focus();
        startOtpCountdown();

    }).catch(err => {
        alert("Lỗi kết nối máy chủ!");
        btn.innerText = "ĐĂNG KÝ MỚI";
        btn.disabled = false;
    });
};

window.resendRegisterOtp = function (e) {
    e.preventDefault();
    var user = document.getElementById('regUser').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var btnResend = document.getElementById('btn-resend-otp');

    btnResend.innerText = "Đang gửi...";
    btnResend.style.pointerEvents = "none";

    fetch('https://raumapc-backend.onrender.com/api/request-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, username: user })
    }).then(res => res.json()).then(data => {
        btnResend.innerText = "🔄 Gửi lại mã mới";
        btnResend.style.pointerEvents = "auto";
        if (!data.success) return alert("⚠️ " + data.message);

        alert("✅ Đã gửi lại mã OTP mới vào Email!");
        var otpBoxes = document.querySelectorAll('#otp-inputs .otp-box');
        otpBoxes.forEach(input => input.value = '');
        if (otpBoxes.length > 0) otpBoxes[0].focus();
        startOtpCountdown();
    }).catch(err => {
        alert("Lỗi kết nối!");
        btnResend.innerText = "🔄 Gửi lại mã mới";
        btnResend.style.pointerEvents = "auto";
    });
};

window.submitRegistration = function () {
    var name = document.getElementById('regName').value.trim();
    var user = document.getElementById('regUser').value.trim();
    var pass = document.getElementById('regPass').value.trim();
    var phone = document.getElementById('regPhone').value.trim();
    var email = document.getElementById('regEmail').value.trim();

    var otpInputs = document.querySelectorAll('#otp-inputs .otp-box');
    var otp = Array.from(otpInputs).map(input => input.value).join('');

    if (!otp || otp.length !== 6) return window.showGlobalAlert("Vui lòng điền đầy đủ 6 số OTP!", false);

    var btnVerify = document.getElementById('btn-verify-otp');
    btnVerify.innerText = "ĐANG TẠO TÀI KHOẢN...";
    btnVerify.disabled = true;

    fetch('https://raumapc-backend.onrender.com/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: name, username: user, password: pass, phone: phone, email: email, otp: otp })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            window.showGlobalAlert("Đăng ký thành công! Chuyển sang trang Đăng nhập...", true, () => {
                window.location.href = '../../pages/account/login.html';
            });
        } else {
            window.showGlobalAlert(data.message, false);
            btnVerify.innerText = "XÁC NHẬN ĐĂNG KÝ";
            btnVerify.disabled = false;
        }
    }).catch(err => {
        window.showGlobalAlert("Lỗi kết nối máy chủ!", false);
        btnVerify.innerText = "XÁC NHẬN ĐĂNG KÝ";
        btnVerify.disabled = false;
    });
};

window.closeOtpModal = function (e) {
    if (e) e.preventDefault();
    document.getElementById('otp-modal').style.display = 'none';
    clearInterval(otpCountdownInterval);
};

/* ==========================================================================
   PHẦN 6: QUÊN MẬT KHẨU (GIAO DIỆN OTP 6 Ô TẠI TRANG LOGIN)
   ========================================================================== */

let forgotCountdownInterval;

function startForgotCountdown() {
    clearInterval(forgotCountdownInterval);
    let timeLeft = 60;
    var timerEl = document.getElementById('forgot-otp-timer');
    var resendBtn = document.getElementById('btn-resend-forgot');

    if (timerEl) {
        timerEl.style.display = 'inline';
        timerEl.innerHTML = `Mã sẽ hết hạn sau: <strong style="color: #d70018; font-size: 16px;">${timeLeft}s</strong>`;
    }
    if (resendBtn) resendBtn.style.display = 'none';

    forgotCountdownInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.innerHTML = `Mã sẽ hết hạn sau: <strong style="color: #d70018; font-size: 16px;">${timeLeft}s</strong>`;

        if (timeLeft <= 0) {
            clearInterval(forgotCountdownInterval);
            if (timerEl) timerEl.style.display = 'none';
            if (resendBtn) resendBtn.style.display = 'inline';
        }
    }, 1000);
}

window.handleForgotPassword = function (e) {
    if (e) e.preventDefault();
    document.getElementById('forgot-modal').style.display = 'flex';
    document.getElementById('forgot-step-1').classList.remove('step-hidden');
    document.getElementById('forgot-step-2').classList.add('step-hidden');
    document.getElementById('forgot-email-input').value = '';
};

window.requestForgotPassword = function () {
    var email = document.getElementById('forgot-email-input').value.trim();
    if (!email) return alert("Vui lòng nhập Email!");

    var btn = document.getElementById('btn-request-forgot');
    btn.innerText = "ĐANG GỬI MÃ...";
    btn.disabled = true;

    fetch('https://raumapc-backend.onrender.com/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    }).then(res => res.json()).then(data => {
        btn.innerText = "GỬI MÃ XÁC NHẬN";
        btn.disabled = false;
        if (!data.success) return alert("❌ " + data.message);

        document.getElementById('forgot-step-1').classList.add('step-hidden');
        document.getElementById('forgot-step-2').classList.remove('step-hidden');
        document.getElementById('forgot-email-display').innerText = email;
        document.querySelectorAll('.f-otp').forEach(input => input.value = '');
        document.getElementById('forgot-new-pass').value = '';
        setTimeout(() => document.querySelectorAll('.f-otp')[0].focus(), 100);
        startForgotCountdown();
    }).catch(err => {
        alert("Lỗi kết nối máy chủ!");
        btn.innerText = "GỬI MÃ XÁC NHẬN";
        btn.disabled = false;
    });
};

window.resendForgotOtp = function (e) {
    e.preventDefault();
    var email = document.getElementById('forgot-email-input').value.trim();
    var btnResend = document.getElementById('btn-resend-forgot');
    btnResend.innerText = "Đang gửi...";
    btnResend.style.pointerEvents = "none";

    fetch('https://raumapc-backend.onrender.com/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    }).then(res => res.json()).then(data => {
        btnResend.innerText = "🔄 Gửi lại mã mới";
        btnResend.style.pointerEvents = "auto";
        if (!data.success) return alert("❌ " + data.message);

        document.querySelectorAll('.f-otp').forEach(input => input.value = '');
        document.querySelectorAll('.f-otp')[0].focus();
        startForgotCountdown();
    }).catch(err => {
        alert("Lỗi kết nối!");
        btnResend.innerText = "🔄 Gửi lại mã mới";
        btnResend.style.pointerEvents = "auto";
    });
};

window.submitForgotPassword = function () {
    var email = document.getElementById('forgot-email-input').value.trim();
    var newPass = document.getElementById('forgot-new-pass').value.trim();
    var otp = Array.from(document.querySelectorAll('.f-otp')).map(input => input.value).join('');

    if (otp.length !== 6) return alert("Vui lòng điền đầy đủ 6 số OTP!");
    if (newPass.length < 6) return alert("Mật khẩu mới phải có ít nhất 6 ký tự!");

    var btnVerify = document.getElementById('btn-verify-forgot');
    btnVerify.innerText = "ĐANG XỬ LÝ...";
    btnVerify.disabled = true;

    fetch('https://raumapc-backend.onrender.com/api/forgot-password-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: otp, newPassword: newPass })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            alert("🎉 " + data.message);
            window.closeForgotModal();
        } else {
            alert("❌ " + data.message);
            btnVerify.innerText = "XÁC NHẬN ĐỔI MẬT KHẨU";
            btnVerify.disabled = false;
        }
    }).catch(err => {
        alert("Lỗi kết nối máy chủ!");
        btnVerify.innerText = "XÁC NHẬN ĐỔI MẬT KHẨU";
        btnVerify.disabled = false;
    });
};

window.closeForgotModal = function (e) {
    if (e) e.preventDefault();
    document.getElementById('forgot-modal').style.display = 'none';
    clearInterval(forgotCountdownInterval);
};

/* ==========================================================================
   HỆ THỐNG BẢNG THÔNG BÁO TÙY CHỈNH TOÀN CỤC (GLOBAL ALERT)
   ========================================================================== */
window.showGlobalAlert = function(message, isSuccess = true, callback = null) {
    let modal = document.getElementById('global-custom-alert');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-custom-alert';
        modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); z-index: 999999; justify-content: center; align-items: center; backdrop-filter: blur(4px);';
        modal.innerHTML = `
            <div style="background: #fff; padding: 30px 25px; border-radius: 16px; width: 350px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transform: scale(0.95); animation: popIn 0.2s forwards;">
                <div id="gca-icon" style="margin-bottom: 15px;"></div>
                <h3 id="gca-title" style="margin-bottom: 10px; font-size: 20px; font-weight: bold;">Thông báo</h3>
                <p id="gca-message" style="font-size: 15px; color: #475569; margin-bottom: 25px; line-height: 1.5;"></p>
                <button id="gca-btn" style="background: #1435c3; color: white; border: none; padding: 12px 35px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; transition: 0.2s; width: 100%;">Đồng ý</button>
            </div>
            <style>@keyframes popIn { to { transform: scale(1); } }</style>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('gca-message').innerText = message.replace(/^([❌✅🎉👑⚠️]\s*)/, '');
    const iconBox = document.getElementById('gca-icon');
    const title = document.getElementById('gca-title');
    
    if (isSuccess) {
        iconBox.innerHTML = '<div style="background: #dcfce7; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
        title.innerText = 'Thành Công!'; title.style.color = '#059669';
    } else {
        iconBox.innerHTML = '<div style="background: #fee2e2; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>';
        title.innerText = 'Thông Báo Lỗi!'; title.style.color = '#dc2626';
    }

    modal.style.display = 'flex';
    document.getElementById('gca-btn').onclick = function() {
        modal.style.display = 'none';
        if(callback) callback();
    };
};

/* ==========================================================================
   HỆ THỐNG BẢNG XÁC NHẬN TÙY CHỈNH (GLOBAL CONFIRM)
   ========================================================================== */
window.showGlobalConfirm = function(message, onConfirm) {
    let modal = document.getElementById('global-custom-confirm');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-custom-confirm';
        modal.style.cssText = 'display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.6); z-index: 999999; justify-content: center; align-items: center; backdrop-filter: blur(4px);';
        modal.innerHTML = `
            <div style="background: #fff; padding: 30px 25px; border-radius: 16px; width: 350px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); transform: scale(0.95); animation: popIn 0.2s forwards;">
                <div style="background: #fef08a; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <h3 style="margin-bottom: 10px; font-size: 20px; font-weight: bold; color: #ca8a04;">Xác nhận</h3>
                <p id="gcc-message" style="font-size: 15px; color: #475569; margin-bottom: 25px; line-height: 1.5;"></p>
                <div style="display: flex; gap: 10px;">
                    <button id="gcc-btn-cancel" style="background: #f1f5f9; color: #475569; border: none; padding: 12px 0; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; flex: 1; transition: 0.2s;">Hủy</button>
                    <button id="gcc-btn-confirm" style="background: #dc2626; color: white; border: none; padding: 12px 0; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 15px; flex: 1; transition: 0.2s;">Đồng ý</button>
                </div>
            </div>
            <style>@keyframes popIn { to { transform: scale(1); } }</style>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('gcc-message').innerText = message;
    modal.style.display = 'flex';

    document.getElementById('gcc-btn-cancel').onclick = function() {
        modal.style.display = 'none';
    };
    
    document.getElementById('gcc-btn-confirm').onclick = function() {
        modal.style.display = 'none';
        if(onConfirm) onConfirm();
    };
};

/* ==========================================================================
   PHẦN 8: CHUYỂN TRANG CHI TIẾT & MENU MOBILE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    var productCards = document.querySelectorAll('.product-card');
    
    // Hàm rút gọn chữ tiếng Việt thành Link SEO
    function toSlug(str) {
        if (!str) return '';
        return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    productCards.forEach(function (card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function (e) {
            if (e.target.classList.contains('add-to-cart')) return;
            e.preventDefault();

            var btnAddCart = card.querySelector('.add-to-cart');
            if (!btnAddCart) return;

            var productId = btnAddCart.getAttribute('data-product-id');
            var productName = card.querySelector('.product-name').innerText;
            var slug = toSlug(productName);

            var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isLocal) {
                var inPagesFolder = window.location.pathname.includes('/pages/');
                var detailPath = inPagesFolder ? '../../pages/shop/product-detail.html' : 'pages/shop/product-detail.html';
                window.location.href = detailPath + '?id=' + productId;
            } else {
                // CHUYỂN HƯỚNG BẰNG LINK SIÊU NGẮN TRÊN VERCEL
                window.location.href = '/' + slug;
            }
        });
    });
});

document.addEventListener('click', function (e) {
    if (window.innerWidth <= 768) {
        var accWrap = e.target.closest('.account-wrapper');
        var cartWrap = e.target.closest('.cart-wrapper');

        if (e.target.closest('.account-dropdown-menu') || e.target.closest('.mini-cart')) return;

        function hideAll() {
            document.querySelectorAll('.account-dropdown-menu, .mini-cart').forEach(m => m.classList.remove('mobile-show'));
        }

        if (accWrap) {
            e.preventDefault();
            var accMenu = accWrap.querySelector('.account-dropdown-menu');
            var isHidden = !accMenu || !accMenu.classList.contains('mobile-show');
            hideAll();
            if (isHidden && accMenu) accMenu.classList.add('mobile-show');
        } else if (cartWrap) {
            e.preventDefault();
            var cartMenu = cartWrap.querySelector('.mini-cart');
            var isHidden = !cartMenu || !cartMenu.classList.contains('mobile-show');
            hideAll();
            if (isHidden && cartMenu) cartMenu.classList.add('mobile-show');
        } else {
            hideAll();
        }
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const megaLinks = document.querySelectorAll('.mega-item > a');
    megaLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                const parentItem = this.parentElement;
                const subMenu = parentItem.querySelector('.mega-content');
                if (subMenu) {
                    e.preventDefault();
                    document.querySelectorAll('.mega-item').forEach(item => {
                        if (item !== parentItem) item.classList.remove('active');
                    });
                    parentItem.classList.toggle('active');
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var megaItems = document.querySelectorAll('.mega-item');
    megaItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
            if (window.innerWidth <= 768) {
                if (e.target.closest('.mega-content a')) return;
                var content = item.querySelector('.mega-content');
                if (content) {
                    e.preventDefault();
                    var isOpen = item.classList.contains('open');
                    megaItems.forEach(function (el) { el.classList.remove('open'); });
                    if (!isOpen) item.classList.add('open');
                }
            }
        });
    });
});

/* ==========================================================================
   PHẦN 9: TỰ ĐỘNG ĐĂNG XUẤT NẾU TÀI KHOẢN BỊ XÓA (KIỂM TRA NGẦM)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function() {
    var token = localStorage.getItem('authToken');
    if (token) {
        fetch('https://raumapc-backend.onrender.com/api/auth/verify', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(res => res.json())
        .then(data => {
            if (data.accountDeleted) {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
                localStorage.removeItem('myCart');
                
                if (typeof window.showGlobalAlert === 'function') {
                    window.showGlobalAlert("Tài khoản của bạn đã bị xóa khỏi hệ thống!", false, () => {
                        window.location.href = '../../index.html';
                    });
                } else {
                    alert("Tài khoản của bạn đã bị xóa khỏi hệ thống!");
                    window.location.href = '../../index.html';
                }
            }
        }).catch(err => console.log("Bỏ qua kiểm tra kết nối"));
    }
});