export function value<T>(arg: T | null | undefined): T {
    if (arg == null) throw "value was null";
    return arg;
}

export function returnOf<T>(fn: (...args: any[]) => T) {
    return null! && fn();
}
