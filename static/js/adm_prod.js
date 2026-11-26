(function () {
    const prodListEl = document.querySelector('#prod_list');
    const nameInput = document.querySelector('#input__name');
    const photoInput = document.querySelector('#input__prod-photo');
    const sendBtn = document.querySelector('#add__prod-btn');
    const prodCat = document.querySelector('#prod_cat');
    const priceInput = document.querySelector('#input__price');
    const descInput = document.querySelector('#input__desc');
    const addCatSelect = document.querySelector('#input__cat');
    const closeBtn = document.querySelector('#close-btn');
    const overlay = document.querySelector('#modal-overlay');
    const prodName = overlay.querySelector('#prod_name');
    const prodPrice = overlay.querySelector('#prod_price');
    const prodDesc = overlay.querySelector('#prod_desc');
    const prodImage = overlay.querySelector('#prod_image');
    const prodActive = overlay.querySelector('#prod_active');
    const editBtn = overlay.querySelector('#prod_edit');
    const spanId = overlay.querySelector('#prod_id');

    renderProd();

    prodListEl.addEventListener('click', showModalProd);
    sendBtn.addEventListener('click', addProd);
    editBtn.addEventListener('click', editProd);
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeModal();
            }
        });
    }
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && overlay?.classList.contains('is-open')) {
            closeModal();
        }
    });

    async function showModalProd(e) {
        const block = e.target.closest('.main__li');
        if (block) {
            let url = '/get_prod';
            const response = await fetch('/get_prod');
            const prodList = await response.json();
            const prod = prodList.find(el => el.id == block.id);
            spanId.textContent = prod.id;
            prodName.value = prod.title;
            prodPrice.value = prod.price;
            prodDesc.value = prod.desc;
            prodCat.value = prod.categorie;
            prodActive.checked = Boolean(prod.active);
            // if (prod.active) prodActive.checked = true;
            // else prodActive.checked = false;
            overlay.classList.add('is-open');
        }
    }
    function closeModal() {
        if (overlay) overlay.classList.remove('is-open');
    }
    
    async function editProd() {
        const name = prodName.value;
        const photo = prodImage.files[0];
        const active = prodActive.checked;
        const id = spanId.textContent;
        const categorie = prodCat.value;
        const price = prodPrice.value;
        const desc = prodDesc.value;
        let url = '/edit_prod';
        // fetch('/edit_prod', url);
        const formData = new FormData();
        if (photo) formData.append('photo', photo);
        formData.append('name', name);
        formData.append('active', active);
        formData.append('id', id);
        formData.append('price', price);
        formData.append('desc', desc);
        formData.append('categorie', categorie);
        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const err = await res.json();
            return alert(err.error);
        }
        alert('Товар изменён');
        window.location.reload();
    }
    async function addProd() {
        const name = nameInput.value;
        const photo = photoInput.files[0];
        if (!photo) {
            return alert('Выберите фото');
        }
        const url = '/add_prod';
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('name', name);
        formData.append('price', priceInput.value);
        formData.append('desc', descInput.value);
        formData.append('categorie', addCatSelect.value);
        const res = await fetch(url, { method: 'POST', body: formData });
        if (!res.ok) {
            const err = await res.json();
            return alert(err.error);
        }
        alert('Товар добавлен');
        window.location.reload();
    }
    async function renderProd() {
        const [prodResponse, catResponse] = await Promise.all([
            fetch('/get_prod'),
            fetch('/get_cat')
        ]);
        const prodList = await prodResponse.json();
        const catList = await catResponse.json();
        let html = '';
        for (const el of prodList) {
            const catTitle = catList.find(c => c.id == el.categorie)?.title || 'Без категории';
            html += `
            <div class="main__li" id="${el.id}">
                <div class="main__id w50">${el.id}</div>
                <div class="main__img-block w100">
                    <img src="/img/products/${el.img}" class="main__img">
                </div>
                <div class="main__cat w150">${catTitle}</div>
                <div class="main__name w300">${el.title}</div>
                <div class="main__price w100">${el.price}</div>
                <div class="main__active w100">${el.active ? 'Активный' : 'Не активный'}</div>
            </div>
        `;
        }
        prodListEl.innerHTML = html;
    }
})();
