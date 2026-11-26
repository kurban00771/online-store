(async function () {
    const tgInp = document.querySelector('#telegram');
    const wtsInp = document.querySelector('#wts');
    const maxInp = document.querySelector('#max');
    const descTitleInp = document.querySelector('#desc_title');
    const descInp = document.querySelector('#desc');
    const aboutTitle = document.querySelector('#about_title');
    const aboutDesc = document.querySelector('#about_desc');
    const aboutImg1 = document.querySelector('#about_img1');
    const aboutImg2 = document.querySelector('#about_img2');
    const phoneInp1 = document.querySelector('#tel');
    const viewInp1 = document.querySelector('#view');
    const phoneInp2 = document.querySelector('#tel2');
    const viewInp2 = document.querySelector('#view2');
    const addr1 = document.querySelector('#address1');
    const addr2 = document.querySelector('#address2');
    const phoCon = document.querySelector('#img_bg');
    const photoCon1 = document.querySelector('#cont_img1');
    const photoCon2 = document.querySelector('#cont_img2');
    const photoCon3 = document.querySelector('#cont_img3');
    const photoCon4 = document.querySelector('#cont_img4');
    const photoBtn = document.querySelector('#photo_btn')
    const addrBtn = document.querySelector('#address_btn');
    const telBtn = document.querySelector('#tel_btn');
    const socBtn = document.querySelector('#soc_btn');
    const aboutBtn = document.querySelector('#about_btn');
    const setData = await getData();

    // console.log(setData);

    renderAddress();
    renderPhones();
    renderAbout();
    renderSoc();

    photoBtn.addEventListener('click', editContPhot);
    addrBtn.addEventListener('click', editAddress);
    telBtn.addEventListener('click', editPhones);
    aboutBtn.addEventListener('click', editDesc);
    socBtn.addEventListener('click', editSoc);

    async function editContPhot() {


        const photMain = phoCon.files[0];
        const phot1 = photoCon1.files[0];
        const phot2 = photoCon2.files[0];
        const phot3 = photoCon3.files[0];
        const phot4 = photoCon4.files[0];

        let url = "/edit_cont_phot";
        const formData = new FormData();

        if (photMain) formData.append('photMain', photMain);
        if (phot1) formData.append('phot1', phot1);
        if (phot2) formData.append('phot2', phot2);
        if (phot3) formData.append('phot3', phot3);
        if (phot4) formData.append('phot4', phot4);

        if (!photMain && !phot1 && !phot2 && !phot3 && !phot4) {
            return alert('Выберите хотя бы один файл для замены');
        }


        const res = await fetch(url, {
            method: 'POST',
            // headers: { 'Content-Type': 'application/json' },
            body: formData,
            // body: JSON.stringify({ photMain, phot1, phot2, phot3, phot4 })
        });
        if (!res.ok) {
            const err = await res.json();
            return alert(err.error)
        }
        alert('Страница о нас изменена');
        window.location.reload();
    }

    function renderAddress() {
        addr1.value = setData.address1;
        addr2.value = setData.address2;
    }
    async function editAddress() {
        const addr1 = address1.value;
        const addr2 = address2.value;
        let url = "/edit_addr";
        const formData = new FormData();
        formData.append('addr1', addr1);
        formData.append('addr2', addr2);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addr1, addr2 })
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (res.ok) window.location.reload();
    }
    function renderPhones() {
        const p1 = setData.phones?.[0] || {};
        const p2 = setData.phones?.[1] || {};
        phoneInp1.value = p1.tel || '';
        viewInp1.value = p1.view || '';
        phoneInp2.value = p2.tel || '';
        viewInp2.value = p2.view || '';
    }
    async function editPhones() {
        const phones = [
            { tel: phoneInp1.value || '', view: viewInp1.value || '' },
            { tel: phoneInp2.value || '', view: viewInp2.value || '' }
        ];
        const res = await fetch('/edit_phones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phones })
        });
        const data = await res.json();
        alert(data.message || data.error);
        if (res.ok) window.location.reload();
    }
    async function editDesc() {
        const title = descTitleInp.value;
        const desc = descInp.value;
        const title2 = aboutTitle.value;
        const desc2 = aboutDesc.value;

        const photo1 = aboutImg1.files[0];
        const photo2 = aboutImg2.files[0];
        let url = "/edit_about";
        const formData = new FormData();
        formData.append('title1', title);
        formData.append('desc1', desc);
        formData.append('title2', title2);
        formData.append('desc2', desc2);
        if (photo1) formData.append('photo1', photo1);
        if (photo2) formData.append('photo2', photo2);
        const res = await fetch(url, {
            method: 'POST',
            // headers: { 'Content-Type': 'application/json' },
            body: formData,
            // body: JSON.stringify({ title, desc })
        });
        if (!res.ok) {
            const err = await res.json();
            return alert(err.error)
        }
        alert('Страница о нас изменена');
        window.location.reload();
    }
    function renderAbout() {
        descTitleInp.value = setData.title_top;
        descInp.value = setData.desc;
        aboutTitle.value = setData.about_title;
        aboutDesc.value = setData.about_desc;
    }
    async function editSoc() {
        const tg = tgInp.value;
        const wts = wtsInp.value;
        const max = maxInp.value;
        let url = "/edit_set";
        const formData = new FormData();
        formData.append('tg', tg);
        formData.append('wts', wts);
        formData.append('max', max);
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // body: formData
            body: JSON.stringify({ tg, wts, max })
        });
        // alert(res.json());
        const data = await res.json();
        alert(data.message || data.error);
        window.location.reload();
    }
    function renderSoc() {
        tgInp.value = setData.telegram;
        wtsInp.value = setData.wts;
        maxInp.value = setData.max;
    }
    async function getData() {
        const url = "/get_set";
        const response = await fetch(url);
        const setData = await response.json();
        return setData;
    }
})()

