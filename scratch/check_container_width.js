const { spawn } = require('child_process');
const http = require('http');

async function run() {
  const proc = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
    '--headless=new',
    '--remote-debugging-port=9336',
    '--window-size=375,812',
    '--disable-gpu',
    'file:///c:/Users/mad/Desktop/موقع تعلمي/index.html'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const list = await new Promise(res => http.get('http://127.0.0.1:9336/json/list', r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => res(JSON.parse(d)));
  }));
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise(res => ws.addEventListener('open', res));

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        localStorage.setItem('mordix_ai_student', JSON.stringify({version:1,initialized:true,name:'test',branch:'آداب وفلسفة',level:'3as'}));
        if (window.showDashboard) window.showDashboard();
        const container3as = document.getElementById('dashboard-subjects-3as');
        const container4am = document.getElementById('dashboard-subjects-4am');
        return {
          container3as: { clientWidth: container3as.clientWidth, scrollWidth: container3as.scrollWidth },
          container4am: { clientWidth: container4am.clientWidth, scrollWidth: container4am.scrollWidth }
        };
      })()`,
      returnByValue: true
    }
  }));

  ws.addEventListener('message', e => {
    const msg = JSON.parse(e.data);
    if (msg.id === 1) {
      console.log('Container dimensions:', JSON.stringify(msg.result.value, null, 2));
      ws.close();
      proc.kill();
    }
  });
}
run();
