# 物件簿（Cloudflare Pages 版）

一個可以真正公開上線、後台密碼保護、影片可以正常內嵌播放的房屋刊登網站。

## 網址結構

- `/`　　　　　前台物件列表（公開，任何人都看得到，看不到任何後台入口）
- `/admin.html`　後台管理（需要密碼登入，才能新增／編輯／刪除物件）
- `/card.html`　數位名片（公開分享用）
  

前台跟後台是**完全不同的網址**，前台頁面裡沒有任何連結、按鈕會通到後台。

## 部署步驟（用 Cloudflare Pages 儀表板，不需要會寫程式）

1. 到 [Cloudflare Dashboard](https://dash.cloudflare.com)，左側選「Workers 和 Pages」→「建立應用程式」→「Pages」→「連接到 Git」，把這個專案的程式碼上傳到一個 GitHub repo，再連接部署。
   - 如果不想用 GitHub，也可以選「直接上傳」，把 `public` 資料夾內的檔案跟 `functions` 資料夾一起上傳（Cloudflare Pages 支援直接拖曳資料夾上傳）。
   - Build 設定：Framework 選 `None`，Build output directory 填 `public`。

2. 建立 KV 命名空間：
   - 左側選「儲存和資料庫」→「KV」→「建立命名空間」，取名例如 `property-listings`。
   - 回到你的 Pages 專案 →「設定」→「Functions」→「KV 命名空間繫結」，新增一筆：
     - 變數名稱：`LISTINGS_KV`
     - 選剛剛建立的命名空間

3. 建立 R2 儲存桶（放圖片跟影片用）：
   - 左側選「R2」→「建立儲存桶」，取名例如 `property-media`。
   - 回到 Pages 專案 →「設定」→「Functions」→「R2 儲存貯體繫結」，新增一筆：
     - 變數名稱：`LISTINGS_R2`
     - 選剛剛建立的儲存桶

4. 設定後台登入密碼：
   - Pages 專案 →「設定」→「環境變數」→ 新增一個 **Secret**（不要選一般變數）：
     - 名稱：`ADMIN_PASSWORD`
     - 值：你自己想的密碼（之後在 `/admin.html` 登入要用）

5.（選用）如果你有自己的網域，且想幫 R2 設定公開網域：
   - 在 R2 儲存桶設定自訂網域後，回到 Pages 環境變數新增：
     - 名稱：`R2_PUBLIC_BASE_URL`
     - 值：例如 `https://media.yourdomain.com`
   - 沒設定也沒關係，檔案一樣可以透過 `/r2/<檔名>` 正常顯示，只是網址比較長一點。

6. 儲存設定後，重新觸發一次部署（Pages 專案的「部署」頁面點「重試部署」），讓新的環境變數生效。

7. 部署完成後：
   - 打開 `https://你的專案.pages.dev` 應該會看到前台物件列表（一開始是空的）
   - 打開 `https://你的專案.pages.dev/admin.html`，輸入你設定的 `ADMIN_PASSWORD` 登入，開始新增物件

## 之後想接自己的網域

Pages 專案 →「自訂網域」→ 加入你的網域，設定好 DNS 之後，`/`、`/admin.html`、`/card.html` 都會自動套用新網域。

## 平常怎麼維護

- 新增/編輯/刪除物件、改店鋪資訊都在 `/admin.html` 做
- 建議定期點「匯出備份」，存一份 JSON 在自己電腦，資料多一層保障
- 影片建議優先貼 YouTube／TikTok 連結（免費、沒有大小限制、正常內嵌播放）；直接上傳影片檔案也可以，會存到 R2，上限抓 200MB（可依需求調整 `admin.html` 裡的 `MAX_VIDEO_BYTES`）

## 檔案結構

```
public/            靜態前端檔案（Pages 會直接發布這個資料夾）
  index.html        前台物件列表 + 詳情頁
  admin.html        後台管理（登入保護）
  card.html         數位名片
  common.css        共用樣式
  common.js         共用工具函式與 API 呼叫

functions/          Cloudflare Pages Functions（後端 API，跑在 Cloudflare 的伺服器上）
  api/
    login.js         登入
    logout.js        登出
    me.js            檢查登入狀態
    shop.js          店鋪設定（GET 公開／PUT 需登入）
    listings.js       物件列表（GET 公開／POST 新增需登入）
    listings/[id].js  單筆物件（PUT／DELETE 需登入）
    upload.js         圖片/影片上傳到 R2（需登入）
  r2/[key].js        沒設定自訂網域時，用來讀取 R2 檔案

wrangler.toml       專案設定檔（裡面有詳細的環境變數/綁定說明）
```

## 如果想用 wrangler 指令部署（進階，需要會用終端機）

```bash
npm install -g wrangler

wrangler login
wrangler pages project create my-property-site
wrangler pages deploy public --project-name=my-property-site
```

部署後一樣要照上面步驟 2-5，到 Cloudflare Dashboard 手動設定 KV / R2 綁定跟環境變數（這些帳號專屬的 ID 沒辦法寫死在程式碼裡）。
