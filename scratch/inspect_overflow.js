const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlUrl = 'file:///c:/Users/mad/Desktop/موقع تعلمي/index.html';
const port = 9334;

function cdpRequest(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function findOverflowElements() {
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--window-size=375,812',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    htmlUrl
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const list = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/json/list`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    const pageTarget = list.find(t => t.type === 'page' && t.url.includes('index.html')) || list[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    await cdpRequest(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 812,
      deviceScaleFactor: 1,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 1000));

    // Find all elements overflowing 375px
    const evalRes = await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const docWidth = document.documentElement.clientWidth;
          const elements = Array.from(document.querySelectorAll('*'));
          const overflowing = [];
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > docWidth + 1 || rect.width > docWidth + 1) {
              overflowing.push({
                tag: el.tagName,
                id: el.id,
                className: String(el.className).slice(0, 60),
                width: Math.round(rect.width),
                right: Math.round(rect.right),
                text: el.innerText ? el.innerText.slice(0, 30) : ''
              });
            }
          }
          return {
            docWidth,
            totalElements: elements.length,
            overflowing: overflowing.slice(0, 20)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Result:', JSON.stringify(evalRes.result.value, null, 2));

    // Now test with dashboard shown (student profile set)
    const dashboardEval = await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          // Initialize student profile to 3AS so dashboard displays
          localStorage.setItem('mordix_ai_student', JSON.stringify({
            version: 1,
            initialized: true,
            name: 'طالب تجريبي',
            branch: 'آداب وفلسفة',
            level: '3as'
          }));
          if (window.showDashboard) window.showDashboard();
          const docWidth = document.documentElement.clientWidth;
          const elements = Array.from(document.querySelectorAll('#screen-dashboard *'));
          const overflowing = [];
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > docWidth + 1 || rect.width > docWidth + 1) {
              overflowing.push({
                tag: el.tagName,
                id: el.id,
                className: String(el.className).slice(0, 60),
                width: Math.round(rect.width),
                right: Math.round(rect.right),
                text: el.innerText ? el.innerText.slice(0, 30) : ''
              });
            }
          }
          const cards = Array.from(document.querySelectorAll('#dashboard-subjects-3as .mordix-subject-card'));
          const cardMetrics = cards.map(c => {
            const r = c.getBoundingClientRect();
            return {
              subject: c.getAttribute('data-subject'),
              width: Math.round(r.width),
              right: Math.round(r.right),
              left: Math.round(r.left),
              height: Math.round(r.height)
            };
          });
          return {
            docWidth,
            scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            overflowingInDashboard: overflowing.slice(0, 15),
            cardMetrics
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Dashboard Result:', JSON.stringify(dashboardEval.result.value, null, 2));

    ws.close();
    proc.kill();
  } catch (err) {
    console.error(err);
    proc.kill();
  }
}

findOverflowElements();
