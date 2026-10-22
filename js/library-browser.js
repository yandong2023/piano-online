// Progressively enhance the static, crawlable catalog; no network requests needed.
const search = document.getElementById('library-search');
if (search) {
  const english = document.documentElement.lang.startsWith('en');
  const buttons = [...document.querySelectorAll('[data-library-filter]')];
  const cards = [...document.querySelectorAll('.song-category-section .song-card')];
  const difficulty = document.getElementById('library-difficulty');
  const readDifficulty = () => {
    const level = window.location.hash.match(/^#difficulty-([1-4])$/)?.[1];
    if (difficulty) difficulty.value = level || 'all';
  };
  readDifficulty();
  let category = 'all';
  const normalized = (text) => text.normalize('NFKD').toLocaleLowerCase().replace(/\p{Diacritic}/gu, '').trim();
  const update = () => {
    const term=normalized(search.value); let count=0;
    for(const card of cards){
      const matches=(category==='all'||card.dataset.category===category)&&(!difficulty||difficulty.value==='all'||card.dataset.difficulty===difficulty.value)&&normalized(card.textContent+' '+(card.dataset.search||'')).includes(term);
      card.hidden=!matches; if(matches)count++;
    }
    document.querySelectorAll('.song-category-section').forEach(group=>{
      const visibleCount=[...group.querySelectorAll('.song-card')].filter(card=>!card.hidden).length;
      group.hidden=visibleCount===0;
      if(visibleCount)group.querySelector('.song-category-heading > span').textContent=english?`${visibleCount} songs`:`${visibleCount} 首`;
    });
    document.getElementById('library-count').textContent=english?`${count} songs`:`${count} 首歌曲`;
    document.getElementById('library-empty').hidden=count>0;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.libraryFilter===category)));
  };
  search.addEventListener('input',update);
  buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.libraryFilter;update();}));
  difficulty?.addEventListener('change',()=>{
    window.history.replaceState(null,'',window.location.pathname+window.location.search+(difficulty.value==='all'?'':`#difficulty-${difficulty.value}`));
    update();
  });
  window.addEventListener('hashchange',()=>{readDifficulty();update();});
  document.getElementById('library-reset').addEventListener('click',()=>{
    search.value='';category='all';
    if (difficulty) difficulty.value='all';
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
    update();search.focus();
  });
  update();
}
