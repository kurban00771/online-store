// 1. ИМПОРТ БИБЛИОТЕК И ДАННЫХ
const express = require('express');
const app = express();
const hbs = require('hbs');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const multer = require('multer');
const bodyParser = require('body-parser');
const uep = bodyParser.urlencoded({ extended: false });
const aboutData = require('./db/about.json');
const catData = require('./db/categories.json');
const prodData = require('./db/products.json');
const { emitWarning } = require('process');

// 2. ПОДГОТОВКА ПАПКИ И MULTER ДЛЯ ЗАГРУЗКИ ФОТО

const catDir = path.join(__dirname, 'static', 'img', 'categories');
const prodDir = path.join(__dirname, 'static', 'img', 'products');
const aboutDir = path.join(__dirname, 'static', 'img', 'about');
const uploadCat = makeUpload(catDir);
const uploadAbout = makeUpload(aboutDir);
const uploadProd = makeUpload(prodDir);




// if (!fs.existsSync(catDir)) {
//     fs.mkdirSync(catDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, catDir);
//     },
//     filename: (req, file, cb) => {
//         const ext = path.extname(file.originalname).toLowerCase();
//         const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
//         cb(null, safeName);
//     }
// });



// const upload = multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: 5 * 1024 * 1024 } // 5 МБ
// });

// 3. СТАТИКА ИДЕТ САМОЙ ПЕРВОЙ (чтобы картинки отдавались мгновенно без сессий)
app.use(express.static(path.join(__dirname, 'static')));

// 4. ПАРСЕРЫ ТЕЛА ЗАПРОСА
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. СЕССИИ (подключаются только после статики)
app.use(session({
    store: new FileStore({
        path: path.join(__dirname, 'sessions'),
        ttl: 30 * 24 * 60 * 60,
        reapInterval: 24 * 60 * 60
    }),
    secret: process.env.SESSION_SECRET || '8f9d2a7b4c1e6f039a8b5d2c7e4f1a098b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// 6. НАСТРОЙКА ШАБЛОНИЗАТОРА HBS И ХЕЛПЕРОВ
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'));

hbs.registerHelper('getTitle', (t, option) => {
    const req = option.data.root.req;
    let id = req.query.id;
    let cat = catData.find(el => el.id == id);
    return cat ? cat.title : '';
});

hbs.registerHelper('getProducts', (t, option) => {
    const req = option.data.root.req;
    let id = req.query.id;
    let prods = prodData.filter(el => el.categorie == id);
    let html = '';
    if (!prods || prods.length === 0) {
        return new hbs.SafeString('<h2>Временно нет товаров</h2>');
    }
    const cat = catData.find(el => el.id == id);
    const catTitle = cat ? cat.title : '';

    for (let el of prods) {
        if (!el.active) continue;
        html += `
            <div class="products__card-inner" id="${el.id}">
                <img src="/img/products/${el.img}" alt="" class="products__card-img">
                <p class="products__cat">${catTitle}</p>
                <h3 class="products__card-name">${el.title}</h3>
                <p class="products__desc">${el.desc || ''}</p>
                <div class="products__card-bottom">
                    <p class="products__price">${el.price}р</p>
                    <div class="products__count">
                        <button class="products__minus-btn">-</button>
                        <input type="text" class="products__count-input" readonly placeholder="1">
                        <button class="products__plus-btn">+</button>
                    </div>
                    <a href="#" class="products__basket">
                        <img src="/img/cart.svg" alt="Корзина">
                    </a>
                </div>
            </div>
        `;
    }
    return new hbs.SafeString(html);
});

// 7. MIDDLEWARE И ПРОВЕРКА АВТОРИЗАЦИИ
app.use((req, res, next) => {
    res.locals.req = req;
    res.locals.activeNav = {
        cat: req.path.startsWith('/admin/categories'),
        prod: req.path.startsWith('/admin/products'),
        set: req.path.startsWith('/admin/settings'),
    };
    next();
});

function requireAuth(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    if (req.method === 'GET') return res.redirect('/admin/auth');
    res.status(401).json({ error: 'Требуется авторизация' });
}

// 8. МАРШРУТЫ (РОУТЫ)
app.post('/edit_cont_phot', requireAuth, uploadAbout.fields([
    { name: 'photMain', maxCount: 1 },
    { name: 'phot1', maxCount: 1 },
    { name: 'phot2', maxCount: 1 },
    { name: 'phot3', maxCount: 1 },
    { name: 'phot4', maxCount: 1 }
]), editContPhot);
app.post('/edit_addr', requireAuth, editAddr);
app.post('/edit_about', requireAuth, uploadAbout.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 }
]), editAbout);
app.post('/edit_prod', requireAuth, uploadProd.single('photo'), editProd);
app.post('/add_prod', requireAuth, uploadProd.single('photo'), addProd);
app.post('/edit_cat', requireAuth, uploadCat.single('photo'), editCat);
app.post('/add_cat', requireAuth, uploadCat.single('photo'), addCat);
app.post('/edit_phones', requireAuth, editPhones);
app.post('/edit_set', requireAuth, editSet);
// app.post('/edit_set', uep, editSet);
app.get('/get_set', requireAuth, getSet);
app.get('/get_prod', requireAuth, getProd);
app.get('/get_cat', requireAuth, getCat);
app.post('/check_auth', checkAuth);

app.use('/admin/auth', auth);
app.use('/admin', requireAuth);
app.use('/admin/settings', adminSet);
app.use('/admin/products', adminProd);
app.use('/admin/categories', adminCat);

app.use('/category', category);
app.use('/contact', contact);
app.use('/about', about);
app.use('/', index);
app.use(catchError);

// 9. ФУНКЦИИ-ОБРАБОТЧИКИ

function removeFile(filePath) {
    if (!filePath) return;
    fs.unlink(filePath, err => {
        if (err) console.error(err);
    });
}

function catchError(err, req, res, next) {
    console.error(err);
    if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Файл больше 5 МБ' })
    } else {
        res.status(400).json({ error: err.message })
    }
}

function makeUpload(dir) {
    const fileFilter = (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Разрешены только изображения!'), false);
        }
    };

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            const safeName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
            cb(null, safeName);
        }
    });

    return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

function editContPhot(req, res) {
    const photMain = req.files?.photMain?.[0]?.filename || null;
    const phot1 = req.files?.phot1?.[0]?.filename || null;
    const phot2 = req.files?.phot2?.[0]?.filename || null;
    const phot3 = req.files?.phot3?.[0]?.filename || null;
    const phot4 = req.files?.phot4?.[0]?.filename || null;

    const oldImg1 = aboutData.img_bg;
    const oldImg2 = aboutData.cont_img1;
    const oldImg3 = aboutData.cont_img2;
    const oldImg4 = aboutData.cont_img3;
    const oldImg5 = aboutData.cont_img4;

    if (photMain) aboutData.img_bg = photMain;
    if (phot1) aboutData.cont_img1 = phot1;
    if (phot2) aboutData.cont_img2 = phot2;
    if (phot3) aboutData.cont_img3 = phot3;
    if (phot4) aboutData.cont_img4 = phot4;


    // Сначала пишем в JSON, потом отправляем ответ клиенту
    fs.writeFileSync(path.join(__dirname, 'db', 'about.json'), JSON.stringify(aboutData, null, 2));

    if (photMain && oldImg1) removeFile(path.join(aboutDir, oldImg1));
    if (phot1 && oldImg2) removeFile(path.join(aboutDir, oldImg2));
    if (phot2 && oldImg3) removeFile(path.join(aboutDir, oldImg3));
    if (phot3 && oldImg4) removeFile(path.join(aboutDir, oldImg4));
    if (phot4 && oldImg5) removeFile(path.join(aboutDir, oldImg5));


    res.json({ message: 'Фотографии успешно загружены' });
}

function editAddr(req, res) {
    const addr1 = req.body.addr1;
    const addr2 = req.body.addr2;

    aboutData.address1 = addr1;
    aboutData.address2 = addr2;


    fs.writeFileSync(path.join(__dirname, 'db', 'about.json'), JSON.stringify(aboutData, null, 2));

    res.json({ message: 'Страница «О нас» изменена' });
}

function editAbout(req, res) {
    // const { title1, title2, desc1, desc2 } = req.body;
    const title1 = req.body.title1;
    const title2 = req.body.title2;
    const desc1 = req.body.desc1;
    const desc2 = req.body.desc2;

    const photo1 = req.files?.photo1?.[0]?.filename || null;
    const photo2 = req.files?.photo2?.[0]?.filename || null;

    const oldImg1 = aboutData.about_img1;
    const oldImg2 = aboutData.about_img2;

    aboutData.title_top = title1;
    aboutData.desc = desc1;
    aboutData.about_title = title2;
    aboutData.about_desc = desc2;

    if (photo1) aboutData.about_img1 = photo1;
    if (photo2) aboutData.about_img2 = photo2;

    fs.writeFileSync(path.join(__dirname, 'db', 'about.json'), JSON.stringify(aboutData, null, 2));

    if (photo1 && oldImg1) removeFile(path.join(aboutDir, oldImg1));
    if (photo2 && oldImg2) removeFile(path.join(aboutDir, oldImg2));

    res.json({ message: 'Страница «О нас» изменена' });
}

function editProd(req, res) {
    const name = req.body.name;
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price <= 0) {
        removeFile(req.file?.path);
        return res.status(400).json({ error: 'Введите положительное число' })
    }
    const desc = req.body.desc;
    const categorie = Number(req.body.categorie);
    const photoName = req.file ? req.file.filename : null;
    const active = req.body.active;
    const id = req.body.id;
    const prod = prodData.find(el => el.id == id);


    if (!prod) {
        removeFile(req.file?.path);
        return res.status(404).json({ error: 'Товар не найден' });
    }
    const oldImg = prod.img;


    prod.title = name;
    prod.price = price;
    prod.desc = desc;
    prod.categorie = categorie;
    if (photoName) prod.img = photoName;

    prod.active = (active == 'false') ? false : true;

    // prodData.map(el => {
    //     if (el.id == id) {
    //         return prod;
    //     }
    // })


    // Сначала пишем в JSON, потом отправляем ответ клиенту
    fs.writeFileSync(path.join(__dirname, 'db', 'products.json'), JSON.stringify(prodData, null, 2));

    if (photoName && oldImg) removeFile(path.join(prodDir, oldImg));



    res.json({
        message: 'Файл успешно загружен',
        // filename: req.file.filename,
        // path: req.file.path,
        // size: req.file.size
    });
}

function addProd(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'Выберите фото' });
    }

    const name = req.body.name;
    const price = Number(req.body.price);
    if (!Number.isFinite(price) || price <= 0) {
        removeFile(req.file?.path);
        return res.status(400).json({ error: 'Введите положительное число' })
    }
    const desc = req.body.desc;
    const categorie = Number(req.body.categorie);
    const photoName = req.file.filename;
    const catFound = catData.find(el => el.id == categorie);

    if (!catFound) {
        removeFile(req.file?.path);
        return res.status(400).json({ error: 'Выберите категорию' });
    }

    let id = prodData.at(-1)?.id || 0;
    id++;

    prodData.push({ id, title: name, img: photoName, active: true, desc, price, categorie });

    // Сначала пишем в JSON, потом отправляем ответ клиенту
    fs.writeFileSync(path.join(__dirname, 'db', 'products.json'), JSON.stringify(prodData, null, 2));

    res.json({
        message: 'Файл успешно загружен',
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
    });
}

function editCat(req, res) {
    // if (!req.file) {
    //     return res.status(400).json({ error: 'Файл не был загружен' });
    // }

    const name = req.body.name;
    const photoName = req.file ? req.file.filename : null;

    const active = req.body.active;
    const id = req.body.id;

    const cat = catData.find(el => el.id == id);

    if (!cat) {
        removeFile(req.file?.path);
        return res.status(404).json({ error: 'Категория не найдена' });
    }
    const oldImg = cat.img;


    cat.title = name;
    if (photoName) cat.img = photoName;

    cat.active = (active == 'false') ? false : true;

    // catData.map(el => {
    //     if (el.id == id) {
    //         return cat;
    //     }
    // })


    // Сначала пишем в JSON, потом отправляем ответ клиенту
    fs.writeFileSync(path.join(__dirname, 'db', 'categories.json'), JSON.stringify(catData, null, 2));

    if (photoName && oldImg) removeFile(path.join(catDir, oldImg));

    res.json({
        message: 'Файл успешно загружен',
        // filename: req.file.filename,
        // path: req.file.path,
        // size: req.file.size
    });
}

function addCat(req, res) {
    if (!req.file) {
        return res.status(400).json({ error: 'Выберите фото' });
    }

    // if (!req.file) {
    //     return res.status(400).json({ error: 'Файл не был загружен' });
    // }

    const name = req.body.name;
    const photoName = req.file.filename;

    let id = catData.at(-1)?.id || 0;
    id++;

    catData.push({ id, title: name, img: photoName, active: true });

    // Сначала пишем в JSON, потом отправляем ответ клиенту
    fs.writeFileSync(path.join(__dirname, 'db', 'categories.json'), JSON.stringify(catData, null, 2));

    res.json({
        message: 'Файл успешно загружен',
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size
    });
}

function editPhones(req, res) {
    const phones = req.body.phones;
    if (!Array.isArray(phones)) {
        return res.status(400).json({ error: 'Некорректные данные' });
    }
    const cleanPhones = phones.map(item => {
        const tel = String(item.tel || '').replace(/[^\d+]/g, '');
        const view = String(item.view || '').trim();
        return {
            tel,
            view: view || tel
        };
    })
    // .filter(item => item.tel);

    aboutData.phones = cleanPhones;

    fs.writeFileSync(path.join(__dirname, 'db', 'about.json'), JSON.stringify(aboutData, null, 2));

    res.json({ message: 'Телефоны изменены' });
}

function editSet(req, res) {
    // console.log(req.body);
    const tg = req.body.tg;
    const wts = req.body.wts;
    const max = req.body.max;

    // const title = req.body.title;
    // const desc = req.body.desc;

    aboutData.telegram = tg;
    aboutData.wts = wts;
    aboutData.max = max;

    // aboutData.title_top = title;
    // aboutData.desc = desc;

    // Сначала пишем в JSON, потом отправляем ответ клиенту
    fs.writeFileSync(path.join(__dirname, 'db', 'about.json'), JSON.stringify(aboutData));

    res.json({
        message: 'Настройки изменены',
    });
}

function getSet(req, res) {
    res.json(aboutData);
}

function getProd(req, res) {
    res.json(prodData);
}

function getCat(req, res) {
    res.json(catData);
}

async function checkAuth(req, res) {
    const { login, pass, remember } = req.body;
    const { login: loginTrue, passwordHash } = aboutData.auth;

    const passOk = await bcrypt.compare(String(pass ?? ''), passwordHash);

    if (login === loginTrue && passOk) {
        req.session.isAdmin = true;
        if (remember) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        res.send('Успешно');
    } else {
        res.status(401).send('Неверно');
    }
}

function adminSet(req, res) {
    res.render('admin_set.hbs');
}

function adminProd(req, res) {
    res.render('admin_prod.hbs', { aboutData, catData, prodData });
}

function adminCat(req, res) {
    res.render('admin_cat.hbs');
}

function auth(req, res) {
    res.render('auth.hbs');
}

function category(req, res) {
    res.render('category.hbs', { aboutData, catData, prodData });
}

function contact(req, res) {
    res.render('contact.hbs', { aboutData, catData, prodData });
}

function about(req, res) {
    res.render('about.hbs', { aboutData, catData, prodData });
}

function index(req, res) {
    res.render('index.hbs', { aboutData, catData, prodData });
}

function listen() {
    console.log('Servak sluhaet');
}

// 10. ЗАПУСК СЕРВЕРА СТРОГО В САМОМ КОНЦЕ ФАЙЛА
app.listen(3000, listen);
