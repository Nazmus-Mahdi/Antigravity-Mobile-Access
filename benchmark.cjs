const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Create a large DOM
    await page.evaluate(() => {
        let html = '';
        for(let i=0; i<10000; i++) {
            html += `<div><span>Text ${i}</span><div><p>Claude</p></div></div>`;
        }
        // The target
        html += `<div style="cursor:pointer">Claude <svg class="lucide-chevron-down"></svg></div>`;
        document.body.innerHTML = html;
    });

    const runPerf = await page.evaluate(() => {
        const start = performance.now();
        const KNOWN_KEYWORDS = ["Gemini", "Claude", "GPT", "Model"];
        let modelBtn = null;

        const candidates = Array.from(document.querySelectorAll('button, [role="button"], div, span'))
            .filter(el => {
                const txt = el.innerText?.trim() || '';
                return KNOWN_KEYWORDS.some(k => txt.includes(k)) && el.offsetParent !== null;
            });

        modelBtn = candidates.find(el => {
            const style = window.getComputedStyle(el);
            const hasSvg = el.querySelector('svg.lucide-chevron-up') ||
                           el.querySelector('svg.lucide-chevron-down') ||
                           el.querySelector('svg[class*="chevron"]') ||
                           el.querySelector('svg');
            return (style.cursor === 'pointer' || el.tagName === 'BUTTON') && hasSvg;
        }) || candidates[0];

        return performance.now() - start;
    });

    console.log("Baseline:", runPerf);

    const runOptimized = await page.evaluate(() => {
        const start = performance.now();
        const KNOWN_KEYWORDS = ["Gemini", "Claude", "GPT", "Model"];
        let modelBtn = null;

        const candidates = Array.from(document.querySelectorAll('button, [role="button"], div, span'))
            .filter(el => {
                const txt = el.innerText?.trim() || '';
                return KNOWN_KEYWORDS.some(k => txt.includes(k)) && el.offsetParent !== null;
            });

        modelBtn = candidates.find(el => {
            const hasSvg = el.querySelector('svg.lucide-chevron-up') ||
                           el.querySelector('svg.lucide-chevron-down') ||
                           el.querySelector('svg[class*="chevron"]') ||
                           el.querySelector('svg');

            if (!hasSvg) return false;
            if (el.tagName === 'BUTTON') return true;
            return window.getComputedStyle(el).cursor === 'pointer';
        }) || candidates[0];

        return performance.now() - start;
    });

    console.log("Optimized:", runOptimized);

    await browser.close();
})();
