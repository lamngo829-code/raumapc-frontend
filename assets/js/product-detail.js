function switchTab(tabName) {
    document.getElementById('tab-specs').style.display = tabName === 'specs' ? 'block' : 'none';
    document.getElementById('tab-desc').style.display = tabName === 'desc' ? 'block' : 'none';
    document.getElementById('btn-tab-specs').style.borderBottomColor = tabName === 'specs' ? '#1435c3' : 'transparent';
    document.getElementById('btn-tab-specs').style.color = tabName === 'specs' ? '#1435c3' : '#666';
    document.getElementById('btn-tab-desc').style.borderBottomColor = tabName === 'desc' ? '#1435c3' : 'transparent';
    document.getElementById('btn-tab-desc').style.color = tabName === 'desc' ? '#1435c3' : '#666';
}

let currentProduct = null;

function toSlug(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// 2. TẢI DỮ LIỆU TỪ MÁY CHỦ
document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    let urlId = urlParams.get('id'); 
    let urlSlug = "";

    let pathname = window.location.pathname;
    if (pathname !== '/' && !pathname.includes('.') && !pathname.includes('/pages/') && !pathname.includes('/assets/')) {
        urlSlug = pathname.substring(1); 
        if (urlSlug.endsWith('/')) urlSlug = urlSlug.slice(0, -1);
    }

    if (!urlId && !urlSlug) return; 

    function renderDetail(sp) {
        if (!sp) {
            document.getElementById('loading-screen').innerHTML = "Rất tiếc, sản phẩm này không tồn tại trong hệ thống!";
            return;
        }
        currentProduct = sp;
        
        let realId = sp.id || sp._id;
        let shortId = sp.productId || realId.slice(-6).toUpperCase();

        document.getElementById('detail-name').innerText = sp.name || "";
        document.getElementById('bread-name').innerText = sp.name || "";
        document.title = (sp.name || "Chi tiết sản phẩm") + " - Rau Má PC";
        
        let slug = toSlug(sp.name);
        let isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            window.history.replaceState(null, '', '?id=' + shortId);
        } else {
            window.history.replaceState(null, '', '/' + slug);
        }

        document.getElementById('detail-price').innerText = sp.price || "0đ";
        document.getElementById('detail-id').innerText = shortId;

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
                    // MỚI: Dấu ">" báo hiệu đây là nội dung con, ép gộp chung vào ô trước đó (kể cả khi dòng này có chứa dấu ":")
                    if (line.trim().startsWith('>') && currentSpec) {
                        currentSpec.values[currentSpec.values.length - 1] += '<br>' + line.trim().substring(1).trim();
                    } 
                    else if (line.includes(':')) {
                        // Tách toàn bộ các phần bằng dấu hai chấm để hỗ trợ 3 cột
                        const parts = line.split(':');
                        currentSpec = { 
                            key: parts[0].trim(), 
                            values: parts.slice(1).map(p => p.trim()) 
                        };
                        parsedSpecs.push(currentSpec);
                    } 
                    else if (line.trim() !== '' && currentSpec) {
                        currentSpec.values[currentSpec.values.length - 1] += '<br>' + line.trim();
                    }
                });
                
                let tableHTML = ''; let isEven = false;
                parsedSpecs.forEach(spec => {
                    let bg = isEven ? '#f8f9fa' : '#ffffff';
                    let trHtml = `<tr style="background-color: ${bg};">`;
                    
                    // Cột 1: Tên thông số (Nếu trống thì để khoảng trắng)
                    trHtml += `<td style="padding: 15px; font-weight: bold; width: 30%; border-bottom: 1px solid #f0f0f0; vertical-align: top;">${spec.key}</td>`;
                    
                    // Nếu nhập 2 dấu hai chấm -> Có 2 giá trị -> Chia làm 2 cột (Cột 2 và Cột 3)
                    if (spec.values.length >= 2) {
                        // Tự động in đậm nếu dòng đó không có Tên thông số (dòng tiêu đề Fan 1, Fan 2)
                        let fontWeight = spec.key === '' ? 'bold' : 'normal';
                        trHtml += `<td style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6; width: 35%; font-weight: ${fontWeight};">${spec.values[0]}</td>`;
                        trHtml += `<td style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6; width: 35%; font-weight: ${fontWeight};">${spec.values[1]}</td>`;
                    } 
                    // Nếu chỉ nhập 1 dấu hai chấm -> Gộp Cột 2 và Cột 3 lại thành 1 cột rộng
                    else if (spec.values.length === 1) {
                        trHtml += `<td colspan="2" style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6;">${spec.values[0]}</td>`;
                    }
                    
                    trHtml += `</tr>`;
                    tableHTML += trHtml;
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

        // ==========================================
        // KHU VỰC MỚI: HIỂN THỊ VÀ TĂNG LƯỢT XEM
        // ==========================================
        // 1. Tự động chèn số lượt xem lên giao diện (kế bên Mã SP)
        const idEl = document.getElementById('detail-id');
        if (idEl && !document.getElementById('detail-views')) {
            const viewsSpan = document.createElement('span');
            viewsSpan.id = 'detail-views';
            viewsSpan.style.marginLeft = '20px';
            viewsSpan.style.color = '#1435c3';
            viewsSpan.style.fontWeight = 'bold';
            viewsSpan.style.fontSize = '14px';
            // Hiển thị số lượt xem hiện tại + 1 (cho lần xem này của khách)
            viewsSpan.innerHTML = `👁 ${(sp.views || 0) + 1} lượt xem`;
            idEl.parentNode.appendChild(viewsSpan);
        }

        // 2. Kích hoạt API tăng lượt xem chạy ngầm dưới máy chủ
        fetch(`https://raumapc-backend.onrender.com/api/products/${shortId}/view`, { 
            method: 'PUT' 
        }).catch(err => console.log("Lỗi tăng view"));
        
    }

    // BỌC THÉP TRUY VẤN: Lấy toàn bộ kho và tự động tra cứu bằng mọi loại ID (Mã ngắn, Mã dài, Link SEO)
    fetch('https://raumapc-backend.onrender.com/api/products?v=' + new Date().getTime())
        .then(res => res.ok ? res.json() : null)
        .then(products => {
            if(!products) return renderDetail(null);
            
            let sp = null;
            if (urlId) {
                // Dò tìm thông minh: Khớp mã Database (24 ký tự), hoặc khớp Mã tùy chỉnh (VGA...), hoặc khớp 6 ký tự cuối
                sp = products.find(p => 
                    p.id === urlId || 
                    p._id === urlId || 
                    (p.productId && p.productId.toUpperCase() === urlId.toUpperCase()) || 
                    ((p.id || p._id).toString().slice(-6).toUpperCase() === urlId.toUpperCase())
                );
            } else if (urlSlug) {
                sp = products.find(p => toSlug(p.name) === urlSlug);
            }
            
            renderDetail(sp);
        })
        .catch(() => document.getElementById('loading-screen').innerHTML = "Lỗi kết nối máy chủ!");
});

const btnAddCart = document.querySelector('.btn-add-cart');
if (btnAddCart) {
    btnAddCart.addEventListener('click', function () {
        if (currentProduct) {
            let rawPrice = parseInt(String(currentProduct.price).replace(/\D/g, '')) || 0;
            let realId = currentProduct.id || currentProduct._id; 
            
            if (typeof window.addToCart === 'function') {
                window.addToCart(realId, currentProduct.name, rawPrice, currentProduct.img);
            } else {
                var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
                var existingItem = currentCart.find(item => item.id === realId);
                if (existingItem) {
                    existingItem.quantity = parseInt(existingItem.quantity) + 1;
                } else {
                    currentCart.push({ id: realId, name: currentProduct.name, price: rawPrice, img: currentProduct.img, quantity: 1 });
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
            let realId = currentProduct.id || currentProduct._id; 
            
            var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
            var existingItem = currentCart.find(item => item.id === realId);
            if (existingItem) {
                existingItem.quantity = parseInt(existingItem.quantity) + 1;
            } else {
                currentCart.push({ id: realId, name: currentProduct.name, price: rawPrice, img: currentProduct.img, quantity: 1 });
            }
            localStorage.setItem('myCart', JSON.stringify(currentCart));
            window.location.href = 'cart.html';
        }
    });
}

let uploadedReviewImage = "";
function renderComments(commentsArray) {
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
        const avgEl = document.getElementById('summary-avg-score');
        if (avgEl) avgEl.innerText = `${avgScore}/5`;
        
        const totalEl = document.getElementById('summary-total-reviews');
        if (totalEl) totalEl.innerText = `${totalReviews} đánh giá và nhận xét`;
        
        const starsEl = document.getElementById('summary-avg-stars');
        if (starsEl) {
            let roundedStars = Math.round(avgScore);
            starsEl.innerHTML = '<span style="color: #f59e0b;">' + '★'.repeat(roundedStars) + '</span><span style="color:#cbd5e1">' + '★'.repeat(5 - roundedStars) + '</span>';
        }
        
        for (let i = 1; i <= 5; i++) {
            let percentage = (starCounts[i] / totalReviews) * 100;
            let barEl = document.getElementById(`summary-bar-${i}`);
            let countEl = document.getElementById(`summary-count-${i}`);
            if (barEl) barEl.style.width = `${percentage}%`;
            if (countEl) countEl.innerText = `${starCounts[i]} đánh giá`;
        }
    }

    const listEl = document.getElementById('comment-list');
    listEl.innerHTML = ''; 

    // 1. LUÔN IN NÚT ĐÁNH GIÁ Ở TRÊN CÙNG (Căn giữa tuyệt đối)
    let html = `
        <div style="text-align: center; background: #f8fafc; padding: 25px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px;">
            <p style="font-size: 15px; color: #1e293b; font-weight: 500; margin-bottom: 15px;">Bạn đánh giá sao sản phẩm này?</p>
            <button onclick="openReviewModal()" style="background: #1976d2; color: white; border: none; padding: 12px 35px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(25, 118, 210, 0.2);">Đánh giá ngay</button>
        </div>
    `;

    // 2. NẾU CHƯA CÓ BÌNH LUẬN NÀO: Hiện thêm thông báo trống ở dưới nút
    if (!commentsArray || commentsArray.length === 0) {
        html += `
            <div style="text-align: center; padding: 40px 20px; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <p style="color: #94a3b8; font-size: 15px; margin: 0;">Sản phẩm chưa có đánh giá nào. Bạn hãy là người đầu tiên!</p>
            </div>
        `;
        listEl.innerHTML = html;
        return;
    }

    // 3. NẾU ĐÃ CÓ BÌNH LUẬN: In danh sách nối tiếp vào bên dưới nút bấm
    [...commentsArray].reverse().forEach(cmt => {
        let initial = (cmt.userName && cmt.userName.length > 0) ? cmt.userName.charAt(0).toUpperCase() : "U";
        let stars = parseInt(cmt.rating) || 5;
        let starHtml = '<span style="color: #f59e0b; letter-spacing: 2px; font-size: 14px;">' + '★'.repeat(stars) + '<span style="color:#e2e8f0">' + '★'.repeat(5 - stars) + '</span></span>';
        let imgHtml = cmt.img ? `<img src="${cmt.img}" class="cmt-attached-img" alt="Ảnh đánh giá">` : '';

        let avatarDisplay = (cmt.userAvatar && cmt.userAvatar.trim() !== '') 
            ? `<img src="${cmt.userAvatar}" style="width:100%; height:100%; object-fit:cover;">` 
            : initial;

        html += `
        <div class="cmt-box">
            <div class="cmt-header">
                <div class="cmt-avt" style="overflow: hidden; padding: 0; display: flex; align-items: center; justify-content: center;">${avatarDisplay}</div>
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

    // In toàn bộ giao diện ra màn hình
    listEl.innerHTML = html;
}

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
                const MAX_WIDTH = 600; 
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
    let dbId = currentProduct.id || currentProduct._id; 
    if (!currentProduct || !dbId) return window.showGlobalAlert("Lỗi tải trang!", false);
    
    const contentBox = document.getElementById('comment-input');
    const content = contentBox.value.trim();
    const rating = parseInt(document.getElementById('star-selector').getAttribute('data-rating'));

    if (rating === 0) return window.showGlobalAlert("Vui lòng chọn số sao đánh giá!", false);
    if (!content) return window.showGlobalAlert("Vui lòng nhập nội dung đánh giá!", false);

    const btn = document.getElementById('btn-submit-review');
    btn.innerText = "ĐANG GỬI..."; btn.disabled = true;

    let userName = "Khách ghé thăm";
    let userAvatar = ""; // Khởi tạo biến lưu Avatar

    try { 
        // Thay vì chỉ lấy từ currentUser, hãy lấy cả từ biến userData lúc đăng nhập trả về
        const userStr = localStorage.getItem('currentUser');
        if(userStr) {
            const user = JSON.parse(userStr);
            userName = user.fullName || "Khách ghé thăm"; 
            
            // Ép buộc kiểm tra và lấy đường link Base64 thực sự
            if (user.avatar && typeof user.avatar === 'string' && user.avatar.includes('data:image')) {
                userAvatar = user.avatar; 
            }
        }
    } catch(e) { console.error("Lỗi lấy thông tin User:", e); }

    fetch(`https://raumapc-backend.onrender.com/api/products/${dbId}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // Gửi kèm userAvatar lên server
        body: JSON.stringify({ userName: userName, userAvatar: userAvatar, content: content, rating: rating, img: uploadedReviewImage })
    }).then(res => res.json()).then(data => {
        btn.innerText = "GỬI ĐÁNH GIÁ"; btn.disabled = false;
        if (data.success) {
            contentBox.value = '';
            uploadedReviewImage = ''; 
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