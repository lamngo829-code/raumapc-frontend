// Biến lưu trữ toàn bộ sản phẩm từ API
let allProducts = [];

// Hàm gọi API lấy dữ liệu sản phẩm
async function fetchProductsFromAPI() {
    try {
        const response = await fetch('https://raumapc-backend.onrender.com/api/products');
        if (!response.ok) throw new Error('Network response was not ok');
        
        allProducts = await response.json();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
    }
}

// 1. DANH MỤC LINH KIỆN & PHỤ KIỆN HIỆN CÓ
const componentCategories = [
    { key: 'vga', name: 'VGA - Card màn hình' },
    { key: 'main', name: 'Mainboard - Bo mạch chủ' },
    { key: 'ram', name: 'RAM - Bộ nhớ trong' },
    { key: 'ssd', name: 'Ổ cứng SSD' },
    { key: 'monitor', name: 'Màn hình máy tính' },
    { key: 'mouse', name: 'Mouse - Chuột' },
    { key: 'cpu', name: 'CPU - Vi xử lý' },
    { key: 'psu', name: 'Nguồn máy tính' },
    { key: 'case', name: 'Vỏ ca-se' }
];

// 3. LOGIC LƯU TRỮ VÀ XỬ LÝ GIAO DIỆN
let userBuild = JSON.parse(localStorage.getItem('myPCBuild')) || {};
let currentModalCategory = '';

function renderBuilderRows() {
    const container = document.getElementById('componentList');
    if (!container) return;

    let html = '';
    let totalPrice = 0;

    componentCategories.forEach(cat => {
        const selectedProd = userBuild[cat.key];
        
        if (selectedProd) {
            totalPrice += selectedProd.price;
        }

        html += `
            <div class="component-row">
                <div class="component-left">
                    <span class="component-name">${cat.name}</span>
                </div>
                <div class="component-middle">
                    ${selectedProd ? `
                        <img src="${selectedProd.img.startsWith('data:image') ? selectedProd.img : `../../${selectedProd.img}`}" class="selected-item-img" alt="${selectedProd.name}">
                        <div class="selected-item-info">
                            <span class="selected-item-title">${selectedProd.name}</span>
                            <span class="selected-item-price">${window.formatCurrency(selectedProd.price)}</span>
                        </div>
                    ` : `
                        <span class="empty-selection">Chưa chọn sản phẩm</span>
                    `}
                </div>
                <div class="component-right">
                    <button class="btn-select" onclick="window.openPickerModal('${cat.key}', '${cat.name}')">
                        ${selectedProd ? 'Thay đổi' : 'Chọn sản phẩm'}
                    </button>
                    ${selectedProd ? `<button class="btn-remove-row" onclick="window.removeComponent('${cat.key}')">✕</button>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    document.getElementById('builderTotalPrice').innerText = window.formatCurrency(totalPrice);
    localStorage.setItem('myPCBuild', JSON.stringify(userBuild));
}

window.openPickerModal = function(categoryCode, categoryName) {
    currentModalCategory = categoryCode; 
    
    const title = categoryName ? categoryName : categoryCode.toUpperCase();
    const modalCategoryTitle = document.getElementById('modalCategoryName');
    if (modalCategoryTitle) {
        modalCategoryTitle.textContent = `Chọn ${title}`;
    }

    
    // BỘ LỌC NGHIÊM NGẶT: Chỉ nhận diện qua Category (Danh mục)
    const filteredProducts = allProducts.filter(p => {
        const dbCategory = (p.category || '').toLowerCase();
        const searchCode = categoryCode.toLowerCase(); 
        
        // Nhận diện cho nhóm CPU
        if (searchCode === 'cpu') {
            return dbCategory.includes('cpu') || dbCategory === 'intel' || dbCategory === 'amd';
        }
        
        // Nhận diện cho nhóm Ổ Cứng (Chấp nhận mã 'storage')
        if (searchCode === 'ssd' || searchCode === 'hdd') {
            return dbCategory === 'storage' || dbCategory.includes('ssd') || dbCategory.includes('hdd');
        }

        // Khóa chặt các linh kiện còn lại
        return dbCategory.includes(searchCode);
    });

    const searchInput = document.getElementById('modalSearchInput');
    if(searchInput) searchInput.value = '';

    renderModalList(filteredProducts, categoryCode);
    document.getElementById('productPickerModal').style.display = 'flex';
};

function renderModalList(productsToRender, categoryCode) {
    const modalList = document.getElementById('modalProductList');
    modalList.innerHTML = '';

    if (productsToRender.length === 0) {
        modalList.innerHTML = '<p style="padding: 20px; text-align: center;">Chưa có sản phẩm nào phù hợp!</p>';
        return;
    }

    productsToRender.forEach(p => {
        let priceStr = typeof p.price === 'number' 
            ? new Intl.NumberFormat('vi-VN').format(p.price) + 'đ' 
            : p.price;

        let safeImg = '../../assets/images/icons/logo.jpg';
        if (p.img && typeof p.img === 'string') {
            let cleanImg = p.img.trim().replace(/"/g, '').replace(/\\/g, '/');
            // Bảo vệ an toàn tuyệt đối cho ảnh kéo thả Base64
            if (cleanImg.startsWith('data:image')) {
                safeImg = cleanImg;
            } else {
                safeImg = (cleanImg.startsWith('http') || cleanImg.startsWith('/')) ? cleanImg : `../../${cleanImg}`;
            }
        }

        const productDiv = document.createElement('div');
        productDiv.className = 'modal-product-item';
        productDiv.style = "display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee;";
        
        productDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${safeImg}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: contain; border: 1px solid #ddd; border-radius: 4px;">
                <div class="product-info">
                    <h4 style="margin: 0; font-size: 14px; color: #333; max-width: 350px; line-height: 1.4;">${p.name}</h4>
                    <p class="price" style="color: #d70018; font-weight: bold; margin: 5px 0 0 0;">${priceStr}</p>
                </div>
            </div>
            <button style="padding: 6px 16px; background: #0380e6; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;" 
                onclick="window.selectComponent('${categoryCode}', '${p._id || p.id}')">Chọn</button>
        `;
        modalList.appendChild(productDiv);
    });
}

window.selectComponent = function(categoryCode, prodId) {
    const chosen = allProducts.find(p => (p._id || p.id) === prodId);
    if (chosen) {
        let numPrice = typeof chosen.price === 'string' ? parseInt(chosen.price.replace(/\D/g, '')) || 0 : chosen.price;
        
        userBuild[categoryCode] = {
            id: prodId,
            name: chosen.name,
            price: numPrice,
            img: chosen.img
        };
        renderBuilderRows();
        window.closePickerModal();
    }
};

window.filterModalProducts = function() {
    const keyword = (document.getElementById('modalSearchInput').value || '').toLowerCase();
    
    const filteredProducts = allProducts.filter(p => {
        const dbCategory = (p.category || '').toLowerCase();
        const dbBrand = (p.brand || '').toLowerCase();
        const searchCode = currentModalCategory.toLowerCase();
        
        let isMatchCategory = false;
        if (searchCode === 'cpu') {
            isMatchCategory = dbCategory.includes('cpu') || dbCategory === 'intel' || dbCategory === 'amd' || dbBrand === 'intel' || dbBrand === 'amd';
        } else if (searchCode === 'vga') {
            isMatchCategory = dbCategory.includes('vga');
        } else {
            isMatchCategory = dbCategory.includes(searchCode) || searchCode.includes(dbCategory);
        }

        const isMatchName = p.name.toLowerCase().includes(keyword);
        return isMatchCategory && isMatchName;
    });

    renderModalList(filteredProducts, currentModalCategory);
};

window.closePickerModal = function() {
    document.getElementById('productPickerModal').style.display = 'none';
};

window.onclick = function(event) {
    const modal = document.getElementById('productPickerModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

window.removeComponent = function(catKey) {
    delete userBuild[catKey];
    renderBuilderRows();
};

window.resetBuilder = function() {
    if (typeof window.showGlobalConfirm === 'function') {
        window.showGlobalConfirm('Bạn có chắc muốn xóa toàn bộ các sản phẩm đã chọn?', function() {
            userBuild = {};
            renderBuilderRows();
        });
    } else {
        if (confirm('Bạn có chắc muốn xóa toàn bộ các sản phẩm đã chọn?')) {
            userBuild = {};
            renderBuilderRows();
        }
    }
};

window.addAllToCart = function() {
    const keys = Object.keys(userBuild);
    if (keys.length === 0) {
        if (typeof window.showGlobalAlert === 'function') {
            window.showGlobalAlert('Vui lòng chọn ít nhất 1 sản phẩm trước khi thêm vào giỏ hàng!', false);
        } else {
            alert('Vui lòng chọn ít nhất 1 sản phẩm trước khi thêm vào giỏ hàng!');
        }
        return;
    }

    // Tạm thời vô hiệu hóa alert() bên trong hàm addToCart của layout.js 
    // để tránh bị bật thông báo liên tục cho từng sản phẩm
    const originalAlert = window.showGlobalAlert; 
    window.showGlobalAlert = function(){}; 

    keys.forEach(k => {
        const item = userBuild[k];
        window.addToCart(item.id, item.name, item.price, item.img);
    });

    // Khôi phục lại hàm thông báo gốc
    window.showGlobalAlert = originalAlert;

    // Hiển thị một thông báo tổng duy nhất
    if (typeof window.showGlobalAlert === 'function') {
        window.showGlobalAlert('Đã thêm toàn bộ sản phẩm cấu hình vào giỏ hàng thành công!', true);
    } else {
        alert('Đã thêm toàn bộ sản phẩm cấu hình vào giỏ hàng thành công!');
    }
};

// Khởi động
document.addEventListener('DOMContentLoaded', () => {
    if (typeof fetchProductsFromAPI === 'function') fetchProductsFromAPI();
    renderBuilderRows(); 
});