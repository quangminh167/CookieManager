document.getElementById('export').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  
  const cookies = await chrome.cookies.getAll({ domain: url.hostname });
  document.getElementById('cookieData').value = JSON.stringify(cookies, null, 2);
  document.getElementById('status').innerText = `Đã Export ${cookies.length} cookies.`;
});

document.getElementById('import').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.innerText = "Đang xử lý...";
  
  let cookies;
  try {
    cookies = JSON.parse(document.getElementById('cookieData').value);
  } catch (e) {
    status.innerText = "Lỗi: JSON bị sai cấu trúc thực sự!";
    return;
  }

  let count = 0;
  let errors = 0;

  for (let cookie of cookies) {
    try {
      // Dọn dẹp domain để tạo URL chuẩn cho Chrome API
      let cleanDomain = cookie.domain;
      if (cleanDomain.startsWith('.')) {
        cleanDomain = cleanDomain.substring(1);
      }
      let cookieUrl = (cookie.secure ? "https://" : "http://") + cleanDomain + cookie.path;

      const newCookie = {
        url: cookieUrl,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite
      };

      // QUAN TRỌNG: Chỉ set domain nếu nó không phải là hostOnly
      if (!cookie.hostOnly) {
        newCookie.domain = cookie.domain;
      }

      // QUAN TRỌNG: Không set expirationDate cho session cookie
      if (!cookie.session && cookie.expirationDate) {
        newCookie.expirationDate = cookie.expirationDate;
      }

      await chrome.cookies.set(newCookie);
      count++;
    } catch (err) {
      console.error(`Lỗi import cookie [${cookie.name}]:`, err);
      errors++;
    }
  }
  
  status.innerText = `Xong! Import thành công: ${count} | Lỗi: ${errors}. (Hãy F5 lại trang web)`;
});