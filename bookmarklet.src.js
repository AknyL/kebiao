/* 书签小工具源码（可读版，便于以后维护）
 * 用法：在 kxjs.wmu.edu.cn 的「学生课表」页面点书签，脚本用你当前登录态
 * 调用 /api/schedules/getCouseInfo，聚合成与 App 分享码一致的格式，
 * 再把 https://aknyl.github.io/kebiao/#s=<code> 复制到剪贴板。
 */
javascript: (async () => {
  try {
    if (!/(^|\.)kxjs\.wmu\.edu\.cn$/i.test(location.hostname)) {
      throw new Error('这个书签要在教务系统页面点（kxjs.wmu.edu.cn），不能在空白页点');
    }
    const N = new Date(), Y = N.getFullYear(), M = N.getMonth() + 1;
    const AY = M >= 8 ? Y : Y - 1;
    const u = '/api/schedules/getCouseInfo?startDate=' + AY + '-09-01&endDate=' + (AY + 1) + '-01-31&idszh=';
    const r = await fetch(u, { credentials: 'include' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    const find = (o, d) => {
      d = d || 0;
      if (d > 5 || !o || typeof o !== 'object') return null;
      if (Array.isArray(o)) return (o.length && o[0] && typeof o[0] === 'object' && 'courseName' in o[0]) ? o : null;
      for (const k in o) { const x = find(o[k], d + 1); if (x) return x; }
      return null;
    };
    const list = find(j);
    if (!list || !list.length) throw new Error('接口里没有课表数据');
    const wd = ds => { const x = new Date(String(ds).slice(0, 10).replace(/-/g, '/')).getDay(); return x === 0 ? 7 : x; };
    const pr = t => { const a = String(t || '').match(/\d+/g) || []; const p = Number(a[0]) || 1; return [p, Number(a[1]) || p]; };
    const hm = t => { const m = String(t || '').match(/(\d{1,2}):(\d{2})/); return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : ''; };
    const mp = {}, ord = [];
    list.forEach(c => {
      if (!c || !c.courseName || !c.date) return;
      const p = pr(c.jcmc);
      const k = [c.courseName, wd(c.date), p[0], p[1], hm(c.startTime), hm(c.endTime)].join('|');
      if (!mp[k]) {
        mp[k] = { n: c.courseName, d: wd(c.date), a: p[0], b: p[1], s: hm(c.startTime), e: hm(c.endTime), r: c.location || '', h: c.teacherName || '', w: {} };
        ord.push(k);
      }
      const w = parseInt(String(c.weekNumber || '').replace(/\D/g, ''), 10);
      if (w > 0 && w < 30) mp[k].w[w] = 1;
    });
    const wks = o => {
      const a = Object.keys(o).map(Number).sort((x, y) => x - y), out = [];
      for (const n of a) { const l = out[out.length - 1]; if (l && n === l[1] + 1) l[1] = n; else out.push([n, n]); }
      return out.map(r => r[0] === r[1] ? String(r[0]) : r[0] + '-' + r[1]).join(',');
    };
    const arr = ord.map(k => {
      const o = mp[k], x = { n: o.n, d: o.d, a: o.a, b: o.b };
      if (o.s) x.s = o.s;
      if (o.e) x.e = o.e;
      if (o.r) x.r = o.r;
      if (o.h) x.h = o.h;
      const w = wks(o.w); if (w) x.w = w;
      return x;
    });
    const u8 = new TextEncoder().encode(JSON.stringify(arr));
    let bin = '';
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    const code = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const url = 'https://aknyl.github.io/kebiao/#s=' + code;
    if (confirm('读到 ' + arr.length + ' 门课。\n\n点「确定」：现在打开课表页导入\n点「取消」：只把链接复制到剪贴板')) {
      location.href = url;
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('链接已复制，粘到浏览器地址栏打开即可导入。');
      } catch (e) {
        prompt('长按全选复制下面这条链接：', url);
      }
    }
  } catch (e) {
    alert('没读到课表：' + (e && e.message ? e.message : e) + '\n\n请先登录教务系统并打开「学生课表」页面，再点这个书签。');
  }
})();
