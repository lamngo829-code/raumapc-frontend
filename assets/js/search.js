/* ==========================================================================
   TẬP LỆNH XỬ LÝ TRANG KẾT QUẢ TÌM KIẾM SẢN PHẨM (BỘ LỌC NÂNG CAO)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async function() {
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

    try {
        const response = await fetch('https://raumapc-backend.onrender.com/api/products');
        const products = await response.json();

        // BỘ LỌC THÔNG MINH KẾT HỢP XỬ LÝ NGOẠI LỆ
        const filtered = products.filter(p => {
            if (!p.name) return false;
            const nameLower = p.name.toLowerCase();
            const catLower = (p.category || "").toLowerCase();

            // Kiểm tra từ khóa có nằm trong tên hoặc danh mục
            let isMatch = nameLower.includes(keywordLower) || catLower.includes(keywordLower);

            // BỘ LỌC SÁT THỦ: GIẢI QUYẾT TRIỆT ĐỂ LỖI "TÌM CPU RA TẢN NHIỆT"
            if (isMatch) {
                // Nếu khách chỉ gõ chính xác "cpu" (hoặc "intel", "amd") mà không có chữ "tản"
                if ((keywordLower === 'cpu' || keywordLower === 'intel' || keywordLower === 'amd') && !keywordLower.includes('tản')) {
                    // Chặn tất cả các món là Tản nhiệt, Quạt, Keo tản nhiệt
                    if (nameLower.includes('tản nhiệt') || catLower.includes('tản nhiệt') || nameLower.includes('cooler') || nameLower.includes('fan') || nameLower.includes('keo')) {
                        return false; 
                    }
                }
                
                // Tương tự, nếu tìm "ram" thì chặn những sản phẩm là "ngàm", "tràm"... (tránh dính chuỗi)
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

        // Render HTML cấu trúc Thẻ chuẩn E-commerce (Button Tràn Viền)
        gridEl.innerHTML = filtered.map(p => {
            let safeImg = `../../assets/images/icons/logo.jpg`;
            if (p.img && p.img.trim() !== '') {
                let imgPath = p.img.trim().replace(/"/g, '').replace(/\\/g, '/');
                safeImg = (imgPath.startsWith('http://') || imgPath.startsWith('https://') || imgPath.startsWith('data:image')) ? imgPath : encodeURI(`../../${imgPath}`);
            }
            
            let priceStr = typeof p.price === 'number' ? new Intl.NumberFormat('vi-VN').format(p.price) + 'đ' : p.price;
            let safeId = p.productId || p.id || p._id;

            return `
            <div class="search-pro-card">
                <a href="product-detail.html?id=${safeId}" class="search-pro-img">
                    <img src="${safeImg}" alt="${p.name}" onerror="this.src='../../assets/images/icons/logo.jpg'">
                </a>
                <div class="search-pro-content">
                    <a href="product-detail.html?id=${safeId}" class="search-pro-name" title="${p.name}">${p.name}</a>
                    <div class="search-pro-bottom">
                        <span class="search-pro-price">${priceStr}</span>
                        <button class="add-to-cart search-add-btn" data-product-id="${safeId}" data-name="${p.name}" data-price="${p.price}" data-img="${safeImg}">Thêm vào giỏ hàng</button>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Kích hoạt sự kiện thêm vào giỏ hàng
        gridEl.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function () {
                var id = this.getAttribute('data-product-id');
                var name = this.getAttribute('data-name');
                var price = window.parsePrice(this.getAttribute('data-price').toString() + 'đ');
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