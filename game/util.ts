export function value<T>(arg: T | null | undefined): T {
    if (arg == null) throw "value was null";
    return arg;
}