export function setText(id: string, content: string | number) {
    let el = document.getElementById(id);
    if (typeof content === "number") content = format(content);
    if (el) el.innerText = content;
}

export function format(n: number) {
    return n.toFixed();
}