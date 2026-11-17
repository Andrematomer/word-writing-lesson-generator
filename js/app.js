const wordInput = document.getElementById('wordInput');
const worksheetContainer = document.getElementById('worksheet-container');

const BLOCK_PATH = 'individual_block_svg/';
const LETTER_PATH = 'individual_letter_svg/';

wordInput.addEventListener('input', handleInput);

document.querySelectorAll('input[name="distribution"]').forEach(radio => {
    radio.addEventListener('change', () => renderAllPages(wordInput.value));
});

function handleInput(e) {
    const val = e.target.value.replace(/[^a-zA-Z\n]/g, '');
    if (val !== e.target.value) { wordInput.value = val; }
    renderAllPages(val);
}

function hasDescender(str) {
    return /[gjpqy]/.test(str);
}

async function fetchSVG(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            console.error(`404: ${path}`);
            return null;
        }
        const svgText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(svgText, "image/svg+xml");
        const svgElement = xmlDoc.querySelector('svg');

        if (svgElement) {
            svgElement.removeAttribute('width');
            svgElement.removeAttribute('height');
            return svgElement;
        }
    } catch (e) {
        console.error("Fetch Error:", path, e);
    }
    return null;
}

async function renderAllPages(text) {
    worksheetContainer.innerHTML = 'Loading lessons...';
    const words = text.split('\n').filter(w => w.trim().length > 0);
    
    const distribution = document.querySelector('input[name="distribution"]:checked').value;
    const isOptimized = (distribution === 'optimize');

    const fragment = document.createDocumentFragment();
    
    for (const word of words) {
        const page = await createPage(word, isOptimized);
        fragment.appendChild(page);
    }
    
    worksheetContainer.innerHTML = '';
    worksheetContainer.appendChild(fragment);
}

async function createPage(word, isOptimized) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page';

    const stack = document.createElement('div');
    stack.className = 'unified-stack';

    const allChars = word.split('');
    const uniqueChars = [...new Set(allChars)];

    // 1. Unique Letter Blocks
    for (const char of uniqueChars) {
        const item = document.createElement('div');
        item.className = 'stack-item';
        if (isOptimized && !hasDescender(char)) {
            item.classList.add('tight-gap');
        }

        const svg = await fetchSVG(`${BLOCK_PATH}${getFilename(char)}`);
        if (svg) item.appendChild(svg);
        stack.appendChild(item);
    }

    // 2. Traceable Word Block
    const traceRow = document.createElement('div');
    traceRow.className = 'stack-item';
    if (isOptimized && !hasDescender(word)) {
        traceRow.classList.add('tight-gap');
    }

    const bgTrace = await fetchSVG(`${BLOCK_PATH}blank.svg`);
    if (bgTrace) traceRow.appendChild(bgTrace);

    const overlay = document.createElement('div');
    overlay.className = 'overlay-container';
    
    for (const char of allChars) {
        const lSvg = await fetchSVG(`${LETTER_PATH}${getFilename(char)}`);
        if (lSvg) overlay.appendChild(lSvg);
    }
    traceRow.appendChild(overlay);
    stack.appendChild(traceRow);

    // 3. Blank Practice Block
    const blankRow = document.createElement('div');
    blankRow.className = 'stack-item';
    if (isOptimized) {
        blankRow.classList.add('tight-gap');
    }
    
    const bgBlank = await fetchSVG(`${BLOCK_PATH}blank.svg`);
    if (bgBlank) blankRow.appendChild(bgBlank);
    stack.appendChild(blankRow);

    pageDiv.appendChild(stack);
    return pageDiv;
}

function getFilename(char) {
    return char === char.toUpperCase() ? `大_${char}.svg` : `小_${char}.svg`;
}

renderAllPages(wordInput.value);