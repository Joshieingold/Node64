export default class Observable {
    constructor() {
        this.listeners = new Set();
        this.version = 0;
    }

    subscribe = (listener) => {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    };

    notify = () => {
        this.version++;
        this.listeners.forEach((l) => l());
    };
}
