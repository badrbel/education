const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve('c:/Users/mad/Desktop/موقع تعلمي');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlUrl = 'file:///c:/Users/mad/Desktop/موقع تعلمي/index.html';
const port = 9338;

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

async function testViewport(width, height, label, port = 9340) {
  console.log(`\n--- فحص المتصفح الحقيقي للقياس: ${label} (${width}x${height}) ---`);
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    `--window-size=${width},${height}`,
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
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No target page found');
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    // Emulate device viewport
    await cdpRequest(ws, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768
    });

    // Initialize student profile and show dashboard
    // Wait for document ready
    await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', () => resolve());
      })`,
      awaitPromise: true
    });

    // Initialize student profile and show dashboard
    await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `
        localStorage.setItem('mordix_ai_student', JSON.stringify({
          version: 1,
          initialized: true,
          name: 'طالب تجريبي',
          branch: 'آداب وفلسفة',
          level: '3as'
        }));
        if (typeof showDashboard === 'function') showDashboard();
        else if (window.showDashboard) window.showDashboard();
      `
    });

    // Wait a brief moment for styles/scripts to evaluate
    await new Promise(r => setTimeout(r, 1000));

    // Evaluate subject cards dimensions and container overflow
    const evalRes = await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const container3as = document.getElementById('dashboard-subjects-3as');
          const cards3as = Array.from(document.querySelectorAll('#dashboard-subjects-3as .mordix-subject-card'));
          
          let cardOverflows = 0;
          cards3as.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.width > container3as.clientWidth + 2) {
              cardOverflows++;
            }
          });

          return {
            containerClientWidth: container3as.clientWidth,
            containerScrollWidth: container3as.scrollWidth,
            cardsCount: cards3as.length,
            cardOverflows,
            noContainerOverflow: container3as.scrollWidth <= container3as.clientWidth + 1
          };
        })()
      `,
      returnByValue: true
    });

    const metrics = evalRes.result.value;
    console.log(`  عرض حاوية المواد (clientWidth): ${metrics.containerClientWidth}px`);
    console.log(`  عرض التمرير للحاوية (scrollWidth): ${metrics.containerScrollWidth}px`);
    console.log(`  عدد بطاقات المواد المفحوصة: ${metrics.cardsCount}`);
    console.log(`  عدد البطاقات المتجاوزة للعرض: ${metrics.cardOverflows}`);

    const pass = metrics.noContainerOverflow && metrics.cardOverflows === 0 && metrics.cardsCount === 7;
    if (pass) {
      console.log(`  [PASS] بطاقات المواد متوافقة 100% مع أبعاد الحاوية دون أي تجاوز على ${label}`);
    } else {
      console.error(`  [FAIL] عدم تطابق أبعاد الحاوية على ${label}`);
    }

    // Now test 4AM subjects
    await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          localStorage.setItem('mordix_ai_student', JSON.stringify({
            version: 1,
            initialized: true,
            name: 'طالب 4AM',
            branch: null,
            level: '4am'
          }));
          if (window.showDashboard) window.showDashboard();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 500));

    const eval4AM = await cdpRequest(ws, 'Runtime.evaluate', {
      expression: `
        (() => {
          const container4am = document.getElementById('dashboard-subjects-4am');
          const cards4am = Array.from(document.querySelectorAll('#dashboard-subjects-4am .mordix-subject-card'));
          let cardOverflows = 0;
          cards4am.forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.width > container4am.clientWidth + 2) {
              cardOverflows++;
            }
          });
          return {
            containerClientWidth: container4am.clientWidth,
            containerScrollWidth: container4am.scrollWidth,
            cardsCount: cards4am.length,
            cardOverflows,
            noContainerOverflow: container4am.scrollWidth <= container4am.clientWidth + 1
          };
        })()
      `,
      returnByValue: true
    });

    const metrics4am = eval4AM.result.value;
    const pass4am = metrics4am.noContainerOverflow && metrics4am.cardOverflows === 0 && (metrics4am.cardsCount === 9 || metrics4am.cardsCount === 10);
    if (pass4am) {
      console.log(`  [PASS] بطاقات 4AM الـ 9 متوافقة 100% مع أبعاد الحاوية دون أي تجاوز على ${label}`);
    } else {
      console.error(`  [FAIL] عدم تطابق أبعاد حاوية 4AM على ${label}`);
    }

    // Capture screenshot as artifact
    const screenshotRes = await cdpRequest(ws, 'Page.captureScreenshot', { format: 'png' });
    if (screenshotRes && screenshotRes.data) {
      const imgPath = path.join(baseDir, `scratch/screenshot_${label}.png`);
      fs.writeFileSync(imgPath, Buffer.from(screenshotRes.data, 'base64'));
      console.log(`  [PASS] تم حفظ لقطة الشاشة: scratch/screenshot_${label}.png`);
    }

    ws.close();
    proc.kill();
    return pass && pass4am;
  } catch (err) {
    console.error('Error during viewport test:', err);
    proc.kill();
    return false;
  }
}

async function run() {
  const r1 = await testViewport(1280, 800, 'Desktop', 9341);
  await new Promise(r => setTimeout(r, 1500));
  const r2 = await testViewport(768, 1024, 'Tablet', 9342);
  await new Promise(r => setTimeout(r, 1500));
  const r3 = await testViewport(375, 812, 'Mobile', 9343);

  if (r1 && r2 && r3) {
    console.log('\n====================================================');
    console.log('  جميع اختبارات الشاشات والمتصفح الحقيقي نجحت 100%!');
    console.log('====================================================');
    process.exit(0);
  } else {
    console.error('فشلت بعض اختبارات العرض المتجاوب!');
    process.exit(1);
  }
}

run();
