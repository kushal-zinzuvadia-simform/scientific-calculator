'use strict'

import { Expression } from "./expression.js";
import { History } from "./History.js";

export class Calculator {
    constructor(displayElement, historyPanel) {
        this.display = displayElement;
        this.historyPanel = historyPanel;
        this.expression = new Expression();
        this.history = new History();
        this.justCalculated = false;
        this.hasError = false;
    }

    updateDisplay(text) {
        this.display.textContent = text;
    }

    isStartOfNewEntry(value) {
        return /^[0-9.]$/.test(value) || value === "π" || value === "e";
    }

    isOperator(value) {
        return ["+", "-", "×", "÷", "%"].includes(value);
    }

    // If the display is in error state, reset to 0.
    clearIfError() {
        if (this.hasError) {
            this.updateDisplay("0");
            this.hasError = false;
            this.justCalculated = false;
            return true;
        }
        return false;
    }

    append(value) {
        // After an error, any input starts a new expression
        if (this.hasError) {
            this.clearIfError();
            // For operators after error: start with "0"
            if (this.isOperator(value)) {
                this.updateDisplay("0" + value);
                return;
            }
            if (value === ".") {
                this.updateDisplay("0.");
                return;
            }
            // For digits, constants, parens: set directly
            this.updateDisplay(value);
            return;
        }

        let currentText = this.display.textContent;

        if (this.justCalculated && this.isStartOfNewEntry(value)) {
            this.updateDisplay(value);
        } else if (this.justCalculated && this.isOperator(value)) {
            this.updateDisplay(currentText + value);
        } else if (currentText === "0" && value === ".") {
            this.updateDisplay("0.");
        } else if (currentText === "0" && this.isOperator(value)) {
            this.updateDisplay(`0${value}`);
        } else if (currentText === "0" && value !== ")") {
            this.updateDisplay(value);
        } else {
            this.updateDisplay(currentText + value);
        }

        this.justCalculated = false;
    }

    clear() {
        this.updateDisplay("0");
        this.justCalculated = false;
        this.hasError = false;
    }

    delete() {
        if (this.hasError) {
            this.clear();
            return;
        }
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

    evaluateCurrentExpression() {
        let input = this.display.textContent.trim();
        const result = this.expression.evaluate(input);
        if (isNaN(result) || !isFinite(result)) {
            throw new Error("Invalid result");
        }
        return result;
    }

    calculate() {
        if (this.hasError) return;

        try {
            let input = this.display.textContent.trim();
            const result = this.expression.evaluate(input);

            if (isNaN(result) || !isFinite(result)) {
                this.updateDisplay("Invalid expression");
                this.hasError = true;
                this.justCalculated = false;
                return;
            }

            const formattedResult = this.formatResult(result);

            this.updateDisplay(formattedResult);
            this.justCalculated = true;

            // Add to history
            this.history.add(input, formattedResult);
            this.updateHistoryPanel();
        } catch (err) {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
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
                this.hasError = false;
            });

            this.historyPanel.appendChild(historyItem);
        });
    }

    clearHistory() {
        this.history.clear();
        this.updateHistoryPanel();
    }

    // Scientific functions

    applySquare() {
        if (this.hasError) return;
        const expr = this.display.textContent;
        this.updateDisplay(expr + "^2");
        this.justCalculated = false;
    }

    applyPower() {
        if (this.hasError) return;
        const expr = this.display.textContent;
        this.updateDisplay(expr + "^");
        this.justCalculated = false;
    }

    applyTenPower() {
        if (this.hasError) return;
        try {
            const currentValue = this.evaluateCurrentExpression();
            const result = Math.pow(10, currentValue);
            if (!isFinite(result)) {
                this.updateDisplay("Invalid expression");
                this.hasError = true;
                return;
            }
            this.updateDisplay(this.formatResult(result));
            this.justCalculated = true;
        } catch {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
        }
    }

    applyReciprocal() {
        if (this.hasError) return;
        const expr = this.display.textContent;
        if (expr === "0") {
            this.updateDisplay("1/(");
        } else {
            this.updateDisplay("1/(" + expr + ")");
        }
        this.justCalculated = false;
    }

    // |x|
    applyAbsolute() {
        if (this.hasError) return;
        try {
            const currentValue = this.evaluateCurrentExpression();
            const result = Math.abs(currentValue);
            this.updateDisplay(this.formatResult(result));
            this.justCalculated = true;
        } catch {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
        }
    }

    applySquareRoot() {
        if (this.hasError) return;
        try {
            const currentValue = this.evaluateCurrentExpression();
            if (currentValue < 0) {
                this.updateDisplay("Invalid expression");
                this.hasError = true;
                return;
            }
            const result = Math.sqrt(currentValue);
            this.updateDisplay(this.formatResult(result));
            this.justCalculated = true;
        } catch {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
        }
    }

    applyFactorial() {
        if (this.hasError) return;
        const expr = this.display.textContent;
        this.updateDisplay(expr + "!");
        this.justCalculated = false;
    }

    applyLog10() {
        if (this.hasError) return;
        try {
            const currentValue = this.evaluateCurrentExpression();
            if (currentValue <= 0) {
                this.updateDisplay("Invalid expression");
                this.hasError = true;
                return;
            }
            const result = Math.log10(currentValue);
            this.updateDisplay(this.formatResult(result));
            this.justCalculated = true;
        } catch {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
        }
    }

    applyLn() {
        if (this.hasError) return;
        try {
            const currentValue = this.evaluateCurrentExpression();
            if (currentValue <= 0) {
                this.updateDisplay("Invalid expression");
                this.hasError = true;
                return;
            }
            const result = Math.log(currentValue);
            this.updateDisplay(this.formatResult(result));
            this.justCalculated = true;
        } catch {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
        }
    }

    applyExp() {
        if (this.hasError) return;
        const expr = this.display.textContent;
        this.updateDisplay(expr + "^");
        this.justCalculated = false;
    }

    // +/- 
    applyNegate() {
        if (this.hasError) {
            this.clearIfError();
            return;
        }
        let expr = this.display.textContent;
        if (expr === "0") return;

        const operatorChars = ['+', '-', '×', '÷', '%', '(', '^'];

        // Find the position where the last operand begins
        let i = expr.length - 1;

        // Skip trailing digits/dots
        if (/[0-9.πe]/.test(expr[i])) {
            while (i >= 0 && /[0-9.πe]/.test(expr[i])) {
                i--;
            }

            const prefix = expr.substring(0, i + 1);
            const operand = expr.substring(i + 1);

            if (prefix === "" || prefix === "-") {
                // Entire expression is a single number
                if (expr.startsWith("-")) {
                    this.updateDisplay(expr.substring(1));
                } else {
                    this.updateDisplay("-" + expr);
                }
            } else if (prefix.endsWith("(-")) {
                // operand is already negated inside parens
                this.updateDisplay(prefix.slice(0, -1) + operand);
            } else if (prefix.endsWith("(")) {
                this.updateDisplay(prefix + "-" + operand);
            } else if (prefix.endsWith("-")) {
                // Check if binary minus 
                const beforeMinus = prefix.length >= 2 ? prefix[prefix.length - 2] : null;
                if (beforeMinus && /[0-9)πe]/.test(beforeMinus)) {
                    this.updateDisplay(prefix + "(-" + operand + ")");
                } else {
                    // unary minus
                    this.updateDisplay(prefix.slice(0, -1) + operand);
                }
            } else {
                this.updateDisplay(prefix + "(-" + operand + ")");
            }
        } else if (expr[i] === ')') {
            if (expr.startsWith("-(") && expr.endsWith(")")) {
                this.updateDisplay(expr.substring(2, expr.length - 1));
            } else {
                this.updateDisplay("-(" + expr + ")");
            }
        }
    }
}