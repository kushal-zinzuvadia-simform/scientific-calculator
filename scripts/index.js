'use strict'

import { Calculator } from "./Calculator.js";

const scrollAmount = 30;

const display = document.getElementById("result-display");
const historyPanel = document.getElementById("history-items");
const historyToggleBtn = document.getElementById("historyToggle");
const historySidebar = document.getElementById("history-panel");
const clearHistoryBtn = document.getElementById("clearHistory");

const calculator = new Calculator(display, historyPanel);

calculator.updateHistoryPanel();

// Make display focusable
display.contentEditable = false;
display.tabIndex = 0;

// History toggle
historyToggleBtn.addEventListener("click", () => {
    historySidebar.classList.toggle("open");
});

// Clear history
clearHistoryBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    calculator.clearHistory();
});

document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.id === "historyToggle" || btn.id === "clearHistory") {
        return;
    }

    let value = btn.innerText;

    if (value === "=") {
        calculator.calculate();
        display.focus();
    } else if (value === "C") {
        calculator.clear();
    } else if (btn.getAttribute("aria-label") === "Backspace") {
        calculator.delete();
    } else if (value === "x²") {
        calculator.applySquare();
    } else if (value === "xʸ") {
        calculator.applyPower();
    } else if (value === "10ˣ") {
        calculator.applyTenPower();
    } else if (value === "1/x") {
        calculator.applyReciprocal();
    } else if (value === "|x|") {
        calculator.applyAbsolute();
    } else if (value === "²√x") {
        calculator.applySquareRoot();
    } else if (value === "n!") {
        calculator.applyFactorial();
    } else if (value === "log") {
        calculator.applyLog10();
    } else if (value === "ln") {
        calculator.applyLn();
    } else if (value === "exp") {
        calculator.applyExp();
    } else if (value === "+/-") {
        calculator.applyNegate();
    } else {
        if (value === "mod") {
            value = "%";
        }
        calculator.append(value);
    }
});

// Keyboard input support
document.addEventListener("keydown", (e) => {
    const key = e.key;

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // Handle modulo operator with %
    if (key === "%") {
        calculator.append("%");
        e.preventDefault();
        return;
    }

    if (key >= "0" && key <= "9") {
        calculator.append(key);
        e.preventDefault();
    }

    else if (key === ".") {
        calculator.append(".");
        e.preventDefault();
    }

    else if (key === "+") {
        calculator.append("+");
        e.preventDefault();
    }
    else if (key === "-") {
        calculator.append("-");
        e.preventDefault();
    }
    else if (key === "*") {
        calculator.append("*");
        e.preventDefault();
    }
    else if (key === "/") {
        calculator.append("/");
        e.preventDefault();
    }

    else if (key === "Enter" || key === "=") {
        calculator.calculate();
        display.focus();
        e.preventDefault();
    }

    else if (key === "Escape") {
        calculator.clear();
        e.preventDefault();
    }

    else if (key === "Backspace") {
        calculator.delete();
        e.preventDefault();
    }
    // Arrow Keys for scrolling result
    else if ((key === "ArrowLeft" || key === "ArrowRight") && document.activeElement === display) {
        handleResultScroll(key);
        e.preventDefault();
    }
});

// Handle result scrolling with arrow keys
function handleResultScroll(direction) {

    if (direction === "ArrowLeft") {
        display.scrollLeft -= scrollAmount;
    } else if (direction === "ArrowRight") {
        display.scrollLeft += scrollAmount;
    }
}