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

    // Common function for unary operations that compute immediately
    applyUnaryFunction(mathFunc, validator = null, historyName = null) {
        if (this.hasError) return;
        try {
            const originalExpr = this.display.textContent;
            const currentValue = this.evaluateCurrentExpression();
            if (validator && !validator(currentValue)) {
                throw new Error("Invalid input for function");
            }
            const result = mathFunc(currentValue);
            if (!isFinite(result)) {
                throw new Error("Invalid result");
            }
            const formattedResult = this.formatResult(result);
            this.updateDisplay(formattedResult);
            this.justCalculated = true;

            // Add to history
            if (historyName) {
                this.history.add(historyName + "(" + originalExpr + ")", formattedResult);
                this.updateHistoryPanel();
            }
        } catch (err) {
            this.updateDisplay("Invalid expression");
            this.hasError = true;
        }
    }

    appendToExpression(suffix) {
        if (this.hasError) return;
        const expr = this.display.textContent;
        this.updateDisplay(expr + suffix);
        this.justCalculated = false;
    }

    applySquare() {
        this.appendToExpression("^2");
    }

    applyPower() {
        this.appendToExpression("^");
    }

    applyTenPower() {
        this.applyUnaryFunction((x) => Math.pow(10, x), null, "10^");
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

    applyAbsolute() {
        this.applyUnaryFunction(Math.abs, null, "abs");
    }

    applySquareRoot() {
        this.applyUnaryFunction(Math.sqrt, (x) => x >= 0, "√");
    }

    applyFactorial() {
        this.appendToExpression("!");
    }

    applyLog10() {
        this.applyUnaryFunction(Math.log10, (x) => x > 0, "log");
    }

    applyLn() {
        this.applyUnaryFunction(Math.log, (x) => x > 0, "ln");
    }

    applyExp() {
        this.appendToExpression("^");
    }

    applyCube() {
        this.appendToExpression("^3");
    }

    applyCubeRoot() {
        this.applyUnaryFunction(Math.cbrt, null, "∛");
    }

    applyTwoPower() {
        this.applyUnaryFunction((x) => Math.pow(2, x), null, "2^");
    }

    toRadians(deg) {
        return deg * (Math.PI / 180);
    }

    toDegrees(rad) {
        return rad * (180 / Math.PI);
    }

    applySin() {
        this.applyUnaryFunction((x) => Math.sin(this.toRadians(x)), null, "sin");
    }

    applyCos() {
        this.applyUnaryFunction((x) => Math.cos(this.toRadians(x)), null, "cos");
    }

    applyTan() {
        this.applyUnaryFunction((x) => Math.tan(this.toRadians(x)), (x) => x % 180 !== 90, "tan");
    }

    applyAsin() {
        this.applyUnaryFunction((x) => this.toDegrees(Math.asin(x)), (x) => x >= -1 && x <= 1, "sin⁻¹");
    }

    applyAcos() {
        this.applyUnaryFunction((x) => this.toDegrees(Math.acos(x)), (x) => x >= -1 && x <= 1, "cos⁻¹");
    }

    applyAtan() {
        this.applyUnaryFunction((x) => this.toDegrees(Math.atan(x)), null, "tan⁻¹");
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

        // position where the last operand begins
        let i = expr.length - 1;

        // Skip trailing digits/dots
        if (/[0-9.πe]/.test(expr[i])) {
            while (i >= 0 && /[0-9.πe]/.test(expr[i])) {
                i--;
            }

            const prefix = expr.substring(0, i + 1);
            const operand = expr.substring(i + 1);

            if (prefix === "" || prefix === "-") {
                // single number
                if (expr.startsWith("-")) {
                    this.updateDisplay(expr.substring(1));
                } else {
                    this.updateDisplay("-" + expr);
                }
            } else if (prefix.endsWith("(-")) {
                // operand is already negated 
                this.updateDisplay(prefix.slice(0, -1) + operand);
            } else if (prefix.endsWith("(")) {
                this.updateDisplay(prefix + "-" + operand);
            } else if (prefix.endsWith("-")) {
                // binary minus 
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

    applyFloor() {
        this.applyUnaryFunction(Math.floor, null, "floor");
    }

    applyCeil() {
        this.applyUnaryFunction(Math.ceil, null, "ceil");
    }

    applyRand() {
        const result = Math.random();
        const formattedResult = this.formatResult(result);
        this.updateDisplay(formattedResult);
        this.justCalculated = true;
        this.hasError = false;
        this.history.add("rand()", formattedResult);
        this.updateHistoryPanel();
    }

    applyRound() {
        this.applyUnaryFunction(Math.round, null, "round");
    }
}