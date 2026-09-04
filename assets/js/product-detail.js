// 1. HÀM CHUYỂN ĐỔI TAB
function switchTab(tabName) {
    document.getElementById('tab-specs').style.display = tabName === 'specs' ? 'block' : 'none';
    document.getElementById('tab-desc').style.display = tabName === 'desc' ? 'block' : 'none';
    document.getElementById('btn-tab-specs').style.borderBottomColor = tabName === 'specs' ? '#1435c3' : 'transparent';
    document.getElementById('btn-tab-specs').style.color = tabName === 'specs' ? '#1435c3' : '#666';
    document.getElementById('btn-tab-desc').style.borderBottomColor = tabName === 'desc' ? '#1435c3' : 'transparent';
    document.getElementById('btn-tab-desc').style.color = tabName === 'desc' ? '#1435c3' : '#666';
}

let currentProduct = null;

// 2. TẢI DỮ LIỆU TỪ MÁY CHỦ
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.getElementById('loading-screen').innerHTML = "Lỗi: Không tìm thấy mã sản phẩm trên URL!";
        return;
    }

    fetch('https://raumapc-backend.onrender.com/api/products?v=' + new Date().getTime())
        .then(response => response.json())
        .then(products => {
            const sp = products.find(item => item.id === productId);

            if (sp) {
                currentProduct = sp;
                document.getElementById('detail-name').innerText = sp.name || "";
                
                document.getElementById('bread-name').innerText = sp.name || "";
                
                document.title = (sp.name || "Chi tiết sản phẩm") + " - Rau Má PC";
                
                let slug = (sp.name || "").replace(/\s+/g, '-').toLowerCase();
                window.history.replaceState(null, '', '?id=' + sp.id + '&name=' + encodeURIComponent(slug));

                document.getElementById('detail-price').innerText = sp.price || "0đ";
                
                document.getElementById('detail-id').innerText = (sp.id || "").toUpperCase();

                let safeLink = sp.img ? sp.img.trim() : "";
                
                document.querySelector('.main-image').innerHTML = `<img src="${safeLink}" alt="${sp.name}" style="max-width: 100%; height: auto; max-height: 400px; object-fit: contain;" onerror="this.onerror=null; this.src='../../assets/images/icons/logo.jpg'">`;

                const warrantyEl = document.getElementById('warranty-text');
                if (warrantyEl) warrantyEl.innerText = sp.warranty || "36 Tháng";

                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('main-content').style.display = 'block';

                renderComments(sp.comments || []);

                const specsTable = document.getElementById('specs-tbody');
                if (specsTable) {
                    if (sp.specs && sp.specs.trim() !== "") {
                        const lines = sp.specs.split('\n');
                        let parsedSpecs = [];
                        let currentSpec = null;

                        lines.forEach(line => {
                            if (line.includes(':')) {
                                const colonIndex = line.indexOf(':');
                                const key = line.substring(0, colonIndex).trim();
                                const value = line.substring(colonIndex + 1).trim();
                                currentSpec = { key: key, value: value };
                                parsedSpecs.push(currentSpec);
                            } else if (line.trim() !== '' && currentSpec) {
                                currentSpec.value += '<br>' + line.trim();
                            }
                        });

                        let tableHTML = '';
                        let isEven = false;
                        parsedSpecs.forEach(spec => {
                            let bg = isEven ? '#f8f9fa' : '#ffffff';
                            tableHTML += `<tr style="background-color: ${bg};"><td style="padding: 15px; font-weight: bold; width: 30%; border-bottom: 1px solid #f0f0f0; vertical-align: top;">${spec.key}</td><td style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6;">${spec.value}</td></tr>`;
                            isEven = !isEven;
                        });
                        specsTable.innerHTML = tableHTML;
                    } else {
                        specsTable.innerHTML = `<tr><td style="padding: 15px;">Chưa có thông số chi tiết...</td></tr>`;
                    }
                }

                const descContent = document.getElementById('desc-content');
                if (descContent) {
                    let textDesc = (sp.description && sp.description.trim() !== "") ? sp.description : 'Chưa có bài viết mô tả...';
                    descContent.innerHTML = `<div style="white-space: pre-wrap; font-family: inherit;">${textDesc}</div>`;
                }

            } else {
                document.getElementById('loading-screen').innerHTML = "Rất tiếc, sản phẩm này không tồn tại trong hệ thống!";
            }
        })
        .catch(error => {
            document.getElementById('loading-screen').innerHTML = "Không thể kết nối đến Máy chủ Backend!";
        });
});

// 3. SỰ KIỆN CHO NÚT MUA HÀNG
const btnAddCart = document.querySelector('.btn-add-cart');
if (btnAddCart) {
    btnAddCart.addEventListener('click', function () {
        if (currentProduct) {
            let rawPrice = parseInt(String(currentProduct.price).replace(/\D/g, '')) || 0;
            
            // Dùng hàm addToCart từ layout.js để đảm bảo xử lý nhất quán và chỉ gọi 1 Global Alert
            if (typeof window.addToCart === 'function') {
                window.addToCart(currentProduct.id, currentProduct.name, rawPrice, currentProduct.img);
            } else {
                // Phương án dự phòng nếu layout.js chưa load kịp
                var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
                var existingItem = currentCart.find(item => item.id === currentProduct.id);
                if (existingItem) {
                    existingItem.quantity = parseInt(existingItem.quantity) + 1;
                } else {
                    currentCart.push({ id: currentProduct.id, name: currentProduct.name, price: rawPrice, img: currentProduct.img, quantity: 1 });
                }
                
                localStorage.setItem('myCart', JSON.stringify(currentCart));
                
                if(typeof window.updateCartUI === 'function') window.updateCartUI();
                if(typeof window.syncCartToCloud === 'function') window.syncCartToCloud();
                
                alert('Đã thêm sản phẩm vào giỏ hàng!');
            }
        }
    });
}

const btnBuyNow = document.querySelector('.btn-buy-now');
if (btnBuyNow) {
    btnBuyNow.addEventListener('click', function () {
        if (currentProduct) {
            let rawPrice = parseInt(String(currentProduct.price).replace(/\D/g, '')) || 0;
            
            // Thêm trực tiếp vào mảng
            var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
            var existingItem = currentCart.find(item => item.id === currentProduct.id);
            if (existingItem) {
                existingItem.quantity = parseInt(existingItem.quantity) + 1;
            } else {
                currentCart.push({ id: currentProduct.id, name: currentProduct.name, price: rawPrice, img: currentProduct.img, quantity: 1 });
            }
            
            localStorage.setItem('myCart', JSON.stringify(currentCart));
            
            // Chuyển thẳng sang trang Giỏ hàng mà không cần hiện thông báo
            window.location.href = 'cart.html';
        }
    });
}

// 4. HỆ THỐNG ĐÁNH GIÁ (RATING) & BÌNH LUẬN CÓ ẢNH
let uploadedReviewImage = "";

function renderComments(commentsArray) {
    // --- 1. TÍNH TOÁN VÀ CẬP NHẬT BẢNG THỐNG KÊ SAO ---
    if (commentsArray && commentsArray.length > 0) {
        let totalReviews = commentsArray.length;
        let totalStars = 0;
        let starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        commentsArray.forEach(cmt => {
            let rating = parseInt(cmt.rating) || 5;
            totalStars += rating;
            starCounts[rating]++;
        });
        
        let avgScore = (totalStars / totalReviews).toFixed(1);
        
        // Cập nhật Cột Điểm Số
        const avgEl = document.getElementById('summary-avg-score');
        if (avgEl) avgEl.innerText = `${avgScore}/5`;
        
        const totalEl = document.getElementById('summary-total-reviews');
        if (totalEl) totalEl.innerText = `${totalReviews} đánh giá và nhận xét`;
        
        const starsEl = document.getElementById('summary-avg-stars');
        if (starsEl) {
            let roundedStars = Math.round(avgScore);
            starsEl.innerHTML = '<span style="color: #f59e0b;">' + '★'.repeat(roundedStars) + '</span><span style="color:#cbd5e1">' + '★'.repeat(5 - roundedStars) + '</span>';
        }
        
        // Cập nhật Cột Thanh Sao
        for (let i = 1; i <= 5; i++) {
            let percentage = (starCounts[i] / totalReviews) * 100;
            let barEl = document.getElementById(`summary-bar-${i}`);
            let countEl = document.getElementById(`summary-count-${i}`);
            
            if (barEl) barEl.style.width = `${percentage}%`;
            if (countEl) countEl.innerText = `${starCounts[i]} đánh giá`;
        }
    }

    // --- 2. HIỂN THỊ DANH SÁCH BÌNH LUẬN ---
    const listEl = document.getElementById('comment-list');
    if (!commentsArray || commentsArray.length === 0) {
        listEl.innerHTML = '<div style="text-align: center; padding: 30px; color: #94a3b8; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">Sản phẩm chưa có đánh giá nào. Bạn hãy là người đầu tiên!</div>';
        return;
    }

    let html = '';
    [...commentsArray].reverse().forEach(cmt => {
        let initial = cmt.userName.charAt(0).toUpperCase();
        let stars = parseInt(cmt.rating) || 5;
        let starHtml = '<span style="color: #f59e0b; letter-spacing: 2px; font-size: 14px;">' + '★'.repeat(stars) + '<span style="color:#e2e8f0">' + '★'.repeat(5 - stars) + '</span></span>';
        let imgHtml = cmt.img ? `<img src="${cmt.img}" class="cmt-attached-img" alt="Ảnh đánh giá">` : '';

        html += `
        <div class="cmt-box">
            <div class="cmt-header">
                <div class="cmt-avt">${initial}</div>
                <div class="cmt-name">${cmt.userName}</div>
                <div class="cmt-time">🕒 ${cmt.date}</div>
            </div>
            <div class="cmt-row">
                <div class="cmt-row-label">Đánh giá:</div>
                <div class="cmt-row-content">${starHtml}</div>
            </div>
            <div class="cmt-row">
                <div class="cmt-row-label">Nhận xét:</div>
                <div class="cmt-row-content">${cmt.content}${imgHtml}</div>
            </div>
        </div>`;
    });
    listEl.innerHTML = html;
}

// Chuyển đổi và nén ảnh đính kèm
const reviewFileInput = document.getElementById('review-file-input');
if(reviewFileInput) {
    reviewFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(!file) return;
        if (!file.type.match('image.*')) return window.showGlobalAlert("Chỉ hỗ trợ file ảnh!", false);
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; // Nén kích thước để nhẹ Server
                let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                uploadedReviewImage = canvas.toDataURL('image/jpeg', 0.8);
                const preview = document.getElementById('review-img-preview');
                preview.src = uploadedReviewImage;
                preview.style.display = 'block';
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function openReviewModal() {
    const modal = document.getElementById('review-modal');
    const content = document.getElementById('review-modal-content');
    modal.style.display = 'flex';
    setTimeout(() => {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 10);
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    const content = document.getElementById('review-modal-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(50px)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

const reviewModal = document.getElementById('review-modal');
if (reviewModal) {
    reviewModal.addEventListener('click', function (e) {
        if (e.target === this) closeReviewModal();
    });
}

const stars = document.querySelectorAll('#star-selector span');
const starText = document.getElementById('star-text');
const texts = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];

stars.forEach(star => {
    star.addEventListener('click', function () {
        const val = parseInt(this.getAttribute('data-val'));
        document.getElementById('star-selector').setAttribute('data-rating', val);
        if (starText) starText.innerText = texts[val];

        stars.forEach(s => {
            if (parseInt(s.getAttribute('data-val')) <= val) s.style.color = '#f59e0b';
            else s.style.color = '#e2e8f0';
        });
    });
});

window.submitReview = function() {
    if (!currentProduct || !currentProduct.id) return window.showGlobalAlert("Lỗi tải trang!", false);
    
    const contentBox = document.getElementById('comment-input');
    const content = contentBox.value.trim();
    const rating = parseInt(document.getElementById('star-selector').getAttribute('data-rating'));

    if (rating === 0) return window.showGlobalAlert("Vui lòng chọn số sao đánh giá!", false);
    if (!content) return window.showGlobalAlert("Vui lòng nhập nội dung đánh giá!", false);

    const btn = document.getElementById('btn-submit-review');
    btn.innerText = "ĐANG GỬI..."; btn.disabled = true;

    let userName = "Khách ghé thăm";
    try { 
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if(user) userName = user.fullName; 
    } catch(e) {}

    fetch(`https://raumapc-backend.onrender.com/api/products/${currentProduct.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: userName, content: content, rating: rating, img: uploadedReviewImage })
    }).then(res => res.json()).then(data => {
        btn.innerText = "GỬI ĐÁNH GIÁ"; btn.disabled = false;
        if (data.success) {
            contentBox.value = '';
            uploadedReviewImage = ''; // Dọn ảnh sau khi gửi
            document.getElementById('review-img-preview').style.display = 'none';
            document.getElementById('review-file-input').value = '';
            document.getElementById('star-selector').setAttribute('data-rating', 0);
            
            closeReviewModal();
            window.showGlobalAlert("Cảm ơn bạn đã đánh giá sản phẩm!", true);
            renderComments(data.comments);
        } else { 
            window.showGlobalAlert(data.message, false); 
        }
    }).catch(err => {
        btn.innerText = "GỬI ĐÁNH GIÁ"; btn.disabled = false;
        window.showGlobalAlert("Lỗi mạng! Không thể kết nối với máy chủ.", false);
    });
};