import { Expression } from "./expression.js";
import { History } from "./History.js";

export class Calculator {
    constructor(displayElement, historyPanel) {
        this.display = displayElement;
        this.historyPanel = historyPanel;
        this.expression = new Expression();
        this.history = new History();
    }

    append(value) {
        if (this.display.textContent === "0") {
            this.display.textContent = value;
        }

        else {
            this.display.textContent += value;
        }
    }

    clear() {
        this.display.textContent = "0";
    }

    delete() {
        if (this.display.textContent.length == 1) {
            this.display.textContent = "0";
        } else {
            this.display.textContent = this.display.textContent.slice(0, -1);
        }
    }

    formatResult(value) {
        const num = parseFloat(value);
        if (isNaN(num)) return value;

        // Check if it's an integer or very close to one
        if (Number.isInteger(num)) {
            return num.toString();
        }

        // Format to 6 decimal places, removing trailing zeros
        return parseFloat(num.toFixed(6)).toString();
    }

    calculate() {
        try {
            const input = this.display.textContent;
            const result = this.expression.evaluate(input);
            const formattedResult = this.formatResult(result);

            this.display.textContent = formattedResult;

            // Add to history
            this.history.add(input, formattedResult);
            this.updateHistoryPanel();
        } catch (err) {
            this.display.textContent = "Error";
        }
    }

    updateHistoryPanel() {
        if (!this.historyPanel) return;

        const items = this.history.getAll();
        this.historyPanel.innerHTML = '';

        if (items.length === 0) {
            this.historyPanel.innerHTML = '<div class="history-empty">History is empty</div>';
            return;
        }

        items.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">${item.result}</div>
            `;
            this.historyPanel.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.history.clear();
        this.updateHistoryPanel();
    }
}