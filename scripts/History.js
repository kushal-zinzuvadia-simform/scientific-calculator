export class History {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.items = this.loadFromStorage();
    }

    add(expression, result) {
        const item = {
            expression: expression,
            result: result
        };

        this.items.unshift(item);

        if (this.items.length > this.maxSize) {
            this.items.pop();
        }

        this.saveToStorage();
    }

    getAll() {
        return this.items;
    }

    clear() {
        this.items = [];
        this.saveToStorage();
    }

    saveToStorage() {
        localStorage.setItem('calculatorHistory', JSON.stringify(this.items));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('calculatorHistory');
        return saved ? JSON.parse(saved) : [];
    }
}
