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
  const safeTerm = () => {
    const term = search.value.trim().replace(/\s+/gu, ' ');
    if (/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(term) || /(?:\+?\d[\d\s().-]{6,}\d)/u.test(term)) return '(redacted)';
    return Array.from(term).slice(0, 60).join('');
  };
  const emit = (name, fields) => {
    if (typeof window.gtag === 'function') {
      try { window.gtag('event', name, { ...fields, language: document.documentElement.lang, transport_type: 'beacon' }); } catch (_) { /* Analytics must not affect browsing. */ }
    }
  };
  const reportFilter = (type, value) => emit('library_filter_apply', { filter_type: type, filter_value: value, result_count: cards.filter(card => !card.hidden).length });
  let timer;
  let lastSearch = '';
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
  search.addEventListener('input', () => {
    update();
    if (typeof clearTimeout === 'function') clearTimeout(timer);
    const report = () => {
      const term = safeTerm();
      if (term !== lastSearch) { lastSearch = term; reportFilter('search', term || '(empty)'); }
    };
    if (typeof setTimeout === 'function') timer = setTimeout(report, 800); else report();
  });
  cards.forEach(card => {
    const reportClick = event => {
      if (event.type === 'auxclick' && event.button !== 1) return;
      if (event.type === 'click' && event.button !== undefined && event.button !== 0) return;
      const position = cards.filter(item => !item.hidden).indexOf(card) + 1;
      if (!position || !card.dataset.songId) return;
      emit('library_song_click', { song_id: card.dataset.songId, position, filter_state: `cat=${category};diff=${difficulty?.value || 'all'};q=${safeTerm()}` });
    };
    card.addEventListener('click', reportClick);
    card.addEventListener('auxclick', reportClick);
  });
  buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.libraryFilter;update();reportFilter('category',category);}));
  difficulty?.addEventListener('change',()=>{
    window.history.replaceState(null,'',window.location.pathname+window.location.search+(difficulty.value==='all'?'':`#difficulty-${difficulty.value}`));
    update();reportFilter('difficulty',difficulty.value);
  });
  window.addEventListener('hashchange',()=>{readDifficulty();update();const level=window.location.hash.match(/^#difficulty-([1-4])$/)?.[1];if(level)reportFilter('deep_link',level);});
  document.getElementById('library-reset').addEventListener('click',()=>{
    if (typeof clearTimeout === 'function') clearTimeout(timer);
    lastSearch='';search.value='';category='all';
    if (difficulty) difficulty.value='all';
    window.history.replaceState(null,'',window.location.pathname+window.location.search);
    update();reportFilter('reset','all');search.focus();
  });
  update();
  const initialLevel=window.location.hash.match(/^#difficulty-([1-4])$/)?.[1];
  if(initialLevel)reportFilter('deep_link',initialLevel);
}
