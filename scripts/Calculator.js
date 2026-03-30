import { Expression } from "./expression.js";

export class Calculator {
    constructor(displayElement) {
        this.display = displayElement;
        this.expression = new Expression();
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

    calculate() {
        try {
            const input = this.display.textContent;
            const result = this.expression.evaluate(input);

            this.display.textContent = result;
        } catch (err) {
            this.display.textContent = "Error";
        }
    }
}