import { Expression } from "./expression.js";
import { History } from "./History.js";

export class Calculator {
    constructor(displayElement, historyPanel) {
        this.display = displayElement;
        this.historyPanel = historyPanel;
        this.expression = new Expression();
        this.history = new History();
        this.justCalculated = false;
    }

    updateDisplay(text) {
        this.display.textContent = text;
    }

    isStartOfNewEntry(value) {
        return /^[0-9.]$/.test(value) || value === "π" || value === "e";
    }

    append(value) {
        let currentText = this.display.textContent;

        if (this.justCalculated && this.isStartOfNewEntry(value)) {
            this.updateDisplay(value);
        } else if (currentText === "0") {
            this.updateDisplay(value);
        } else {
            this.updateDisplay(currentText + value);
        }

        this.justCalculated = false;
    }

    clear() {
        this.updateDisplay("0");
        this.justCalculated = false;
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
            this.justCalculated = true;

            // Add to history
            this.history.add(input, formattedResult);
            this.updateHistoryPanel();
        } catch (err) {
            this.updateDisplay("Error");
            this.justCalculated = false;
        }
    }

    updateHistoryPanel() {
        if (!this.historyPanel) return;

        const items = this.history.getAll();
        this.historyPanel.replaceChildren();

        if (items.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'history-empty';
            emptyDiv.textContent = 'History is empty';
            this.historyPanel.appendChild(emptyDiv);
            return;
        }

        items.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const expressionDiv = document.createElement('div');
            expressionDiv.className = 'history-expression';
            expressionDiv.textContent = item.expression;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'history-result';
            resultDiv.textContent = item.result;

            historyItem.appendChild(expressionDiv);
            historyItem.appendChild(resultDiv);

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