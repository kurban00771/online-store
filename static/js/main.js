const menuBtn = document.querySelector('.menu__btn');
const menuList = document.querySelector('.menu__list');

if (menuBtn && menuList) {
  menuBtn.addEventListener('click', () => {
    menuBtn.classList.toggle('menu__btn--active');
    menuList.classList.toggle('menu--active');
    document.body.classList.toggle('no-scroll');
  });

  menuList.querySelectorAll('.menu__link').forEach((link) => {
    link.addEventListener('click', () => {
      menuBtn.classList.remove('menu__btn--active');
      menuList.classList.remove('menu--active');
      document.body.classList.remove('no-scroll');
    });
  });
}

// 2. Логика модального окна


const prodList = document.querySelector('.main__list');
prodList.addEventListener('click', showModalProd);

const closeBtn = document.querySelector('#close-btn');
const overlay = document.querySelector('#modal-overlay');

const modalProd = overlay.querySelector('#prod_modal');
const prodName = overlay.querySelector('#prod_name');
const prodImage = overlay.querySelector('#prod_image');
const prodActive = overlay.querySelector('#prod_active');
const prodAdd = overlay.querySelector('#prod__add');





async function showModalProd(e) {
  const block = e.target.closest('.main__li');
  if (block) {
    let url = "/get_prod";
    let response = await fetch(url);
    let prodList = await response.json();
    
    const prod = prodList.find(el => el.id == block.id);
    prodName.value = prod.title;
    if (prod.active) prodActive.checked = true;
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