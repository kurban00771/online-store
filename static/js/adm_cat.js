(function () {
    const catListEl = document.querySelector('#cat_list');
    const nameInput = document.querySelector('#input__cat');
    const photoInput = document.querySelector('#input__cat-photo');
    const sendBtn = document.querySelector('#add__cat-btn');
    const catList = document.querySelector('.main__list');
    const priceInput = document.querySelector('#input__price');
    const desc = document.querySelector('#input__desc');
    const cat = document.querySelector('#input__cat');

    const closeBtn = document.querySelector('#close-btn');
    const overlay = document.querySelector('#modal-overlay');
    const modal = overlay.querySelector('#cat_modal');
    const catName = overlay.querySelector('#cat_name');
    const catImage = overlay.querySelector('#cat_image');
    const catActive = overlay.querySelector('#cat_active');
    const editBtn = overlay.querySelector('#cat__edit');
    const spanId = overlay.querySelector('#cat_id');

    renderCat();

    catList.addEventListener('click', showModalCat);
    sendBtn.addEventListener('click', addCat);
    editBtn.addEventListener('click', editCat);


    async function showModalCat(e) {
        const block = e.target.closest('.main__li');
        if (block) {
            let url = "/get_cat";
            let response = await fetch(url);
            let catList = await response.json();
            const cat = catList.find(el => el.id == block.id);

            spanId.textContent = cat.id;
            catName.value = cat.title;
            if (cat.active) catActive.checked = true;
            else catActive.checked = false;
            overlay.classList.add('is-open');
        }
    }



    function closeModal() {
        if (overlay) overlay.classList.remove('is-open');
    }


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

    async function editCat() {
        const name = catName.value;
        const photo = catImage.files[0];
        const active = catActive.checked;
        const id = spanId.textContent;

        let url = "/edit_cat";
        const formData = new FormData();
        if (photo) formData.append('photo', photo);

        formData.append('name', name);
        formData.append('active', active);
        formData.append('id', id);

        // const res = await fetch(url, {
        //     method: 'POST',
        //     body: formData
        // });

        const res = await fetch(url, { method: 'POST', body: formData });

        if (!res.ok) {
            const err = await res.json();
            return alert(err.error)
        }

        alert('Категория изменена');
        window.location.reload();
    }


    async function addCat() {
        const name = nameInput.value;
        const photo = photoInput.files[0];

        if (!photo) {
            return alert('Выберите фото')
        }

        let url = "/add_cat";
        const formData = new FormData();
        formData.append('photo', photo);
        formData.append('name', name);

        const res = await fetch(url, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            return alert(err.error)
        }

        window.location.reload();
    }

    async function renderCat() {
        let url = "/get_cat";
        let response = await fetch(url);
        let catList = await response.json();
        for (let el of catList) {
            let active = el.active;
            // if (el.active == 'false') active = false;
            catListEl.innerHTML += `
            <div class="main__li" id="${el.id}">
            <div class="main__id w50">${el.id}</div>
            <div class="main__img-block w100">
                <img src="/img/categories/${el.img}" class="main__img">
            </div>
            <div class="main__name w150">${el.title}</div>
            <div class="main__active w100">${active ? 'Активный' : 'Не активный'}</div>
        </div>
        `
        }
    }

})()

