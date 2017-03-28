export function setText(selector: string, content: string | number, parent?: HTMLElement) {
    let el = (parent || document).querySelector(selector);
    if (typeof content === "number") content = format(content);
    if (el instanceof HTMLElement) el.innerText = content;
}

export function format(n: number) {
    return n.toFixed();
}

type HtmlContent = HTMLElement | string;
interface AttributeMap {
    [name: string]: string;
}

function element(name: keyof HTMLElementTagNameMap, contents: AttributeMap, ...args: HtmlContent[]) {
    let el = document.createElement(name);

    Object.keys(contents).forEach(attr => el.setAttribute(attr, contents[attr]));

    for (let arg of args) {
        el.appendChild(typeof arg === "string" ? document.createTextNode(arg) : arg);
    }
    return el;
}

export function div(attrs: AttributeMap, ...contents: HtmlContent[]) {
    return element("div", attrs, ...contents);
}

export function span(attrs: AttributeMap, ...contents: HtmlContent[]) {
    return element("span", attrs, ...contents)
}

export function input(attrs: AttributeMap) {
    return element("input", attrs)
}

export function label(attrs: AttributeMap, ...contents: HtmlContent[]) {
    return element("label", attrs, ...contents)
}

