// Native details and real language links remain usable without JavaScript.
const menus = [...document.querySelectorAll('details.studio-lang')];
const closeMenu = (menu, restoreFocus = false) => {
  menu.open = false;
  if (restoreFocus) menu.querySelector('summary')?.focus();
};

for (const menu of menus) {
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      event.preventDefault();
      event.stopPropagation();
      closeMenu(menu, true);
      return;
    }
    const summary = menu.querySelector('summary');
    const links = [...menu.querySelectorAll('.studio-lang-option[href]')];
    if (!links.length) return;
    if (event.target === summary && event.key === 'ArrowDown') {
      event.preventDefault();
      menu.open = true;
      links[0].focus();
    } else if (menu.open && links.includes(event.target)) {
      const index = links.indexOf(event.target);
      const next = event.key === 'ArrowDown' ? (index + 1) % links.length
        : event.key === 'ArrowUp' ? (index + links.length - 1) % links.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : -1;
      if (next !== -1) {
        event.preventDefault();
        links[next].focus();
      }
    }
  });
}
for (const eventName of ['pointerdown', 'focusin']) {
  document.addEventListener(eventName, (event) => {
    for (const menu of menus) {
      if (menu.open && !menu.contains(event.target)) closeMenu(menu);
    }
  });
}
