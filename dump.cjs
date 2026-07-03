const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

async function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    let targetPort = null;
    let targetUrl = null;
    for (let port of [9000, 9001, 9002, 9003]) {
        try {
            const list = await getJson(`http://127.0.0.1:${port}/json/list`);
            const target = list.find(t => t.webSocketDebuggerUrl);
            if (target) {
                targetPort = port;
                targetUrl = target.webSocketDebuggerUrl;
                break;
            }
        } catch(e) {}
    }
    
    if (!targetUrl) {
        console.log("NO CDP FOUND");
        return;
    }
    
    const ws = new WebSocket(targetUrl);
    ws.on('open', () => {
        let id = 1;
        ws.send(JSON.stringify({ id: id++, method: "Runtime.enable" }));
        
        setTimeout(() => {
            ws.send(JSON.stringify({
                id: id++,
                method: "Runtime.evaluate",
                params: {
                    expression: `document.body.innerHTML`,
                    returnByValue: true
                }
            }));
        }, 500);
    });
    
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        if (data.result && data.result.result && data.result.result.value) {
            fs.writeFileSync('dom_dump.html', data.result.result.value);
            console.log("DOM saved to dom_dump.html");
            process.exit(0);
        }
    });
}
run();
