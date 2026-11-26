const inpLogin = document.querySelector('#login');
const inpPass = document.querySelector('#password');
const inpMemento = document.querySelector('#memento');
const btn = document.querySelector('#btn');

inpLogin.value = localStorage.getItem('login') || '';

btn.addEventListener('click', async () => {
    const login = inpLogin.value.trim();
    const pass = inpPass.value.trim();
    const remember = inpMemento.checked;

    if (login === '' || pass === '') {
        alert('Введите логин и пароль');
        return;
    }

    const response = await fetch('/check_auth', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, pass, remember })
    });

    const answer = await response.text();
    if (answer !== 'Успешно') {
        alert(answer);
        return;
    }

    window.location.href = '/admin/categories';
});