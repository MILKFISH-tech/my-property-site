window.PB = (function () {
  var STATUS_LABEL = { sale: '售', rent: '租', done: '已成交' };
  var STATUS_CLASS = { sale: 'pb-status-sale', rent: 'pb-status-rent', done: 'pb-status-done' };

  var PLAY_ICON = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>';

  var ICONS = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>',
    line: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
    social: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'
  };

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtPrice(n) {
    if (n === '' || n === null || n === undefined) return '未填寫';
    var num = Number(n);
    if (isNaN(num)) return escapeHtml(String(n));
    return num.toLocaleString('zh-TW') + ' 萬';
  }

  function telHref(v) { return 'tel:' + (v || '').replace(/[^0-9+]/g, ''); }
  function lineHref(v) {
    v = (v || '').trim();
    if (/^https?:\/\//i.test(v)) return v;
    return 'https://line.me/ti/p/' + encodeURIComponent(v);
  }
  function socialHref(v) {
    v = (v || '').trim();
    if (/^https?:\/\//i.test(v)) return v;
    return 'https://' + v;
  }

  function youtubeEmbedUrl(url) {
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
    return m ? 'https://www.youtube.com/embed/' + m[1] : null;
  }
  function tiktokEmbedUrl(url) {
    var m = url.match(/tiktok\.com\/@[\w.\-]+\/video\/(\d+)/);
    return m ? 'https://www.tiktok.com/embed/v2/' + m[1] : null;
  }
  function isTiktokShortLink(url) { return /(vm|vt)\.tiktok\.com\//i.test(url); }

  function buildMedia(l) {
    var media = [];
    if (l.video) {
      media.push({ type: 'video-file', src: l.video });
    } else if (l.videoUrl) {
      var yt = youtubeEmbedUrl(l.videoUrl);
      var tk = !yt ? tiktokEmbedUrl(l.videoUrl) : null;
      if (yt) media.push({ type: 'youtube', src: yt, link: l.videoUrl });
      else if (tk) media.push({ type: 'tiktok', src: tk, link: l.videoUrl });
      else if (isTiktokShortLink(l.videoUrl)) media.push({ type: 'tiktok-short', src: l.videoUrl, link: l.videoUrl });
      else media.push({ type: 'video-link', src: l.videoUrl, link: l.videoUrl });
    }
    (l.images || []).forEach(function (src) { media.push({ type: 'image', src: src }); });
    return media;
  }

  async function api(path, options) {
    options = options || {};
    var res = await fetch(path, Object.assign({ credentials: 'same-origin' }, options));
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      var err = new Error((data && data.error) || ('請求失敗（' + res.status + '）'));
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function apiGet(path) { return api(path); }
  function apiPost(path, body) {
    return api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  function apiPut(path, body) {
    return api(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }
  function apiDelete(path) { return api(path, { method: 'DELETE' }); }

  async function apiUpload(file) {
    var form = new FormData();
    form.append('file', file);
    var res = await fetch('/api/upload', { method: 'POST', credentials: 'same-origin', body: form });
    var data = null;
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) {
      var err = new Error((data && data.error) || '上傳失敗');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  return {
    STATUS_LABEL: STATUS_LABEL,
    STATUS_CLASS: STATUS_CLASS,
    PLAY_ICON: PLAY_ICON,
    ICONS: ICONS,
    escapeHtml: escapeHtml,
    fmtPrice: fmtPrice,
    telHref: telHref,
    lineHref: lineHref,
    socialHref: socialHref,
    youtubeEmbedUrl: youtubeEmbedUrl,
    tiktokEmbedUrl: tiktokEmbedUrl,
    isTiktokShortLink: isTiktokShortLink,
    buildMedia: buildMedia,
    apiGet: apiGet,
    apiPost: apiPost,
    apiPut: apiPut,
    apiDelete: apiDelete,
    apiUpload: apiUpload
  };
})();
