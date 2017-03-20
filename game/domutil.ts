export function setText(selector: string, content: string | number, parent?: HTMLElement) {
    let el = (parent || document).querySelector(selector);
    if (typeof content === "number") content = format(content);
    if (el instanceof HTMLElement) el.innerText = content;
}

export function format(n: number) {
    return n.toFixed();
}