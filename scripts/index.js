import { Calculator } from "./Calculator.js";

const display = document.querySelector(".result");
const calculator = new Calculator(display);

document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.innerText;

        if (value === "=") {
            calculator.calculate()
        } else if (value === "C") {
            calculator.clear();
        } else if (btn.getAttribute("aria-label") === "Backspace") {
            calculator.delete();
        } else {
            calculator.append(value);
        }
    })
})