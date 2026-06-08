### npm install

- npm install react-router-dom: a router tool
- npm install
- npm install lucide-react: svg icon library
- npm install three @react-three/fiber @react-three/drei
- npm install @mediapipe/tasks-vision
- npm install gsap: GreenSock Animation Platform
- npm install @react-three/drei@latest
- npm i lodash
- npm install react-datepicker
- npm init -y: build a node.js project
- npm install express @prisma/client cors dotenv
- npm install -D nodemon prisma: install 開發時用的自動重啟工具
- npx: execute local project tool, will find <code>node_modules/.bin/nodemon</code> first, if true, then execute it
- <code>nodemon</code>: 監控檔案變化的工具
- npx prisma init
- node src/spider.js: 跑一次程式，執行完就結束
- npx prisma migrate dev --name init_postgres: 把 schema.prisma 的 model 真正建立到資料庫裡
- npx prisma migrate dev: 更新資料庫表
- npx prisma migrate dev --name init_tarot_articles
- npx prisma migrate reset: 拆舊換新
- npx nodemon src/server.js: 啟動後端，且nodemon 會自動重新啟動它
   適合開發時持續監看檔案變化
- npm install express cors dotenv prisma @prisma/client bcrypt jsonwebtoken multer
- npm install axios cheerio: install axios(爬蟲) and analyze HTML label(cheerio)
- npm install -D concurrently: 它記錄到 devDependencies，讓你可以用一個指令同時執行多個程式
- npm install html2canvas: 讓「匯出」按鈕真的能把畫面變成 JPEG 圖片下載
- npm install react-icons

### tech stack
- frontend: React.js, Next.js
- backend: Python(Flask o rFastAPI)->why not use Node.js?+ MongoDB or PostgreSQL
- 3D engine: Three.js 搭配 React Three Fiber(R3F)
- gesture: @mediapipe/tasks-vision
- screenshot: html2canvas

### file

- main.jsx: project entry point
