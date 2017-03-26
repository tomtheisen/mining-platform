export function value<T>(arg: T | null | undefined): T {
    if (arg == null) throw "value was null";
    return arg;
}

export function returnOf<T>(fn: (...args: any[]) => T) {
    return null! && fn();
}

export class Subscriptions<T> {
    private subscribers: { [name: string]: ((val: any) => boolean)[] } = {};

    subscribe<TKey extends keyof T>(name: TKey, callback: (newValue: T[TKey]) => boolean): void {
        if (!this.subscribers[name]) this.subscribers[name] = [];
        this.subscribers[name].push(callback);
    }

    publish<TKey extends keyof T>(name: TKey, newValue: T[TKey]) {
        let subscribers = this.subscribers[name];
        if (!subscribers) return;
        for (let i = 0; i < subscribers.length; i++) {
            let success = subscribers[i](newValue);
            if (!success) subscribers.splice(i--, 1);
        }
    }
}