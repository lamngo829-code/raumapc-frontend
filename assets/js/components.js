/* ==========================================================================
   RAU MÁ PC - DYNAMIC HOMEPAGE (TỐI ƯU HÓA SIÊU TỐC)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const sectionTitles = document.querySelectorAll('.section-title');
    const sliders = document.querySelectorAll('.product-slider');
    
    if (sectionTitles.length >= 6 && sliders.length >= 6) {
        await loadDynamicHomeContent(sectionTitles, sliders);
        initSliders(); // Chỉ kích hoạt thanh trượt sau khi ảnh đã tải xong
    }
});

async function loadDynamicHomeContent(titles, sliders) {
    try {
        // Chỉ tải cấu hình giao diện trước
        const configRes = await fetch('https://raumapc-backend-fms3.onrender.com/api/settings/home');
        const configData = await configRes.json(); 

        const defaultTitles = ['VGA - Card Màn Hình', 'Ổ Cứng', 'RAM - Bộ Nhớ Trong', 'Mainboard - Bo mạch chủ', 'Chuột Không Dây', 'Bàn Phím Cơ'];

        for(let i=0; i<6; i++) {
            if(titles[i]) titles[i].innerText = configData[`homeTitle${i+1}`] || defaultTitles[i];
        }

        // CHÌA KHÓA TỐC ĐỘ: Bắn 6 luồng tải dữ liệu song song thay vì chờ đợi
        await Promise.all([
            renderSliderItems(sliders[0], 1, configData),
            renderSliderItems(sliders[1], 2, configData),
            renderSliderItems(sliders[2], 3, configData),
            renderSliderItems(sliders[3], 4, configData),
            renderSliderItems(sliders[4], 5, configData),
            renderSliderItems(sliders[5], 6, configData)
        ]);

    } catch (error) {
        console.error("Lỗi đồng bộ sản phẩm trang chủ:", error);
    }
}

async function renderSliderItems(sliderEl, sectionIndex, configData) {
    if(!sliderEl) return;
    let htmlContent = '';
    let hasCustomProducts = false;
    
    // Thu thập danh sách ID cần tải cho mục này
    let idsToFetch = [];
    for (let i = 1; i <= 6; i++) {
        let spId = configData[`home-sp${sectionIndex}-${i}`]; 
        if (spId && spId.trim() !== '') idsToFetch.push(spId.trim());
    }

    if (idsToFetch.length === 0) {
        sliderEl.innerHTML = '<div style="width: 100%; text-align: center; padding: 20px; color: #666;">Chưa có sản phẩm trưng bày...</div>';
        return;
    }

    // CHỈ TẢI ĐÚNG CÁC SẢN PHẨM ĐƯỢC CHỌN (Bỏ qua 99% kho hàng rác)
    const products = await Promise.all(
        idsToFetch.map(id => 
            fetch(`https://raumapc-backend-fms3.onrender.com/api/products/detail/${id}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        )
    );
    
    products.forEach(p => {
        if (p) {
            hasCustomProducts = true; 
            let safeImg = p.img || 'assets/images/icons/logo.jpg';
            let priceStr = typeof p.price === 'number' ? new Intl.NumberFormat('vi-VN').format(p.price) + 'đ' : p.price;
            let safeId = p.productId || p.id;
            
            let currentStatus = p.status || 'Còn hàng';
            let buttonHtml = '';
            let priceDisplay = priceStr;

            if (currentStatus === 'Còn hàng') {
                buttonHtml = `<div class="add-to-cart" data-product-id="${safeId}" data-name="${p.name}" data-price="${p.price}" data-img="${safeImg}">Thêm vào giỏ hàng</div>`;
            } 
            else if (currentStatus === 'Hết hàng') {
                priceDisplay = '<span style="color: #dc2626; font-size: 15px;">Hết hàng</span>';
                buttonHtml = `<div class="add-to-cart" style="background: #e2e8f0; color: #94a3b8; border: 1px solid #e2e8f0; cursor: not-allowed; pointer-events: none;">ĐÃ HẾT HÀNG</div>`;
            } 
            else if (currentStatus === 'Liên hệ') {
                priceDisplay = '<span style="color: #ea580c; font-size: 15px;">Giá: Liên hệ</span>';
                buttonHtml = `<div class="add-to-cart" style="background: #ffffff; color: #ea580c; border: 1px solid #ea580c;" onclick="window.location.href='pages/info/contact.html';">LIÊN HỆ TƯ VẤN</div>`;
            }
            
            htmlContent += `
            <div class="product-card">
                <div class="product-img">
                    <a href="pages/shop/product-detail.html?id=${safeId}">
                        <img src="${safeImg}" width="200" height="200" alt="${p.name}" style="object-fit: contain;">
                    </a>
                </div>
                <div class="product-info">
                    <div class="product-name">
                        <a href="pages/shop/product-detail.html?id=${safeId}" style="text-decoration: none; color: inherit;">${p.name}</a>
                    </div>
                    <div class="product-price" style="color: #d70018; font-weight: bold;">${priceDisplay}</div>
                    ${buttonHtml}
                </div>
            </div>`;
        }
    });
    
    if (hasCustomProducts) {
        sliderEl.innerHTML = htmlContent;
    }
}

function initSliders() {
    const tracks = document.querySelectorAll('.product-slider');
    const itemWidth = 264;     
    const slideDuration = 500; 
    const pauseTime = 3000;    

    tracks.forEach(track => {
        const totalOriginalItems = track.children.length;
        if(totalOriginalItems === 0) return; 

        if (totalOriginalItems <= 4) {
            track.style.justifyContent = 'flex-start'; 
            track.style.display = 'flex';
            track.style.gap = '20px';
            return; 
        }

        track.innerHTML += track.innerHTML;

        let currentIndex = 0;
        let slideInterval; 

        function startSliding() {
            slideInterval = setInterval(() => {
                currentIndex++;
                track.style.transition = `transform ${slideDuration}ms ease-in-out`;
                track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;

                if (currentIndex === totalOriginalItems) {
                    setTimeout(() => {
                        track.style.transition = 'none'; 
                        currentIndex = 0;
                        track.style.transform = `translateX(0)`;
                    }, slideDuration);
                }
            }, pauseTime);
        }

        function stopSliding() {
            clearInterval(slideInterval);
        }

        if (track.parentElement) {
            track.parentElement.addEventListener('mouseenter', stopSliding);
            track.parentElement.addEventListener('mouseleave', startSliding);
        }

        startSliding();
    });

    document.querySelectorAll('.product-card .add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            var id = this.getAttribute('data-product-id');
            var name = this.getAttribute('data-name');
            var priceRaw = this.getAttribute('data-price').toString();
            var priceWithCurrency = priceRaw.includes('đ') ? priceRaw : priceRaw + 'đ';
            var price = window.parsePrice(priceWithCurrency);
            var img = this.getAttribute('data-img');
            
            if (typeof window.addToCart === 'function') {
                window.addToCart(id, name, price, img);
            }
        });
    });
}