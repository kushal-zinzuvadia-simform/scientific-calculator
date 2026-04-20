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
        this.memory = 0;
    }

    getCurrentValue() {
        const text = this.display.textContent || "0";
        return parseFloat(text) || 0;
    }

    updateDisplay(text) {
        this.display.textContent = text;
    }

    isStartOfNewEntry(value) {
        return /^[0-9.]$/.test(value) || value === "π" || value === "e";
    }

    isOperator(value) {
        return ["+", "-", "×", "÷", "%", "!"].includes(value);
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

    handleMemory(type) {
        if (this.hasError) return;
        const value = this.getCurrentValue();

        switch (type) {
            case "MS": this.memory = value; break;
            case "MR": this.updateDisplay(this.formatResult(this.memory)); this.justCalculated(false); break;
            case "M+": this.memory += value; break;
            case "M-": this.memory -= value; break;
            case "MC": this.memory = 0; break;
        }
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
        const lastChar = currentText[currentText.length - 1];
        const operatorLike = new Set(["+", "-", "×", "÷", "%", "!", "^", "π", "e"]);

        // Prevent consecutive tokens 
        if (operatorLike.has(value) && operatorLike.has(lastChar)) {
            if (value === lastChar) {
                return;
            }
            this.updateDisplay(currentText.slice(0, -1) + value);
            this.justCalculated = false;
            return;
        }

        // Prevent consecutive decimal 
        if (value === ".") {
            const lastNumberMatch = currentText.match(/(\d*\.?\d*)$/);
            if (lastNumberMatch && lastNumberMatch[1].includes(".")) {
                return;
            }
            if (lastChar === ".") {
                return;
            }
        }

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
                this.updateDisplay(result === Infinity || result === -Infinity ? "Infinite" : "Invalid expression");
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

    // Common function for unary operations
    applyUnaryFunction(format) {
        if (this.hasError) return;

        const expr = this.display.textContent;
        const lastChar = expr[expr.length - 1];
        const isPostfix = format.startsWith("%s"); 

        if (isPostfix) {
            // Postfix ops (!, ^, x², x³) require an operand
            if (expr === "0") return;
            if (lastChar === "!" || lastChar === "^") return;
            // Must end in a digit, ")", π, or e
            if (!/[0-9)πe]$/.test(expr)) return;
        } else {
            // Prefix/wrap functions 
            if (expr === "0") {
                const openForm = format.replace("(%s)", "(").replace("%s", "");
                this.updateDisplay(openForm);
                this.justCalculated = false;
                return;
            }
        }

        this.updateDisplay(format.replace("%s", expr));
        this.justCalculated = false;
    }

    appendToExpression(suffix) {
        if (this.hasError) return;
        const expr = this.display.textContent;
        const lastChar = expr[expr.length - 1];

        // "^" is only valid after a digit, ")", π, e
        if (suffix === "^") {
            if (expr === "0") return;
            if (!/[0-9)πe]$/.test(expr)) return;
            if (lastChar === "^" || lastChar === "!") return;
        }

        this.updateDisplay(expr + suffix);
        this.justCalculated = false;
    }

    applySquare() {
        this.applyUnaryFunction("(%s)^2");
    }

    applyPower() {
        this.appendToExpression("^");
    }

    applyTenPower() {
        this.applyUnaryFunction("10^(%s)");
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
        this.applyUnaryFunction("abs(%s)");
    }

    applySquareRoot() {
        this.applyUnaryFunction("√(%s)");
    }

    applyFactorial() {
        this.applyUnaryFunction("%s!");
    }

    applyLog10() {
        this.applyUnaryFunction("log(%s)");
    }

    applyLn() {
        this.applyUnaryFunction("ln(%s)");
    }

    applyExp() {
        this.applyUnaryFunction("%s^");
    }

    applyCube() {
        this.applyUnaryFunction("(%s)^3");
    }

    applyCubeRoot() {
        this.applyUnaryFunction("∛(%s)");
    }

    applyTwoPower() {
        this.applyUnaryFunction("2^(%s)");
    }

    toRadians(deg) {
        return deg * (Math.PI / 180);
    }

    toDegrees(rad) {
        return rad * (180 / Math.PI);
    }

    applySin() {
        this.applyUnaryFunction("sin(%s)");
    }

    applyCos() {
        this.applyUnaryFunction("cos(%s)");
    }

    applyTan() {
        this.applyUnaryFunction("tan(%s)");
    }

    applyAsin() {
        this.applyUnaryFunction("asin(%s)");
    }

    applyAcos() {
        this.applyUnaryFunction("acos(%s)");
    }

    applyAtan() {
        this.applyUnaryFunction("atan(%s)");
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
        this.applyUnaryFunction("floor(%s)");
    }

    applyCeil() {
        this.applyUnaryFunction("ceil(%s)");
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
        this.applyUnaryFunction("round(%s)");
    }
}