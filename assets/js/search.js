/* ==========================================================================
   TẬP LỆNH XỬ LÝ TRANG KẾT QUẢ TÌM KIẾM SẢN PHẨM (GIỮ NGUYÊN BỘ LỌC CŨ)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const keyword = urlParams.get('q');
    const titleEl = document.getElementById('search-title');
    const countEl = document.getElementById('search-count');
    const gridEl = document.getElementById('search-results-grid');

    if (!titleEl || !gridEl) return;

    if (!keyword || keyword.trim() === "") {
        titleEl.innerText = "Vui lòng nhập từ khóa!";
        countEl.innerText = "Không có thông tin để tìm kiếm.";
        return;
    }

    const keywordLower = keyword.trim().toLowerCase();
    titleEl.innerHTML = `Kết quả tìm kiếm cho: <span style="color: #1435c3;">"${keyword}"</span>`;

    // ==========================================
    // HIỆU ỨNG SKELETON TRONG LÚC CHỜ API
    // ==========================================
    let skeletonHTML = '';
    for (let i = 0; i < 8; i++) { // Render 8 khung xám
        skeletonHTML += `
        <div class="skeleton-card" style="margin-bottom: 20px;">
            <div class="skeleton-item sk-img" style="height: 160px;"></div>
            <div class="skeleton-item sk-title" style="height: 20px; width: 85%;"></div>
            <div class="skeleton-item sk-desc" style="height: 14px; width: 60%;"></div>
            <div class="skeleton-item sk-price" style="height: 24px; width: 45%; margin-top: 10px;"></div>
        </div>`;
    }
    gridEl.innerHTML = skeletonHTML;

    try {
        const response = await fetch(`https://raumapc-backend-fms3.onrender.com/api/products?search=${encodeURIComponent(keywordLower)}&limit=100`);
        const result = await response.json();

        const products = result.data ? result.data : result;

        // BỘ LỌC THÔNG MINH KẾT HỢP XỬ LÝ NGOẠI LỆ (NGUYÊN BẢN CỦA BẠN)
        const filtered = products.filter(p => {
            if (!p.name) return false;
            const nameLower = p.name.toLowerCase();
            const catLower = (p.category || "").toLowerCase();

            // Kiểm tra từ khóa có nằm trong tên hoặc danh mục
            let isMatch = nameLower.includes(keywordLower) || catLower.includes(keywordLower);

            // BỘ LỌC SÁT THỦ: GIẢI QUYẾT TRIỆT ĐỂ LỖI "TÌM CPU RA TẢN NHIỆT"
            if (isMatch) {
                if ((keywordLower === 'cpu' || keywordLower === 'intel' || keywordLower === 'amd') && !keywordLower.includes('tản')) {
                    if (nameLower.includes('tản nhiệt') || catLower.includes('tản nhiệt') || nameLower.includes('cooler') || nameLower.includes('fan') || nameLower.includes('keo')) {
                        return false;
                    }
                }
                if (keywordLower === 'ram') {
                    if (nameLower.includes('ngàm') || nameLower.includes('khung')) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        });

        if (filtered.length === 0) {
            countEl.innerText = "Rất tiếc, không tìm thấy sản phẩm nào!";
            gridEl.innerHTML = `
                <div class="search-empty-state">
                    <span class="search-empty-icon">🔍</span>
                    <h3 style="color: #333; font-size: 20px; margin-bottom: 10px;">Không tìm thấy kết quả phù hợp</h3>
                    <p style="color: #666; font-size: 15px; margin-bottom: 20px;">Vui lòng kiểm tra lại lỗi chính tả hoặc thử tìm kiếm bằng một từ khóa chung chung hơn (VD: RTX, RAM, Mainboard...).</p>
                    <a href="../../index.html" style="background: #1435c3; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">QUAY VỀ TRANG CHỦ</a>
                </div>`;
            return;
        }

        countEl.innerText = `Tìm thấy ${filtered.length} sản phẩm phù hợp với từ khóa của bạn.`;

        // RENDER GIAO DIỆN KẾT QUẢ TÌM KIẾM CÓ ẨN GIÁ (NGUYÊN BẢN CỦA BẠN)
        gridEl.innerHTML = filtered.map(p => {
            let safeImg = `../../assets/images/icons/logo.jpg`;
            if (p.img && p.img.trim() !== '') {
                let imgPath = p.img.trim().replace(/"/g, '').replace(/\\/g, '/');
                safeImg = (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:image')) ? imgPath : encodeURI(`../../${imgPath}`);
            }

            let priceStr = '0đ';
            if (typeof p.price === 'number') {
                priceStr = new Intl.NumberFormat('vi-VN').format(p.price) + 'đ';
            } else if (p.price) {
                priceStr = p.price;
            }
            
            let safeId = p.productId || p.id || p._id; // Dùng để gắn vào Link URL
            let realId = p.id || p._id; // ĐÃ FIX: Bắt buộc dùng ID gốc của MongoDB cho Giỏ hàng

            let currentStatus = p.status || 'Còn hàng';
            let buttonHtml = '';
            let priceDisplay = priceStr;

            if (currentStatus === 'Còn hàng') {
                // ĐÃ FIX: Đổi data-product-id="${safeId}" thành "${realId}"
                buttonHtml = `<button class="add-to-cart search-add-btn" data-product-id="${realId}" data-name="${p.name}" data-price="${p.price || 0}" data-img="${safeImg}">Thêm vào giỏ hàng</button>`;
            }
            else if (currentStatus === 'Hết hàng') {
                priceDisplay = '<span style="color: #dc2626; font-size: 15px;">Hết hàng</span>';
                buttonHtml = `<button class="search-add-btn" style="background: #e2e8f0; color: #94a3b8; border: 1px solid #e2e8f0; cursor: not-allowed;" onclick="event.preventDefault();">ĐÃ HẾT HÀNG</button>`;
            }
            else if (currentStatus === 'Liên hệ') {
                priceDisplay = '<span style="color: #ea580c; font-size: 15px;">Giá: Liên hệ</span>';
                buttonHtml = `<button class="search-add-btn" style="background: #ffffff; color: #ea580c; border: 1px solid #ea580c; cursor: pointer;" onclick="event.preventDefault(); window.location.href='../../pages/info/contact.html';">LIÊN HỆ TƯ VẤN</button>`;
            }

            return `
            <div class="search-pro-card">
                <a href="product-detail.html?id=${safeId}" class="search-pro-img">
                    <img src="${safeImg}" alt="${p.name}" onerror="this.src='../../assets/images/icons/logo.jpg'">
                </a>
                <div class="search-pro-content">
                    <a href="product-detail.html?id=${safeId}" class="search-pro-name" title="${p.name}">${p.name}</a>
                    <div class="search-pro-bottom">
                        <span class="search-pro-price">${priceDisplay}</span>
                        ${buttonHtml}
                    </div>
                </div>
            </div>`;
        }).join('');

        // Kích hoạt sự kiện thêm vào giỏ hàng
        gridEl.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function () {
                var id = this.getAttribute('data-product-id');
                var name = this.getAttribute('data-name');

                // Tránh lỗi khi price chưa có chữ đ
                var priceRaw = this.getAttribute('data-price').toString();
                var priceWithCurrency = priceRaw.includes('đ') ? priceRaw : priceRaw + 'đ';
                var price = window.parsePrice(priceWithCurrency);

                var img = this.getAttribute('data-img');
                if (typeof window.addToCart === 'function') {
                    window.addToCart(id, name, price, img);
                }
            });
        });

    } catch (err) {
        countEl.innerText = "Lỗi kết nối";
        gridEl.innerHTML = `<div class="search-empty-state" style="border-color: #fecdd3; background: #fff1f2;"><p style="color: #e11d48; margin: 0; font-weight: 700;">Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau!</p></div>`;
    }
});