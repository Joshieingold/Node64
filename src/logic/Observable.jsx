export default class Observable {
    constructor() {
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    notify() {
        this.listeners.forEach((listener) => listener());
    }
}
