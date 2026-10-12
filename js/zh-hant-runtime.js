import { toTraditionalText } from '../data/zh-hant.mjs';

const ATTRIBUTES = ['aria-label', 'title', 'placeholder'];

function convertSubtree(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const converted = toTraditionalText(node.nodeValue);
        if (converted !== node.nodeValue) node.nodeValue = converted;
        return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    for (const attribute of ATTRIBUTES) {
        const value = node.getAttribute(attribute);
        if (value) {
            const converted = toTraditionalText(value);
            if (converted !== value) node.setAttribute(attribute, converted);
        }
    }
    for (const child of node.childNodes) convertSubtree(child);
}

convertSubtree(document.body);
new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) convertSubtree(node);
        } else {
            convertSubtree(mutation.target);
        }
    }
}).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
