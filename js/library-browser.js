// Progressively enhance the static, crawlable catalog; no network requests needed.
const search = document.getElementById('library-search');
if (search) {
  const english = document.documentElement.lang.startsWith('en');
  const buttons = [...document.querySelectorAll('[data-library-filter]')];
  const cards = [...document.querySelectorAll('.song-category-section .song-card')];
  let category = 'all';
  const normalized = (text) => text.normalize('NFKD').toLocaleLowerCase().replace(/\p{Diacritic}/gu, '').trim();
  const update = () => {
    const term=normalized(search.value); let count=0;
    for(const card of cards){
      const matches=(category==='all'||card.dataset.category===category)&&normalized(card.textContent+' '+(card.dataset.search||'')).includes(term);
      card.hidden=!matches; if(matches)count++;
    }
    document.querySelectorAll('.song-category-section').forEach(group=>{group.hidden=![...group.querySelectorAll('.song-card')].some(card=>!card.hidden);});
    document.getElementById('library-count').textContent=english?`${count} songs`:`${count} 首歌曲`;
    document.getElementById('library-empty').hidden=count>0;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.libraryFilter===category)));
  };
  search.addEventListener('input',update);
  buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.libraryFilter;update();}));
  document.getElementById('library-reset').addEventListener('click',()=>{search.value='';category='all';update();search.focus();});
  update();
}
