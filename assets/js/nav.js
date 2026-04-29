'use strict';

document.querySelectorAll('a.btn').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const href = link.getAttribute('href');
    document.body.classList.add('page-exit');
    setTimeout(() => { window.location.href = href; }, 180);
  });
});
