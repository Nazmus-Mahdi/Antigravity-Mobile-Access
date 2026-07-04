import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
const document = dom.window.document;
const window = dom.window;

// Create 10000 divs
for(let i=0; i<10000; i++) {
    const div = document.createElement('div');
    div.textContent = 'Some random text ' + i;
    if (i === 9999) {
        div.textContent = 'Planning mode text here';
        div.style.position = 'absolute';
        div.style.height = '10px';
    }
    document.body.appendChild(div);
}

// polyfill offsetHeight
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
    get: function() { return this.style.height === '10px' ? 10 : 0; }
});
Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
    get: function() {
        // simulate expensive layout reflow
        for(let j=0; j<1000; j++) {}
        return this.textContent;
    }
});


function benchOld() {
    let mode = 'Planning';
    let visibleDialog = Array.from(document.querySelectorAll('div'))
        .find(d => {
            const style = window.getComputedStyle(d);
            return d.offsetHeight > 0 &&
                   (style.position === 'absolute' || style.position === 'fixed') &&
                   d.innerText.includes(mode) &&
                   !d.innerText.includes('Files With Changes');
        });
    return visibleDialog;
}

function benchNew() {
    let mode = 'Planning';
    let visibleDialog = Array.from(document.querySelectorAll('div'))
        .find(d => {
            const text = d.textContent;
            if (!text || !text.includes(mode) || text.includes('Files With Changes')) return false;

            return d.offsetHeight > 0 &&
                   (window.getComputedStyle(d).position === 'absolute' || window.getComputedStyle(d).position === 'fixed');
        });
    return visibleDialog;
}

const startOld = process.hrtime.bigint();
for(let i=0; i<10; i++) benchOld();
const endOld = process.hrtime.bigint();

const startNew = process.hrtime.bigint();
for(let i=0; i<10; i++) benchNew();
const endNew = process.hrtime.bigint();

console.log('Old time:', Number(endOld - startOld) / 1000000, 'ms');
console.log('New time:', Number(endNew - startNew) / 1000000, 'ms');
