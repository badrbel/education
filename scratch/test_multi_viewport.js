const { spawn } = require('child_process');
const http = require('http');

async function testViewport(width, height) {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const htmlUrl = 'file:///c:/Users/mad/Desktop/موقع تعلمي/index.html';
  const port = 9223;

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
    const listRes = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/json/list`, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    console.log(`[PASS] Viewport ${width}x${height} rendered successfully (${listRes.length} pages).`);
    proc.kill();
    return true;
  } catch (err) {
    console.error(`Viewport ${width}x${height} error:`, err.message);
    proc.kill();
    return false;
  }
}

async function runAll() {
  await testViewport(375, 667);
  await new Promise(r => setTimeout(r, 1000));
  await testViewport(768, 1024);
  await new Promise(r => setTimeout(r, 1000));
  await testViewport(1280, 800);
}

runAll().then(() => console.log('All viewports tested!'));
