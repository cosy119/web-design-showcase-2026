"""Edit works.json award values, then run this script to synchronize the gallery."""
from pathlib import Path
import json,re,html
root=Path(__file__).resolve().parents[1]
works=json.loads((root/'works.json').read_text(encoding='utf-8-sig'))
levels={'一等奖':'first','二等奖':'second','三等奖':'third','参与奖':'participation'}
for w in works:
 if w.get('award') not in [None,'',*levels]:raise ValueError(f"Invalid award for {w['id']}: {w.get('award')}")
 w['award']=w.get('award') or None
(root/'works.json').write_text(json.dumps(works,ensure_ascii=False,indent=2),encoding='utf-8')
p=root/'index.html';s=p.read_text(encoding='utf-8');counts={name:sum(w['award']==name for w in works) for name in levels}
buttons=f'<button data-filter="all" aria-pressed="true">全部 <span>{len(works)}</span></button>'+''.join(f'<button data-filter="{name}" aria-pressed="false">{name} <span>{counts[name]}</span></button>' for name in levels)
s=re.sub(r'<div class="filters".*?</div>(?=<label class="search">)',f'<div class="filters" role="group" aria-label="按奖项筛选">{buttons}</div>',s,count=1,flags=re.S)
def update_card(m):
 card=m.group(0);w=next((w for w in works if f'href="works/{w["id"]}/"' in card),None)
 if w is None:raise ValueError('Unknown work card')
 award=w['award'] or 'pending';label=w['award'] or '待评定';level=levels.get(award,'pending')
 card=re.sub(r' data-award="[^"]*"','',card);card=card.replace('<article class="work"',f'<article class="work" data-award="{award}"',1)
 search=' '.join([w['title'],w['author'],w['college'],w['className'],label]);card=re.sub(r'data-search="[^"]*"',f'data-search="{html.escape(search,quote=True)}"',card,count=1)
 card=re.sub(r'(<div class="work-meta">)<span[^>]*>.*?</span>',rf'\1<span class="award-label" data-level="{level}">{label}</span>',card,count=1,flags=re.S)
 return card
s=re.sub(r'<article class="work".*?</article>',update_card,s,flags=re.S)
s=re.sub(r'(<p id="result-count"[^>]*>).*?(</p>)',lambda m:m.group(1)+f'正在展示全部 {len(works)} 件作品'+m.group(2),s,count=1,flags=re.S)
p.write_text(s,encoding='utf-8')
print('Updated award categories:',counts,'Pending:',sum(w['award'] is None for w in works))
