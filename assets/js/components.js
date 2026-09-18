/* ==========================================================================
   RAU MÁ PC - DYNAMIC HOMEPAGE & SLIDER COMPONENTS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    const sectionTitles = document.querySelectorAll('.section-title');
    const sliders = document.querySelectorAll('.product-slider');
    
    // Đổi điều kiện >= 5 thành >= 6
    if (sectionTitles.length >= 6 && sliders.length >= 6) {
        await loadDynamicHomeContent(sectionTitles, sliders);
    }
    initSliders();
});

async function loadDynamicHomeContent(titles, sliders) {
    try {
        const res = await fetch('https://raumapc-backend.onrender.com/api/products');
        const allProducts = await res.json();

        // Load 6 tiêu đề
        titles[0].innerText = localStorage.getItem('homeTitle1') || 'VGA - Card Màn Hình';
        titles[1].innerText = localStorage.getItem('homeTitle2') || 'Ổ Cứng';
        titles[2].innerText = localStorage.getItem('homeTitle3') || 'RAM - Bộ Nhớ Trong';
        titles[3].innerText = localStorage.getItem('homeTitle4') || 'Màn Hình Máy Tính';
        titles[4].innerText = localStorage.getItem('homeTitle5') || 'Chuột Không Dây';
        titles[5].innerText = localStorage.getItem('homeTitle6') || 'Bàn Phím Cơ';

        // Load 6 dòng sản phẩm
        renderSliderItems(sliders[0], 1, allProducts);
        renderSliderItems(sliders[1], 2, allProducts);
        renderSliderItems(sliders[2], 3, allProducts);
        renderSliderItems(sliders[3], 4, allProducts);
        renderSliderItems(sliders[4], 5, allProducts);
        renderSliderItems(sliders[5], 6, allProducts);

    } catch (error) {
        console.error("Lỗi đồng bộ sản phẩm trang chủ:", error);
    }
}

// HÀM 2: VẼ LẠI CÁC THẺ SẢN PHẨM BÊN TRONG BĂNG CHUYỀN
function renderSliderItems(sliderEl, sectionIndex, allProducts) {
    let htmlContent = '';
    let hasCustomProducts = false;
    
    // Quét 6 vị trí sản phẩm mà Admin đã cấu hình cho Section này
    for (let i = 1; i <= 6; i++) {
        let spId = localStorage.getItem(`home-sp${sectionIndex}-${i}`);
        
        if (spId && spId.trim() !== '') {
            // Tìm sản phẩm trong cơ sở dữ liệu dựa trên Mã (productId) hoặc ID nội bộ
            let p = allProducts.find(x => x.productId === spId.trim() || x.id === spId.trim());
            
            if (p) {
                hasCustomProducts = true; // Xác nhận có dữ liệu từ Admin
                
                let safeImg = p.img || 'assets/images/icons/logo.jpg';
                let priceStr = typeof p.price === 'number' ? new Intl.NumberFormat('vi-VN').format(p.price) + 'đ' : p.price;
                let safeId = p.productId || p.id;
                
                // Tạo thẻ sản phẩm mới theo đúng chuẩn HTML trang chủ
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
                        <div class="product-price" style="color: #d70018; font-weight: bold;">${priceStr}</div>
                        <div class="add-to-cart" data-product-id="${safeId}" data-name="${p.name}" data-price="${p.price}" data-img="${safeImg}">Thêm vào giỏ hàng</div>
                    </div>
                </div>`;
            }
        }
    }
    
    // Nếu Admin đã cài đặt ít nhất 1 sản phẩm hợp lệ, tiến hành xóa HTML tĩnh cũ và đè HTML mới vào
    if (hasCustomProducts) {
        sliderEl.innerHTML = htmlContent;
    }
}

// HÀM 3: KHỞI ĐỘNG HIỆU ỨNG BĂNG CHUYỀN (SLIDER) THÔNG MINH
function initSliders() {
    const tracks = document.querySelectorAll('.product-slider');
    
    // ĐỊNH NGHĨA CÁC THÔNG SỐ CHUNG
    const itemWidth = 264;     // Bước trượt 264px (thẻ 244px + gap 20px)
    const slideDuration = 500; // Thời gian lướt (0.5 giây)
    const pauseTime = 3000;    // Khoảng nghỉ giữa các lần lướt (3 giây)

    tracks.forEach(track => {
        // Đếm số sản phẩm hiện tại của băng chuyền
        const totalOriginalItems = track.children.length;
        
        // Bỏ qua nếu mục này chưa có sản phẩm nào
        if(totalOriginalItems === 0) return; 

        // CHỐT CHẶN: Chỉ trượt tự động khi có TỪ 5 SẢN PHẨM TRỞ LÊN
        if (totalOriginalItems <= 4) {
            track.style.justifyContent = 'flex-start'; // Dàn trang từ trái sang phải
            track.style.display = 'flex';
            track.style.gap = '20px';
            return; // Thoát hàm ngay lập tức, không chạy vòng lặp lướt
        }

        // Nếu > 4 sản phẩm, nhân đôi danh sách để tạo vòng lặp trượt vô hạn
        track.innerHTML += track.innerHTML;

        let currentIndex = 0;
        let slideInterval; 

        // Hàm tạo chuyển động
        function startSliding() {
            slideInterval = setInterval(() => {
                currentIndex++;
                track.style.transition = `transform ${slideDuration}ms ease-in-out`;
                track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;

                // Nếu trượt hết cụm gốc thì tắt hiệu ứng, reset ngầm về vị trí số 0
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

        // Tạm dừng khi khách hàng trỏ chuột vào vùng sản phẩm
        if (track.parentElement) {
            track.parentElement.addEventListener('mouseenter', stopSliding);
            track.parentElement.addEventListener('mouseleave', startSliding);
        }

        // Bắt đầu chạy ngầm
        startSliding();
    });

    // KÍCH HOẠT SỰ KIỆN "THÊM VÀO GIỎ HÀNG" CHO CÁC SẢN PHẨM (KỂ CẢ SẢN PHẨM BỊ NHÂN ĐÔI)
    document.querySelectorAll('.product-card .add-to-cart').forEach(button => {
        button.addEventListener('click', function () {
            var id = this.getAttribute('data-product-id');
            var name = this.getAttribute('data-name');
            var price = window.parsePrice(this.getAttribute('data-price').toString() + 'đ');
            var img = this.getAttribute('data-img');
            
            // Hàm window.addToCart đã được thiết lập sẵn bên file layout.js
            if (typeof window.addToCart === 'function') {
                window.addToCart(id, name, price, img);
            }
        });
    });
}