# 三界共語 Interspecies Dialogue · 展示版 SHOWCASE

《三界共語》（Interspecies Dialogue）網站的展示版：即時著色器、隨聲音反應的畫面與捲動敘事。內容與極簡版相同，說法不同。

## 結構

```
index.html          單頁網站
css/style.css       樣式（色票沿用《單向讀取》回應頁）
js/main.js          載入、首屏氣孔場、捲動敘事、章節撕裂轉場、游標、播放器
js/field.js         全螢幕 WebGL 氣孔場（手寫著色器，Voronoi 表皮 + 保衛細胞）
js/audio.js         單一音訊元素 + Web Audio AnalyserNode
js/sections.js      顯微鏡捲動、影像膠卷、雙投影牆、魔幻收錄區、時辰錶盤、只讀一次的信
js/sculpture.js     精選 200 段紀錄的三維資料雕塑（three.js，instanced）
js/ridge.js         55 段開口標註的呼吸山脊線（three.js）
js/deck.js          聲音視覺化（頻譜地形 + 頻譜氣孔）與曲目
js/carousel.js      AIGC 動畫的 WebGL 拖曳輪播
data/               公開資料（experiments / annotations，CSV 與 JSON）與網站用的 site.json
assets/             影像、聲音與圖片（皆已移除中繼資料）
```

外部函式庫只從固定版本的 CDN 載入：three@0.160.0（jsdelivr）、gsap 3.12.5 + ScrollTrigger（cdnjs）、lenis 1.1.13（jsdelivr）、Google Fonts。

## 發佈到 GitHub Pages

1. 把整個資料夾推到一個 repository 的根目錄。
2. Settings → Pages → Source 選 `main` 分支的 `/ (root)`。
3. 所有路徑都是相對路徑，放在 `https://<帳號>.github.io/<repository>/` 底下即可運作；`.nojekyll` 已附上。

## 網址與分享預覽圖

- **網址**：本站 https://handcollab.github.io/interspecies-dialogue-showcase/ ；極簡版 https://handcollab.github.io/interspecies-dialogue/
- **分享預覽圖**：`og:image`、`og:url` 與 `twitter:image` 已寫成上面本站網址的完整路徑；repository 改名或換網域時要一起改。

## 無障礙與效能

- `prefers-reduced-motion`：關閉平滑捲動、釘選捲動與動畫，氣孔場改為每章一張靜態畫面，影片改為點擊播放。
- 不支援 WebGL 時，首屏改用靜態顯微照片；3D 圖表會顯示說明文字，資料仍可下載。
- 氣孔場依實際幀時間自動調整解析度；被不透明區塊蓋住時停止繪製。
- 影片一律延遲載入，進入視窗才播放、離開即暫停。
- 封面圖、3D 場景（資料雕塑、標註山脊線、聲音視覺化、AIGC 輪播）與 three.js 都在接近視窗時才載入；字型以不阻擋首屏的方式載入。

## 隱私

實驗影像、聲音與實驗紀錄不呈現參與者的面孔、身體與聲音；製作名單依官方 Credit List 具名。姓名只出現在網頁的「製作名單 CREDITS」段落，不出現在實驗影像的說明、替代文字、`data/` 的資料檔或 `data/README.md`。有人聲的實驗影片一律靜音；口述內容只摘要事實。所有圖片與影片都已移除中繼資料。

Experiment footage, sound and records show no participant's face, body or voice; the credits name people as listed in the official Credit List. Names appear only in the CREDITS section of the page.

## 製作名單

`index.html` 的「製作名單 CREDITS」段落照錄官方 Credit List（二部曲《脈動森林》表演、三部曲《氣孔低語 Stoma Whisperer》展覽），逐字不改寫、不翻譯、不調整順序。每一行「職稱：姓名」在網頁上仍是同一行文字，複製出來與原文相同；改名單時請整段替換，不要只改顯示樣式。
