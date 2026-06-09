// recommender.js — コードデータ・レコメンドロジック

const SUBS = {
  'I':      [{sub:'IIIm',type:'トニック代理',reason:'IとIIImはド・ミを共有。明るさはそのままに複雑さが増す'},{sub:'VIm',type:'トニック代理',reason:'IとVImはミ・ソを共有（最も一般的な代理）'}],
  'Im':     [{sub:'bVI',type:'トニック代理',reason:'ImとbVIはミb・ソを共有。暗さを保ちつつ色彩感が増す'},{sub:'bIII',type:'トニック代理',reason:'マイナーキーのIIIb代理。柔らかい解決感'}],
  'II':     [{sub:'IV',type:'サブドミナント代理',reason:'IIとIVはファ・ラを共有。より安定した響き'}],
  'IIm':    [{sub:'IV',type:'サブドミナント代理',reason:'IImとIVはファ・ラを共有。より安定した響き'}],
  'IIm7':   [{sub:'IVmaj7',type:'サブドミナント代理',reason:'共通トーン（ファ・ラ）で自然に入れ替え可能'}],
  'IV':     [{sub:'IIm',type:'サブドミナント代理',reason:'IVとIImはファ・ラを共有。よりジャジーな響きに'},{sub:'IIm7',type:'サブドミナント代理',reason:'7thを加えてさらに洗練された代理'}],
  'IVmaj7': [{sub:'IIm7',type:'サブドミナント代理',reason:'共通トーン（ファ・ラ）で自然に入れ替え可能'}],
  'V':      [{sub:'VIIm7b5',type:'ドミナント代理',reason:'VとVIIm7b5はシ・レ・ファを共有。テンション高め'},{sub:'bII7',type:'裏コード (tritone sub)',reason:'ルートが増4度離れた裏コード。半音解決で強烈'}],
  'V7':     [{sub:'bII7',type:'裏コード (tritone sub)',reason:'V7のトライトーン代理。ルート半音下降で解決'},{sub:'VIIm7b5',type:'ドミナント代理',reason:'VとVIIm7b5はガイドトーン（シ・ファ）を共有'}],
  'Imaj7':  [{sub:'IIIm7',type:'トニック代理',reason:'Imaj7とIIIm7はミ・ソ・シを共有。明るく流れる'}],
  'VIm':    [{sub:'I',type:'トニック代理',reason:'VImとIはド・ミを共有。解決感を出したい時に'}],
  'VIm7':   [{sub:'Imaj7',type:'トニック代理',reason:'VIm7とImaj7はミ・ソを共有。明るく解決'}],
  'bVII':   [{sub:'V',type:'ドミナント代理',reason:'モーダルなbVIIはクラシックなVの代わりに使える'},{sub:'bVII7',type:'ドミナント代理',reason:'7thを加えてよりファンキーなドミナント代理に'}],
  'bVII7':  [{sub:'V7',type:'ドミナント代理',reason:'bVII7をV7に戻すと機能和声的な解決感が強まる'}],
  'IIIm':   [{sub:'I',type:'トニック代理',reason:'IIImとIはド・ミを共有。より安定したトニックへ'}],
  'IIIm7':  [{sub:'Imaj7',type:'トニック代理',reason:'IIIm7とImaj7はミ・ソ・シを共有。明るく安定'}],
};

const DATA = {
  pop:[
    {id:'p1',name:'王道Jポップ',numerals:['I','V','VIm','IV'],desc:'最も使われる進行。明るく安定した感情',mood:'bright',songs:['Let It Go','Lemon','ドライフラワー'],bright:90,dark:10,emotional:60,note:''},
    {id:'p2',name:'小室進行',numerals:['VIm','IV','I','V'],desc:'90年代Jポップの定番。切なくドラマチック',mood:'emotional',songs:['Get Wild','Forever Love'],bright:40,dark:50,emotional:90,note:''},
    {id:'p3',name:'カノン進行',numerals:['I','V','VIm','IIIm','IV','I','IV','V'],desc:'バッハ由来の永遠の名進行',mood:'emotional',songs:['天城越え'],bright:60,dark:30,emotional:80,note:''},
    {id:'p4',name:'4536進行',numerals:['IV','V','IIIm','VIm'],desc:'サビに最適な盛り上がり系進行',mood:'bright',songs:['残酷な天使のテーゼ','ハナミズキ'],bright:80,dark:20,emotional:70,note:''},
    {id:'p5',name:'2516進行',numerals:['IIm','V','I','VIm'],desc:'ポップスの定番循環。流れるようなグルーヴ',mood:'bright',songs:['What a Wonderful World'],bright:75,dark:20,emotional:65,note:''},
  ],
  rock:[
    {id:'r1',name:'パワーコード進行',numerals:['I','IV','V','I'],desc:'シンプルで力強い。ロックの基本',mood:'bright',songs:['Johnny B. Goode'],bright:85,dark:20,emotional:40,note:''},
    {id:'r2',name:'12小節ブルース',numerals:['I','I','I','I','IV','IV','I','I','V','IV','I','V'],desc:'ブルースとロックの根幹',mood:'dark',songs:['Crossroads'],bright:30,dark:75,emotional:70,note:''},
    {id:'r3',name:'Vm進行',numerals:['Im','bVII','bVI','bVII'],desc:'ハードロック特有の重厚な響き',mood:'dark',songs:['Smoke on the Water'],bright:10,dark:95,emotional:60,note:''},
    {id:'r4',name:'グランジ進行',numerals:['I','bVII','IV','I'],desc:'オルタナ・グランジに多い切ない感じ',mood:'emotional',songs:['Come as You Are'],bright:35,dark:65,emotional:85,note:''},
    {id:'r5',name:'ロック循環',numerals:['I','VIm','IV','V'],desc:'ロックバラードの定番。骨太な安定感',mood:'emotional',songs:['Every Breath You Take'],bright:55,dark:40,emotional:78,note:''},
  ],
  jazz:[
    {id:'j1',name:'II-V-I',numerals:['IIm7','V7','Imaj7'],desc:'ジャズの基本。洗練された解決感',mood:'bright',songs:['Autumn Leaves','All The Things You Are'],bright:70,dark:30,emotional:50,note:''},
    {id:'j2',name:'ターンアラウンド',numerals:['Imaj7','VIm7','IIm7','V7'],desc:'循環進行。エンドレスに回り続ける',mood:'bright',songs:['Fly Me to the Moon'],bright:75,dark:25,emotional:45,note:''},
    {id:'j3',name:'マイナー II-V-I',numerals:['IIm7b5','V7','Im'],desc:'暗く複雑な感情を表現',mood:'dark',songs:['Solar'],bright:20,dark:80,emotional:65,note:''},
    {id:'j4',name:'コルトレーンチェンジ',numerals:['Imaj7','bIIImaj7','bVImaj7','Imaj7'],desc:'長3度のルート移動。神秘的な響き',mood:'emotional',songs:['Giant Steps'],bright:45,dark:55,emotional:90,note:''},
    {id:'j5',name:'リズムチェンジ',numerals:['I','VI7','IIm7','V7'],desc:'Gershwin由来。スウィング感あふれる循環',mood:'bright',songs:['I Got Rhythm','Oleo'],bright:80,dark:15,emotional:55,note:''},
  ],
  ballad:[
    {id:'b1',name:'感動バラード',numerals:['I','VIm','IV','V'],desc:'定番バラード進行。じんわり感動',mood:'emotional',songs:['First Love'],bright:50,dark:40,emotional:95,note:''},
    {id:'b2',name:'サビ前盛り上がり',numerals:['IIm','V7','Imaj7','IVmaj7'],desc:'サビへの自然な流れを作る',mood:'emotional',songs:['瞳をとじて'],bright:60,dark:35,emotional:88,note:''},
    {id:'b3',name:'マイナーバラード',numerals:['Im','bVII','bVI','V7'],desc:'悲しく美しい。演歌にも通じる',mood:'dark',songs:['糸'],bright:15,dark:85,emotional:90,note:''},
    {id:'b4',name:'ロマンティック進行',numerals:['Imaj7','IIIm7','IVmaj7','V7'],desc:'おしゃれで上品な大人の進行',mood:'emotional',songs:['Days of Wine and Roses'],bright:65,dark:35,emotional:75,note:''},
    {id:'b5',name:'サビのクライマックス',numerals:['IV','V','Im','bVI'],desc:'短調転換でドラマを生む。映画的な感動',mood:'dark',songs:['My Heart Will Go On'],bright:30,dark:65,emotional:95,note:''},
  ],
  anime:[
    {id:'a1',name:'アニソン王道',numerals:['VIm','IV','I','V'],desc:'疾走感と切なさを兼ね備えた定番',mood:'emotional',songs:['紅蓮華'],bright:55,dark:45,emotional:88,note:''},
    {id:'a2',name:'転調サビ進行',numerals:['I','V','VIm','IV'],desc:'サビで転調して感情を爆発させる',mood:'bright',songs:['残酷な天使のテーゼ'],bright:80,dark:20,emotional:92,note:''},
    {id:'a3',name:'ロッカバラード',numerals:['Im','bVII','bVI','IV','V'],desc:'エピックで壮大な感じ',mood:'emotional',songs:['紅蓮の弓矢'],bright:40,dark:60,emotional:90,note:''},
    {id:'a4',name:'スクールデイズ系',numerals:['I','IIIm','VIm','IV','V'],desc:'青春・学園ものに多い爽やか進行',mood:'bright',songs:['恋愛サーキュレーション'],bright:90,dark:10,emotional:65,note:''},
    {id:'a5',name:'ダーク・ファンタジー系',numerals:['Im','IV','bVII','Im'],desc:'戦記・ファンタジーアニメの重厚感',mood:'dark',songs:['進撃系BGM'],bright:20,dark:85,emotional:80,note:''},
  ],
  chill:[
    {id:'c1',name:'Lo-fiヒップホップ',numerals:['Imaj7','IIIm7','IVmaj7','V7'],desc:'メロウでリラックスした空気感',mood:'bright',songs:['lofi beats to study/relax to'],bright:65,dark:35,emotional:50,note:''},
    {id:'c2',name:'ネオソウル進行',numerals:['Im7','IVm7','bVII7','bIIImaj7'],desc:'豊かな色彩感のある進行',mood:'emotional',songs:['Brown Sugar'],bright:50,dark:50,emotional:80,note:''},
    {id:'c3',name:'Ambient浮遊感',numerals:['Imaj7','VIm7','IVmaj7','Vsus4'],desc:'宙に浮くような幻想的な響き',mood:'dark',songs:['Weightless - Marconi Union'],bright:40,dark:60,emotional:55,note:''},
    {id:'c4',name:'City Pop系',numerals:['IVmaj7','IIIm7','IIm7','V7'],desc:'80年代シティポップの洗練',mood:'bright',songs:['真夜中のドア','Plastic Love'],bright:75,dark:25,emotional:70,note:''},
    {id:'c5',name:'ドリーミー・チル',numerals:['Imaj7','VIm7','IIm7','IVmaj7'],desc:'夢と現実の境界を漂うような進行',mood:'emotional',songs:['波間にて'],bright:60,dark:40,emotional:75,note:''},
  ],
};

const SCALES = {
  'C':['C','Dm','Em','F','G','Am','Bdim'],
  'D':['D','Em','F#m','G','A','Bm','C#dim'],
  'E':['E','F#m','G#m','A','B','C#m','D#dim'],
  'F':['F','Gm','Am','Bb','C','Dm','Edim'],
  'G':['G','Am','Bm','C','D','Em','F#dim'],
  'A':['A','Bm','C#m','D','E','F#m','G#dim'],
  'Am':['Am','Bdim','C','Dm','Em','F','G'],
  'Em':['Em','F#dim','G','Am','Bm','C','D'],
  'Dm':['Dm','Edim','F','Gm','Am','Bb','C'],
};

function getChords(k) { return SCALES[k] || SCALES['C']; }

function resolveNumeral(n, chords) {
  const CR = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
  const NM = ['I','II','III','IV','V','VI','VII'];
  let s = n.trim();
  s = s.replace(/^(VII|VI|IV|V|III|II|I)(b)([^b]|$)/, (_, r, b, rest) => 'b' + r + rest);
  const flat = s.startsWith('b') || s.startsWith('♭');
  const sharp = s.startsWith('#');
  if (flat || sharp) s = s.replace(/^[b♭#]/, '');
  let roman = '', suffix = '';
  for (const r of ['VII','VI','IV','V','III','II','I']) {
    if (s.toUpperCase().startsWith(r)) { roman = r; suffix = s.slice(r.length); break; }
  }
  if (!roman) return n;
  const ridx = NM.indexOf(roman);
  if (ridx === -1) return n;
  const diatonic = chords[ridx] || n;
  let root = '', dquality = '';
  for (const r of ['C#','F#','G#','D#','A#','Bb','Eb','Ab','Db','Gb','C','D','E','F','G','A','B']) {
    if (diatonic.startsWith(r)) { root = r; dquality = diatonic.slice(r.length); break; }
  }
  if (!root) { root = diatonic; dquality = ''; }
  const ni = CR.indexOf(root);
  if (flat && ni !== -1) root = CR[(ni + 11) % 12];
  if (sharp && ni !== -1) root = CR[(ni + 1) % 12];
  const quality = suffix ? suffix : (flat || sharp ? '' : dquality);
  return root + quality;
}

function moodScore(p, mood) {
  if (mood === 'all') return Math.max(p.bright, p.dark, p.emotional);
  return p[mood] || 0;
}

function suggest(genre, key, mood, count) {
  const chords = getChords(key);
  let pool = DATA[genre] || [];
  let scored = pool.map(p => ({ ...p, score: moodScore(p, mood) })).sort((a, b) => b.score - a.score);
  let picked = [];
  if (mood === 'all') {
    const bm = { bright: [], dark: [], emotional: [] };
    scored.forEach(p => { bm[p.mood] && bm[p.mood].push(p); });
    const buckets = [bm.bright, bm.emotional, bm.dark, bm.emotional, bm.bright];
    const used = new Set();
    for (let i = 0; i < buckets.length && picked.length < count; i++) {
      const item = buckets[i].find(p => !used.has(p.id));
      if (item) { picked.push(item); used.add(item.id); }
    }
    scored.forEach(p => { if (picked.length < count && !used.has(p.id)) { picked.push(p); used.add(p.id); } });
  } else {
    picked = scored.slice(0, count);
  }
  // Resolve chords using the selected key
  return picked.map(p => ({
    ...p,
    resolvedChords: p.numerals.map(num => resolveNumeral(num, chords)),
  }));
}
