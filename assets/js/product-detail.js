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

        // ==========================================
        // KHỞI TẠO SEO THÔNG MINH (OPEN GRAPH & META DESCRIPTION)
        // ==========================================
        // 1. Tạo mô tả ngắn gọn (loại bỏ HTML thừa)
        let rawDesc = sp.description ? sp.description.replace(/<[^>]*>?/gm, '') : `Mua ngay ${sp.name} chính hãng với giá cực sốc tại Rau Má PC. Bảo hành tận nơi.`;
        let shortDesc = rawDesc.length > 155 ? rawDesc.substring(0, 150) + "..." : rawDesc;
        
        // 2. Cập nhật thẻ Meta Description (Google)
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = shortDesc;

        // 3. Cập nhật thẻ Open Graph (Facebook, Zalo)
        function setOGMeta(property, content) {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.content = content;
        }
        
        setOGMeta('og:title', sp.name + " - Rau Má PC");
        setOGMeta('og:description', shortDesc);
        setOGMeta('og:image', sp.img || "https://raumapc.com/assets/images/icons/logo.jpg");
        setOGMeta('og:type', "product");
        setOGMeta('og:url', window.location.href);
        
        let slug = toSlug(sp.name);
        let isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            window.history.replaceState(null, '', '?id=' + shortId);
        } else {
            window.history.replaceState(null, '', '/' + slug);
        }

        document.getElementById('detail-id').innerText = shortId;

        // ==========================================
        // CẬP NHẬT TÌNH TRẠNG & TỰ ĐỘNG ẨN/HIỆN NÚT VÀ GIÁ
        // ==========================================
        const statusEl = document.getElementById('detail-status');
        const btnBuy = document.querySelector('.btn-buy-now');
        const btnCart = document.querySelector('.btn-add-cart');
        const priceEl = document.getElementById('detail-price');
        
        let currentStatus = sp.status || 'Còn hàng';

        // MỚI: TỰ ĐỘNG FORMAT SỐ THÀNH TIỀN TỆ (VD: 36666 -> 36.666đ)
        let displayPrice = '0đ';
        if (typeof sp.price === 'number') {
            displayPrice = new Intl.NumberFormat('vi-VN').format(sp.price) + 'đ';
        } else if (sp.price) {
            displayPrice = sp.price;
        }
        
        if (currentStatus === 'Còn hàng') {
            if (statusEl) { statusEl.innerHTML = '✓ Còn hàng'; statusEl.style.color = '#059669'; }
            if (priceEl) { priceEl.innerHTML = displayPrice; priceEl.style.color = '#d70018'; } // Dùng biến displayPrice ở đây
            
            if (btnBuy) { 
                btnBuy.style.display = 'flex'; 
                btnBuy.style.opacity = '1'; 
                btnBuy.style.pointerEvents = 'auto'; 
            }
            if (btnCart) {
                btnCart.style.background = '#ffffff'; 
                btnCart.style.color = '#1435c3';
                btnCart.style.border = '2px solid #1435c3'; 
                btnCart.style.cursor = 'pointer';
                btnCart.style.pointerEvents = 'auto'; 
                btnCart.style.fontSize = '16px'; // Trả về size mặc định
                btnCart.innerText = 'THÊM VÀO GIỎ';
            }
        } 
        else if (currentStatus === 'Hết hàng') {
            if (statusEl) { statusEl.innerHTML = '✗ Hết hàng'; statusEl.style.color = '#dc2626'; }
            if (priceEl) { priceEl.innerHTML = 'Hết hàng'; priceEl.style.color = '#dc2626'; }
            
            if (btnBuy) btnBuy.style.display = 'none'; 
            if (btnCart) {
                btnCart.style.background = '#e2e8f0'; 
                btnCart.style.color = '#64748b'; // Màu xám đậm dễ đọc hơn
                btnCart.style.border = '2px solid #cbd5e1'; 
                btnCart.style.cursor = 'not-allowed';
                btnCart.style.pointerEvents = 'none'; 
                btnCart.style.fontSize = '18px'; // Phóng to chữ khi đứng 1 mình
                btnCart.innerText = 'SẢN PHẨM ĐÃ HẾT HÀNG';
            }
        } 
        else if (currentStatus === 'Liên hệ') {
            if (statusEl) { statusEl.innerHTML = '☎ Liên hệ'; statusEl.style.color = '#ea580c'; }
            if (priceEl) { priceEl.innerHTML = 'Giá: Liên hệ'; priceEl.style.color = '#ea580c'; }
            
            if (btnBuy) btnBuy.style.display = 'none'; 
            if (btnCart) {
                btnCart.style.background = '#ea580c'; 
                btnCart.style.color = '#ffffff';
                btnCart.style.border = '2px solid #ea580c'; 
                btnCart.style.cursor = 'pointer';
                btnCart.style.pointerEvents = 'auto'; 
                btnCart.style.fontSize = '18px'; // Phóng to chữ khi đứng 1 mình
                btnCart.style.boxShadow = '0 4px 10px rgba(234, 88, 12, 0.2)';
                btnCart.innerText = 'LIÊN HỆ ĐỂ NHẬN TƯ VẤN';
            }
        }

        let safeLink = sp.img ? sp.img.trim() : "";
        document.querySelector('.main-image').innerHTML = `<img src="${safeLink}" alt="${sp.name}" style="max-width: 100%; height: auto; max-height: 400px; object-fit: contain;" onerror="this.onerror=null; this.src='../../assets/images/icons/logo.jpg'">`;

        // XỬ LÝ ẢNH NHỎ (GALLERY)
        const galleryContainer = document.getElementById('detail-gallery');
        if (galleryContainer) {
            let galleryHtml = ''; let allImages = [];
            if (safeLink) allImages.push(safeLink); 
            if (sp.gallery && sp.gallery.length > 0) allImages = allImages.concat(sp.gallery); 
            
            if (allImages.length > 1) { 
                allImages.forEach((imgSrc, index) => {
                    let activeClass = index === 0 ? 'active' : '';
                    // ĐÃ SỬA: Xóa chuỗi ảnh khỏi onclick để HTML không bị sập do Base64 quá dài
                    galleryHtml += `<div class="thumb-item ${activeClass}" onclick="changeMainImage(this)"><img src="${imgSrc}" onerror="this.src='../../assets/images/icons/logo.jpg'"></div>`;
                });
            }
            galleryContainer.innerHTML = galleryHtml;
        }

        const warrantyEl = document.getElementById('warranty-text');
        if (warrantyEl) warrantyEl.innerText = sp.warranty || "36 Tháng";

        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';

        renderComments(sp.comments || []);

        const specsTable = document.getElementById('specs-tbody');
        if (specsTable) {
            if (sp.specs && sp.specs.trim() !== "") {
                const lines = sp.specs.split('\n'); let parsedSpecs = []; let currentSpec = null;
                lines.forEach(line => {
                    if (line.trim().startsWith('>') && currentSpec) {
                        let lastIdx = currentSpec.values.length - 1; let appendText = line.trim().substring(1).trim();
                        if (currentSpec.values[lastIdx] === '') currentSpec.values[lastIdx] = appendText;
                        else currentSpec.values[lastIdx] += '<br>' + appendText;
                    } else if (line.includes(':')) {
                        const parts = line.split(':'); currentSpec = { key: parts[0].trim(), values: parts.slice(1).map(p => p.trim()) };
                        parsedSpecs.push(currentSpec);
                    } else if (line.trim() !== '' && currentSpec) {
                        let lastIdx = currentSpec.values.length - 1;
                        if (currentSpec.values[lastIdx] === '') currentSpec.values[lastIdx] = line.trim();
                        else currentSpec.values[lastIdx] += '<br>' + line.trim();
                    }
                });
                
                let tableHTML = ''; let isEven = false;
                parsedSpecs.forEach(spec => {
                    let bg = isEven ? '#f8f9fa' : '#ffffff'; let trHtml = `<tr style="background-color: ${bg};">`;
                    trHtml += `<td style="padding: 15px; font-weight: bold; width: 30%; border-bottom: 1px solid #f0f0f0; vertical-align: top;">${spec.key}</td>`;
                    if (spec.values.length >= 2) {
                        let fontWeight = spec.key === '' ? 'bold' : 'normal';
                        trHtml += `<td style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6; width: 35%; font-weight: ${fontWeight};">${spec.values[0]}</td>`;
                        trHtml += `<td style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6; width: 35%; font-weight: ${fontWeight};">${spec.values[1]}</td>`;
                    } else if (spec.values.length === 1) {
                        trHtml += `<td colspan="2" style="padding: 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; line-height: 1.6;">${spec.values[0]}</td>`;
                    }
                    trHtml += `</tr>`; tableHTML += trHtml; isEven = !isEven;
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

        const idEl = document.getElementById('detail-id');
        if (idEl && !document.getElementById('detail-views')) {
            const viewsSpan = document.createElement('span'); viewsSpan.id = 'detail-views'; viewsSpan.style.marginLeft = '20px'; viewsSpan.style.color = '#1435c3'; viewsSpan.style.fontWeight = 'bold'; viewsSpan.style.fontSize = '14px';
            viewsSpan.innerHTML = `👁 ${(sp.views || 0) + 1} lượt xem`; idEl.parentNode.appendChild(viewsSpan);
        }
        fetch(`https://raumapc-backend.onrender.com/api/products/${shortId}/view`, { method: 'PUT' }).catch(err => console.log("Lỗi tăng view"));
    }

    // TẢI DỮ LIỆU TỪ MÁY CHỦ
    fetch('https://raumapc-backend.onrender.com/api/products?limit=1000&v=' + new Date().getTime())
        .then(res => res.ok ? res.json() : null)
        .then(result => {
            const products = result && result.data ? result.data : result;
            if(!products) return renderDetail(null);
            let sp = null;
            if (urlId) {
                sp = products.find(p => p.id === urlId || p._id === urlId || (p.productId && p.productId.toUpperCase() === urlId.toUpperCase()) || ((p.id || p._id).toString().slice(-6).toUpperCase() === urlId.toUpperCase()));
            } else if (urlSlug) { sp = products.find(p => toSlug(p.name) === urlSlug); }
            
            // Render chi tiết sản phẩm chính
            renderDetail(sp);
            
            // KÍCH HOẠT HIỂN THỊ SẢN PHẨM LIÊN QUAN
            if(sp && products) {
                renderRelatedProducts(sp, products);
            }
        }).catch(() => document.getElementById('loading-screen').innerHTML = "Lỗi kết nối máy chủ!");
});

const btnAddCart = document.querySelector('.btn-add-cart');
if (btnAddCart) {
    btnAddCart.addEventListener('click', function () {
        if (currentProduct) {
            // Lớp bảo vệ chống bấm nhầm đối với hàng Hết/Liên hệ
            if (currentProduct.status === 'Hết hàng') return; 
            if (currentProduct.status === 'Liên hệ') {
                window.location.href = '../../pages/info/contact.html';
                return;
            }

            let rawPrice = parseInt(String(currentProduct.price).replace(/\D/g, '')) || 0;
            let realId = currentProduct.id || currentProduct._id; 
            
            if (typeof window.addToCart === 'function') {
                window.addToCart(realId, currentProduct.name, rawPrice, currentProduct.img);
            } else {
                var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
                var existingItem = currentCart.find(item => item.id === realId);
                if (existingItem) { existingItem.quantity = parseInt(existingItem.quantity) + 1; } 
                else { currentCart.push({ id: realId, name: currentProduct.name, price: rawPrice, img: currentProduct.img, quantity: 1 }); }
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
            // Lớp bảo vệ chống bấm nhầm
            if (currentProduct.status && currentProduct.status !== 'Còn hàng') return;

            let rawPrice = parseInt(String(currentProduct.price).replace(/\D/g, '')) || 0;
            let realId = currentProduct.id || currentProduct._id; 
            
            var currentCart = JSON.parse(localStorage.getItem('myCart')) || [];
            var existingItem = currentCart.find(item => item.id === realId);
            if (existingItem) { existingItem.quantity = parseInt(existingItem.quantity) + 1; } 
            else { currentCart.push({ id: realId, name: currentProduct.name, price: rawPrice, img: currentProduct.img, quantity: 1 }); }
            localStorage.setItem('myCart', JSON.stringify(currentCart));
            window.location.href = 'cart.html';
        }
    });
}

let uploadedReviewImage = "";
function renderComments(commentsArray) {
    if (commentsArray && commentsArray.length > 0) {
        let totalReviews = commentsArray.length; let totalStars = 0; let starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        commentsArray.forEach(cmt => { let rating = parseInt(cmt.rating) || 5; totalStars += rating; starCounts[rating]++; });
        
        let avgScore = (totalStars / totalReviews).toFixed(1);
        const avgEl = document.getElementById('summary-avg-score'); if (avgEl) avgEl.innerText = `${avgScore}/5`;
        const totalEl = document.getElementById('summary-total-reviews'); if (totalEl) totalEl.innerText = `${totalReviews} đánh giá và nhận xét`;
        const starsEl = document.getElementById('summary-avg-stars');
        if (starsEl) { let roundedStars = Math.round(avgScore); starsEl.innerHTML = '<span style="color: #f59e0b;">' + '★'.repeat(roundedStars) + '</span><span style="color:#cbd5e1">' + '★'.repeat(5 - roundedStars) + '</span>'; }
        
        for (let i = 1; i <= 5; i++) {
            let percentage = (starCounts[i] / totalReviews) * 100;
            let barEl = document.getElementById(`summary-bar-${i}`); let countEl = document.getElementById(`summary-count-${i}`);
            if (barEl) barEl.style.width = `${percentage}%`; if (countEl) countEl.innerText = `${starCounts[i]} đánh giá`;
        }
    }

    const listEl = document.getElementById('comment-list'); listEl.innerHTML = ''; 

    let html = `<div style="text-align: center; background: #f8fafc; padding: 25px 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 25px;"><p style="font-size: 15px; color: #1e293b; font-weight: 500; margin-bottom: 15px;">Bạn đánh giá sao sản phẩm này?</p><button onclick="openReviewModal()" style="background: #1976d2; color: white; border: none; padding: 12px 35px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(25, 118, 210, 0.2);">Đánh giá ngay</button></div>`;

    if (!commentsArray || commentsArray.length === 0) {
        html += `<div style="text-align: center; padding: 40px 20px; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1;"><p style="color: #94a3b8; font-size: 15px; margin: 0;">Sản phẩm chưa có đánh giá nào. Bạn hãy là người đầu tiên!</p></div>`;
        listEl.innerHTML = html; return;
    }

    [...commentsArray].reverse().forEach(cmt => {
        let initial = (cmt.userName && cmt.userName.length > 0) ? cmt.userName.charAt(0).toUpperCase() : "U";
        let stars = parseInt(cmt.rating) || 5;
        let starHtml = '<span style="color: #f59e0b; letter-spacing: 2px; font-size: 14px;">' + '★'.repeat(stars) + '<span style="color:#e2e8f0">' + '★'.repeat(5 - stars) + '</span></span>';
        let imgHtml = cmt.img ? `<img src="${cmt.img}" class="cmt-attached-img" alt="Ảnh đánh giá">` : '';
        let avatarDisplay = (cmt.userAvatar && cmt.userAvatar.trim() !== '') ? `<img src="${cmt.userAvatar}" style="width:100%; height:100%; object-fit:cover;">` : initial;
        html += `<div class="cmt-box"><div class="cmt-header"><div class="cmt-avt" style="overflow: hidden; padding: 0; display: flex; align-items: center; justify-content: center;">${avatarDisplay}</div><div class="cmt-name">${cmt.userName}</div><div class="cmt-time">🕒 ${cmt.date}</div></div><div class="cmt-row"><div class="cmt-row-label">Đánh giá:</div><div class="cmt-row-content">${starHtml}</div></div><div class="cmt-row"><div class="cmt-row-label">Nhận xét:</div><div class="cmt-row-content">${cmt.content}${imgHtml}</div></div></div>`;
    });
    listEl.innerHTML = html;
}

const reviewFileInput = document.getElementById('review-file-input');
if(reviewFileInput) {
    reviewFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0]; if(!file) return;
        if (!file.type.match('image.*')) return window.showGlobalAlert("Chỉ hỗ trợ file ảnh!", false);
        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas'); const MAX_WIDTH = 600; let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                uploadedReviewImage = canvas.toDataURL('image/jpeg', 0.8);
                const preview = document.getElementById('review-img-preview'); preview.src = uploadedReviewImage; preview.style.display = 'block';
            }; img.src = evt.target.result;
        }; reader.readAsDataURL(file);
    });
}

function openReviewModal() {
    const modal = document.getElementById('review-modal'); const content = document.getElementById('review-modal-content');
    modal.style.display = 'flex'; setTimeout(() => { content.style.opacity = '1'; content.style.transform = 'translateY(0)'; }, 10);
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal'); const content = document.getElementById('review-modal-content');
    content.style.opacity = '0'; content.style.transform = 'translateY(50px)'; setTimeout(() => { modal.style.display = 'none'; }, 300);
}

const reviewModal = document.getElementById('review-modal');
if (reviewModal) { reviewModal.addEventListener('click', function (e) { if (e.target === this) closeReviewModal(); }); }

const stars = document.querySelectorAll('#star-selector span');
const starText = document.getElementById('star-text');
const texts = ["", "Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"];

stars.forEach(star => {
    star.addEventListener('click', function () {
        const val = parseInt(this.getAttribute('data-val')); document.getElementById('star-selector').setAttribute('data-rating', val);
        if (starText) starText.innerText = texts[val];
        stars.forEach(s => { if (parseInt(s.getAttribute('data-val')) <= val) s.style.color = '#f59e0b'; else s.style.color = '#e2e8f0'; });
    });
});

window.submitReview = function() {
    let dbId = currentProduct.id || currentProduct._id; 
    if (!currentProduct || !dbId) return window.showGlobalAlert("Lỗi tải trang!", false);
    
    const contentBox = document.getElementById('comment-input'); const content = contentBox.value.trim();
    const rating = parseInt(document.getElementById('star-selector').getAttribute('data-rating'));

    if (rating === 0) return window.showGlobalAlert("Vui lòng chọn số sao đánh giá!", false);
    if (!content) return window.showGlobalAlert("Vui lòng nhập nội dung đánh giá!", false);

    const btn = document.getElementById('btn-submit-review'); btn.innerText = "ĐANG GỬI..."; btn.disabled = true;

    let userName = "Khách ghé thăm"; let userAvatar = ""; 
    try { 
        const userStr = localStorage.getItem('currentUser');
        if(userStr) {
            const user = JSON.parse(userStr); userName = user.fullName || "Khách ghé thăm"; 
            if (user.avatar && typeof user.avatar === 'string' && user.avatar.includes('data:image')) { userAvatar = user.avatar; }
        }
    } catch(e) { console.error("Lỗi lấy thông tin User:", e); }

    fetch(`https://raumapc-backend.onrender.com/api/products/${dbId}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: userName, userAvatar: userAvatar, content: content, rating: rating, img: uploadedReviewImage })
    }).then(res => res.json()).then(data => {
        btn.innerText = "GỬI ĐÁNH GIÁ"; btn.disabled = false;
        if (data.success) {
            contentBox.value = ''; uploadedReviewImage = ''; 
            document.getElementById('review-img-preview').style.display = 'none'; document.getElementById('review-file-input').value = '';
            document.getElementById('star-selector').setAttribute('data-rating', 0);
            closeReviewModal(); window.showGlobalAlert("Cảm ơn bạn đã đánh giá sản phẩm!", true); renderComments(data.comments);
        } else { window.showGlobalAlert(data.message, false); }
    }).catch(err => {
        btn.innerText = "GỬI ĐÁNH GIÁ"; btn.disabled = false;
        window.showGlobalAlert("Lỗi mạng! Không thể kết nối với máy chủ.", false);
    });
};

window.changeMainImage = function(thumbEl) {
    const src = thumbEl.querySelector('img').src;
    const mainImgEl = document.querySelector('.main-image img');
    if (mainImgEl) mainImgEl.src = src; 
    document.querySelectorAll('.thumb-item').forEach(el => el.classList.remove('active')); 
    thumbEl.classList.add('active');
};

// ==========================================
// THUẬT TOÁN TÌM & HIỂN THỊ SẢN PHẨM LIÊN QUAN (ĐÃ FIX LỖI TÀNG HÌNH)
// ==========================================
function renderRelatedProducts(currentSp, allSp) {
    const grid = document.getElementById('related-products-grid');
    if(!grid) return;

    // 1. Phân tích danh mục của sản phẩm hiện tại
    let catArray = (currentSp.category || "").split(',').map(c => c.trim().toLowerCase());
    let mainCat = catArray.length > 0 ? catArray[0] : "";

    // 2. Lọc ra các sản phẩm có chung danh mục, loại bỏ sản phẩm hiện tại một cách an toàn
    let related = allSp.filter(p => {
        // ĐÃ SỬA: Chỉ so sánh id chính thức, loại bỏ phép so sánh undefined
        if (p.id === currentSp.id) return false; 
        let pCat = (p.category || "").toLowerCase();
        return mainCat !== "" && pCat.includes(mainCat);
    });

    // 3. Nếu tìm được quá ít (< 5 cái), lấy ngẫu nhiên thêm các sản phẩm khác đắp vào
    if (related.length < 5) {
        let others = allSp.filter(p => p.id !== currentSp.id && !related.includes(p));
        others.sort(() => 0.5 - Math.random()); // Trộn ngẫu nhiên
        related = related.concat(others);
    }

    // 4. Chỉ cắt lấy đúng 5 sản phẩm đầu tiên để hiển thị
    related = related.slice(0, 5);

    // 5. Đổ dữ liệu ra mã HTML
    grid.innerHTML = related.map(p => {
        let safeImg = p.img || '../../assets/images/icons/logo.jpg';
        let safeId = p.productId || p.id;
        
        let statusColor = p.status === 'Còn hàng' ? '#059669' : (p.status === 'Hết hàng' ? '#dc2626' : '#ea580c');
        let priceDisplay = '';
        if (p.status === 'Liên hệ') priceDisplay = 'Liên hệ';
        else if (p.status === 'Hết hàng') priceDisplay = 'Hết hàng';
        else priceDisplay = typeof p.price === 'number' ? new Intl.NumberFormat('vi-VN').format(p.price) + 'đ' : p.price;

        return `
        <a href="product-detail.html?id=${safeId}" style="display: flex; flex-direction: column; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 100px; text-decoration: none; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);" onmouseover="this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1)'; this.style.borderColor='#cbd5e1'; this.style.transform='translateY(-3px)';" onmouseout="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.02)'; this.style.borderColor='#e2e8f0'; this.style.transform='translateY(0)';">
            <div style="width: 100%; height: 160px; margin-bottom: 15px; display: flex; align-items: center; justify-content: center;">
                <img src="${safeImg}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
            <h4 style="font-size: 13.5px; font-weight: 600; color: #1e293b; margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; height: 38px;">${p.name}</h4>
            <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #d70018; font-weight: bold; font-size: 15px;">${priceDisplay}</span>
                <span style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: ${statusColor}15; color: ${statusColor}; font-weight: 600;">${p.status || 'Còn hàng'}</span>
            </div>
        </a>
        `;
    }).join('');
}

// ==========================================
// TÍNH NĂNG SAO CHÉP LINK CHIA SẺ (CHUẨN SEO)
// ==========================================
window.copyShareLink = function() {
    if (!currentProduct) return;
    
    // Lấy ID chính xác của sản phẩm
    let realId = currentProduct.id || currentProduct._id;
    let shortId = currentProduct.productId || realId.slice(-6).toUpperCase();
    
    // Sinh đường link Trạm Trung Chuyển trên Backend
    let seoShareUrl = `https://raumapc-backend.onrender.com/share/${shortId}`;
    
    // Dán vào khay nhớ tạm (Clipboard) của điện thoại / máy tính
    navigator.clipboard.writeText(seoShareUrl).then(() => {
        if (typeof window.showGlobalAlert === 'function') {
            window.showGlobalAlert('🔗 Đã sao chép Link chia sẻ!\nBạn có thể dán vào Zalo hoặc Facebook. Giao diện sản phẩm sẽ tự động hiển thị cực kỳ chuyên nghiệp.', true);
        } else {
            alert('Đã sao chép link chia sẻ thành công!');
        }
    }).catch(err => {
        // Fallback cho trình duyệt cũ không hỗ trợ Clipboard API
        let tempInput = document.createElement('input');
        tempInput.value = seoShareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        if (typeof window.showGlobalAlert === 'function') window.showGlobalAlert('🔗 Đã sao chép Link chia sẻ thành công!', true);
    });
};