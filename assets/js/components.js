// 1. Lấy tất cả các khung băng chuyền (VGA, Ổ cứng...)
const tracks = document.querySelectorAll('.product-slider');

// ĐỊNH NGHĨA CÁC THÔNG SỐ CHUNG
const itemWidth = 264;     // Bước trượt 264px (thẻ 244px + gap 20px)
const slideDuration = 500; // Thời gian lướt (0.5 giây)
const pauseTime = 3000;    // Khoảng nghỉ giữa các lần lướt (3 giây)

tracks.forEach(track => {
    // Đếm số sản phẩm gốc của riêng mục này
    const totalOriginalItems = track.children.length;

    // Nhân đôi danh sách sản phẩm để tạo vòng lặp vô hạn
    track.innerHTML += track.innerHTML;

    let currentIndex = 0;
    let slideInterval; // Biến này dùng để cất giữ "mã số" của vòng lặp

    // --- HÀM TẠO CHUYỂN ĐỘNG ---
    function startSliding() {
        // setInterval trả về một ID, ta cất nó vào biến slideInterval
        slideInterval = setInterval(() => {
            currentIndex++;

            // Bật hiệu ứng trượt
            track.style.transition = `transform ${slideDuration}ms ease-in-out`;
            track.style.transform = `translateX(-${currentIndex * itemWidth}px)`;

            // Kiểm tra nếu trượt hết sản phẩm gốc thì reset về 0
            if (currentIndex === totalOriginalItems) {
                setTimeout(() => {
                    track.style.transition = 'none'; // Tắt hiệu ứng để reset ngầm
                    currentIndex = 0;
                    track.style.transform = `translateX(0)`;
                }, slideDuration);
            }
        }, pauseTime);
    }

    // --- HÀM DỪNG CHUYỂN ĐỘNG ---
    function stopSliding() {
        // Dùng ID đã cất để ra lệnh xóa bỏ vòng lặp này
        clearInterval(slideInterval);
    }

    // --- LẮNG NGHE SỰ KIỆN CHUỘT ---

    // 1. Khi chuột đi vào vùng product-grid: Ra lệnh dừng
    // Chúng ta lắng nghe sự kiện trên parentElement (chính là .product-grid) để vùng bao phủ rộng hơn
    track.parentElement.addEventListener('mouseenter', stopSliding);

    // 2. Khi chuột đi ra khỏi vùng product-grid: Ra lệnh chạy lại
    track.parentElement.addEventListener('mouseleave', startSliding);

    // Mặc định ban đầu: Cho băng chuyền tự chạy
    startSliding();
});


// Trích xuất từ main.js (Trang chủ)
const addToCart = (id, name, price, img) => {
    // ... logic thêm sản phẩm vào mảng cart ...

    // LƯU VÀO BỘ NHỚ TRÌNH DUYỆT CÓ TÊN LÀ 'myCart'
    localStorage.setItem('myCart', JSON.stringify(cart)); 
    
    updateCartUI();
};


