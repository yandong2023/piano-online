# Six language piano homes

The user supplied global keyword evidence on 2026-10-29. Country filters in that dataset were locked, so the supplied traffic, average volume and KD must not be presented as country-specific estimates. The shared Spanish/Portuguese spelling `piano virtual` is not evidence for Spanish-only demand. This implementation does not independently verify those figures or claim ranking gains.

| Priority | Language home | Main intent | Related phrasing used naturally |
| --- | --- | --- | --- |
| 1 | `/ru/` | пианино онлайн | фортепиано онлайн, виртуальное пианино, пианино на клавиатуре |
| 2 | `/fr/` | piano en ligne | piano virtuel, piano en ligne gratuit, clavier de piano virtuel |
| 3 | `/es/` | piano virtual online | piano online gratis, piano en línea, tocar piano online, piano virtual para PC |
| 4 | `/ja/` | オンラインピアノ | バーチャルピアノ, Webピアノ, ピアノ web, ピアノ ブラウザ |
| 5 | `/it/` | pianoforte online | pianoforte virtuale, piano virtuale, tastiera di pianoforte online |
| 6 | `/ko/` | 가상 피아노 | 가상피아노, 온라인 피아노, 웹피아노, 피아노 사이트 |

Each new home contains a usable piano, six named starter melodies, guided practice and results, recording/replay, original-format and WAV downloads, localized explanations and FAQs. The initial HTML and dynamic controls share one translation dictionary. Full song detail pages and tutorials remain in their existing languages; new home navigation explicitly identifies English destinations. No empty translated song URLs are created.

The existing `/`, `/en/` and `/zh-hant/` homes retain their URLs, titles and canonicals. All nine language homes share reciprocal hreflang, with English as x-default. New pages have self canonicals, Open Graph fields and matching WebApplication/FAQ JSON-LD. The sitemap grows from 359 to 365 URLs. The obsolete `/es` to English redirect is removed from Vercel and Netlify configuration; `/zh` remains a Chinese alias.

The language selector links to all nine homes and scrolls on small screens. No location-based redirects or country-specific URL variants are added. German, Portuguese, Vietnamese, Thai, Indonesian and Malay are outside this batch, following the supplied evidence boundary.

Validation: `npm test`, `npm run build`, and `tests/piano-locales-browser.py` against the built site. Browser evidence is local and ignored by Git. This work is isolated on `codex/six-language-piano`; pushing that branch may create a Vercel preview, but production remains on `main` until this change is merged.
