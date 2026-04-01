import { Expression } from "./expression.js";
import { History } from "./History.js";

export class Calculator {
    constructor(displayElement, historyPanel) {
        this.display = displayElement;
        this.historyPanel = historyPanel;
        this.expression = new Expression();
        this.history = new History();
    }

    updateDisplay(text) {
        this.display.textContent = text;
    }

    append(value) {
        let currentText = this.display.textContent;
        if (currentText === "0") {
            this.updateDisplay(value);
        } else {
            this.updateDisplay(currentText + value);
        }
    }

    clear() {
        this.updateDisplay("0");
    }

    delete() {
        let currentText = this.display.textContent;
        if (currentText.length <= 1) {
            this.updateDisplay("0");
        } else {
            this.updateDisplay(currentText.slice(0, -1));
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
            let input = this.display.textContent.trim();
            const result = this.expression.evaluate(input);
            const formattedResult = this.formatResult(result);

            this.updateDisplay(formattedResult);

            // Add to history
            this.history.add(input, formattedResult);
            this.updateHistoryPanel();
        } catch (err) {
            this.updateDisplay("Error");
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

            historyItem.addEventListener('click', () => {
                this.updateDisplay(item.expression);
            });

            this.historyPanel.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.history.clear();
        this.updateHistoryPanel();
    }
}