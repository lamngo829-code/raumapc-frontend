// Biến lưu trữ toàn bộ sản phẩm từ API
let allProducts = [];

async function fetchProductsFromAPI() {
    try {
        // VÁ LỖI 1: Thêm ?limit=1000 để lấy toàn bộ kho hàng
        const response = await fetch('https://raumapc-backend-fms3.onrender.com/api/products?limit=50');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const result = await response.json();
        
        // VÁ LỖI 2: Mở khóa đúng mảng dữ liệu
        allProducts = result.data ? result.data : result;
        
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
    }
}

// 1. DANH MỤC LINH KIỆN & PHỤ KIỆN HIỆN CÓ
const componentCategories = [
    { key: 'cpu', name: 'CPU - Vi xử lý' },
    { key: 'main', name: 'Mainboard - Bo mạch chủ' },
    { key: 'ram1', name: 'RAM - Bộ nhớ trong 1' },
    { key: 'ram2', name: 'RAM - Bộ nhớ trong 2' },
    { key: 'vga', name: 'VGA - Card màn hình' },
    { key: 'ssd1', name: 'Ổ cứng (SSD/HDD) 1' },
    { key: 'ssd2', name: 'Ổ cứng (SSD/HDD) 2' },
    { key: 'psu', name: 'Nguồn máy tính' },
    { key: 'case', name: 'Vỏ Case' },
    { key: 'cooling', name: 'Tản nhiệt' },
    { key: 'monitor1', name: 'Màn hình máy tính 1' },
    { key: 'monitor2', name: 'Màn hình máy tính 2' },
    { key: 'keyboard', name: 'Bàn phím' },
    { key: 'mouse', name: 'Mouse - Chuột' },
    { key: 'software', name: 'Phần mềm bản quyền' }
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

    
    // BỘ LỌC NGHIÊM NGẶT CÓ LOẠI TRỪ CHÉO
    const filteredProducts = allProducts.filter(p => {
        const dbCategory = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const searchCode = categoryCode.toLowerCase().replace(/[0-9]/g, ''); 
        
        // 1. Lọc CPU: Chặn Tản nhiệt lọt vào
        if (searchCode === 'cpu') {
            if (pName.includes('tản') || pName.includes('cooling')) return false;
            return dbCategory.includes('cpu') || dbCategory === 'intel' || dbCategory === 'amd' || /\bcpu\b/.test(pName) || /\bcore\b/.test(pName) || /\bryzen\b/.test(pName);
        }
        // 2. Lọc Ổ cứng
        if (searchCode === 'ssd' || searchCode === 'hdd') {
            return dbCategory === 'storage' || dbCategory.includes('ssd') || dbCategory.includes('hdd') || /\bssd\b/.test(pName) || /\bhdd\b/.test(pName) || pName.includes('ổ cứng');
        }
        // 3. Lọc RAM: Chặn Main, VGA, Tản nhiệt
        if (searchCode === 'ram') {
            if (pName.includes('main') || pName.includes('bo mạch') || pName.includes('vga') || pName.includes('card') || pName.includes('tản')) return false;
            return dbCategory.includes('ram') || /\bram\b/.test(pName) || pName.includes('ddr');
        }
        // 4. Lọc Tản nhiệt: Loại bỏ Keo tản nhiệt
        if (searchCode === 'cooling') {
            if (pName.includes('keo')) return false;
            return dbCategory.includes('cooling') || pName.includes('tản nhiệt') || pName.includes('aio');
        }
        // 5. Lọc Màn hình: Chặn Card màn hình
        if (searchCode === 'monitor') {
            if (pName.includes('card')) return false; 
            return dbCategory.includes('monitor') || dbCategory.includes('màn hình') || pName.includes('màn hình');
        }
        // 6. Lọc Bàn phím
        if (searchCode === 'keyboard') {
            return dbCategory.includes('phím') || dbCategory.includes('keyboard') || pName.includes('bàn phím');
        }
        // 7. Lọc Phần mềm bản quyền
        if (searchCode === 'software') {
            return dbCategory.includes('win') || dbCategory.includes('office') || dbCategory.includes('phần mềm') || dbCategory.includes('virus') || pName.includes('phần mềm') || pName.includes('microsoft');
        }

        // Khóa chặt các linh kiện còn lại
        return dbCategory.includes(searchCode) || pName.includes(searchCode);
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
        const pName = (p.name || '').toLowerCase();
        const searchCode = currentModalCategory.toLowerCase().replace(/[0-9]/g, '');
        
        let isMatchCategory = false;
        
        if (searchCode === 'cpu') {
            if (pName.includes('tản') || pName.includes('cooling')) return false;
            isMatchCategory = dbCategory.includes('cpu') || dbCategory === 'intel' || dbCategory === 'amd' || /\bcpu\b/.test(pName) || /\bcore\b/.test(pName) || /\bryzen\b/.test(pName);
        } else if (searchCode === 'ssd' || searchCode === 'hdd') {
            isMatchCategory = dbCategory === 'storage' || dbCategory.includes('ssd') || dbCategory.includes('hdd') || /\bssd\b/.test(pName) || /\bhdd\b/.test(pName) || pName.includes('ổ cứng');
        } else if (searchCode === 'ram') {
            if (pName.includes('main') || pName.includes('bo mạch') || pName.includes('vga') || pName.includes('card') || pName.includes('tản')) return false;
            isMatchCategory = dbCategory.includes('ram') || /\bram\b/.test(pName) || pName.includes('ddr');
        } else if (searchCode === 'cooling') {
            if (pName.includes('keo')) return false;
            isMatchCategory = dbCategory.includes('cooling') || pName.includes('tản nhiệt') || pName.includes('aio');
        } else if (searchCode === 'monitor') {
            if (pName.includes('card')) return false;
            isMatchCategory = dbCategory.includes('monitor') || dbCategory.includes('màn hình') || pName.includes('màn hình');
        } else if (searchCode === 'keyboard') {
            isMatchCategory = dbCategory.includes('phím') || dbCategory.includes('keyboard') || pName.includes('bàn phím');
        } else if (searchCode === 'software') {
            isMatchCategory = dbCategory.includes('win') || dbCategory.includes('office') || dbCategory.includes('phần mềm') || dbCategory.includes('virus') || pName.includes('phần mềm') || pName.includes('microsoft');
        } else {
            isMatchCategory = dbCategory.includes(searchCode) || pName.includes(searchCode);
        }

        const isMatchName = pName.includes(keyword);
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