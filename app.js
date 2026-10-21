(() => {
  const $ = (s) => document.querySelector(s);
  const state = { base: localStorage.getItem('shjhy_api') || '', snap: null };
  const api = (p, opt) => fetch((state.base || '') + p, Object.assign({ cache: 'no-store' }, opt));

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function num(v, d = 0) { const n = Number(v); return isFinite(n) ? n : d; }

  function switchPage(key) {
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + key));
    document.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === key));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function kpi(label, value, hint) {
    return `<div class="kpi"><span>${esc(label)}</span><b>${esc(value)}</b><span>${esc(hint || '')}</span></div>`;
  }

  function render() {
    const s = state.snap; if (!s) return;
    const w = s.weather || {}, cur = w.current || {}, fc = w.forecast || [], sun = w.sun || {};
    const dash = s.dashboard || {}, meta = s.meta || {}, photo = s.photo || {}, plan = photo.plan || {};
    $('#conn').textContent = '已连接';
    $('#conn').className = 'dot on';
    $('#home-sub').textContent = `${meta.location || ''} · 更新 ${s.updated || ''} · ${meta.data_source || ''}`;

    const k = dash.kpis || [];
    $('#kpis').innerHTML = [
      kpi('今日成交', k[0] ? '¥' + num(k[0].value).toLocaleString() : '—', meta.is_demo ? '待接入' : '实时'),
      kpi('今日入园', k[1] ? num(k[1].value).toLocaleString() + ' 人' : '—', '闸机口径'),
      kpi('当前天气', (cur.desc || '') + ' ' + num(cur.temp) + '°', '降雨 ' + num(fc[0] && fc[0].rain_prob) + '%'),
      kpi('预计到园', s.forecast ? '约 ' + num(s.forecast.visitors) + ' 人' : '—', '模型预估'),
    ].join('');

    const bloom = (s.bloom || [])[0];
    $('#glance').innerHTML = [
      ['黄金时段', plan.golden_pm || sun.golden || '—'],
      ['日落', sun.sunset || '—'],
      ['花期', bloom ? bloom.name + ' · ' + bloom.stage : '—'],
      ['群推送', '本页生成后复制'],
    ].map(([a, b]) => `<div><em>${esc(a)}</em><b>${esc(b)}</b></div>`).join('');

    const trend = dash.trend || [];
    const max = Math.max(1, ...trend.map(t => num(t.value)));
    $('#trend').innerHTML = trend.map(t => `<i style="height:${Math.max(6, num(t.value) / max * 130)}px"><em>${esc(t.day || '')}</em></i>`).join('') || '<p class="sub">暂无数据</p>';

    $('#weather-sub').textContent = `${cur.desc || ''} ${num(cur.temp)}℃ · 体感 ${num(cur.feels_like, cur.temp)}℃ · 湿度 ${num(cur.humidity)}%`;
    $('#weather-now').innerHTML = `<div class="grid kpis">${kpi('天气', cur.desc || '—', '')}${kpi('气温', num(cur.temp) + '°', '体感 ' + num(cur.feels_like, cur.temp) + '°')}${kpi('降雨概率', num(fc[0] && fc[0].rain_prob) + '%', '')}${kpi('日落', sun.sunset || '—', '日出 ' + (sun.sunrise || '—'))}</div>`;
    $('#weather-days').innerHTML = fc.map(d => `<div class="day">${esc(d.date || d.day || '')}<b>${num(d.tmax)}°</b>${esc(d.desc || '')}<br>雨 ${num(d.rain_prob)}%</div>`).join('');

    $('#photo-kpis').innerHTML = [
      kpi('火烧云', (plan.fire && plan.fire.score) || '—', (plan.fire && plan.fire.level) || ''),
      kpi('日出', plan.sunrise || '—', '日落 ' + (plan.sunset || '—')),
      kpi('黄金时段', plan.golden_pm || '—', '蓝调 ' + (plan.blue_pm || '—')),
      kpi('日落方位', (plan.sunset_azimuth || '—') + '°', '日出 ' + (plan.sunrise_azimuth || '—') + '°'),
    ].join('');
    const slots = (photo.day || []);
    $('#day-slots').innerHTML = slots.map(x => `<div class="slot"><b>${esc(x.label)} ${esc(x.time)}</b><span>太阳 ${num(x.az)}° / 高度 ${num(x.alt)}°</span><p>${esc(x.tip)}</p></div>`).join('') || '<p class="sub">暂无数据</p>';

    const blooms = s.bloom || [];
    $('#bloom-sub').textContent = '按日期与近 14 天积温自动修正';
    $('#bloom-list').innerHTML = blooms.map(b => `<article class="card"><h3>${esc(b.name)} · ${esc(b.stage)}</h3><p class="sub">${esc(b.text)}</p><p>${esc(b.note || '')}</p></article>`).join('') || '<p class="sub">暂无花期数据</p>';

    $('#push-preview').textContent = composePush();
  }

  function composePush() {
    const s = state.snap || {}, w = s.weather || {}, cur = w.current || {}, fc = w.forecast || [{}], sun = w.sun || {};
    const photo = s.photo || {}, plan = photo.plan || {}, bloom = (s.bloom || [])[0];
    const lines = ['🌼 水岸花野 · 今日游玩建议', `📅 ${new Date().toLocaleDateString('zh-CN')}`];
    lines.push(`⛅ 天气：${cur.desc || ''} ${num(cur.temp)}℃，降雨 ${num(fc[0] && fc[0].rain_prob)}%`);
    lines.push(`🌅 日出 ${sun.sunrise || '—'} · 日落 ${sun.sunset || '—'} · 黄金时段 ${plan.golden_pm || '—'}`);
    if (plan.fire) lines.push(`🔥 火烧云指数 ${plan.fire.score}（${plan.fire.level}）`);
    if (bloom) lines.push(`🌱 花期：${bloom.name} ${bloom.text}`);
    lines.push('📍 昭通市昭阳区守望回族乡甘河村 · 水岸花野');
    return lines.join('\n');
  }

  async function load() {
    try {
      const r = await api('/api/snapshot');
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || '接口错误');
      state.snap = j; render();
    } catch (e) {
      $('#conn').textContent = '未连接'; $('#conn').className = 'dot off';
      $('#home-sub').textContent = '无法连接数据服务：请在「连接设置」填入服务器地址（手机版/内网穿透）。' + (e.message || '');
    }
  }

  function addBubble(role, text) {
    const b = el('div', 'bubble ' + (role === 'me' ? 'me' : 'ai'), esc(text));
    $('#chat').appendChild(b); $('#chat').scrollTop = 1e6; return b;
  }

  async function ask(q) {
    if (!q.trim()) return;
    addBubble('me', q);
    const b = addBubble('ai', '正在思考…');
    try {
      const r = await api('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q }) });
      const j = await r.json();
      b.textContent = j.ok ? (j.answer || j.text || '') : ('失败：' + (j.error || ''));
    } catch (e) { b.textContent = '请求失败：' + e.message; }
  }

  async function photoAI() {
    $('#photo-out').textContent = '生成中…';
    try {
      const r = await api('/api/photo/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json();
      $('#photo-out').textContent = j.ok ? j.text : ('失败：' + (j.error || ''));
    } catch (e) { $('#photo-out').textContent = '请求失败：' + e.message; }
  }

  function bind() {
    document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => switchPage(b.dataset.page)));
    $('#refresh').addEventListener('click', load);
    $('#copy-push').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(composePush()); $('#copy-push').textContent = '已复制，去微信群粘贴'; }
      catch (e) { alert('复制失败，请手动选择文本复制'); }
    });
    $('#ask').addEventListener('click', () => { const q = $('#ask-input').value; $('#ask-input').value = ''; ask(q); });
    $('#ask-input').addEventListener('keydown', e => { if (e.key === 'Enter') { const q = e.target.value; e.target.value = ''; ask(q); } });
    $('#photo-ai').addEventListener('click', photoAI);
    $('#settings').addEventListener('click', () => { $('#api-base').value = state.base; $('#dlg').showModal(); });
    $('#dlg').addEventListener('close', () => {
      if ($('#dlg').returnValue === 'save') {
        state.base = $('#api-base').value.trim().replace(/\/$/, '');
        localStorage.setItem('shjhy_api', state.base);
        load();
      }
    });
  }

  bind(); load(); setInterval(load, 60000);
  switchPage(location.hash ? location.hash.slice(1) : 'home');
})();
