import { Calculator } from "./Calculator.js";

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
    if (calculator.history.getAll().length === 0) {
        alert("History is empty");
    } else if (confirm("Are you sure you want to clear history?")) {
        calculator.clearHistory();
    }
});

// Button click handlers
document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
        let value = btn.innerText;

        if (value === "=") {
            calculator.calculate();
            // Focus on display after calculation for arrow key scrolling
            display.focus();
        } else if (value === "C") {
            calculator.clear();
        } else if (btn.getAttribute("aria-label") === "Backspace") {
            calculator.delete();
        } else if (btn.id === "historyToggle" || btn.id === "clearHistory") {
            // Ignore these buttons
        } else {
            if (value === "mod") {
                value = "%";
            }
            calculator.append(value);
        }
    });
});

// Keyboard input support
document.addEventListener("keydown", (e) => {
    const key = e.key;

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
    const scrollAmount = 30;

    if (direction === "ArrowLeft") {
        display.scrollLeft -= scrollAmount;
    } else if (direction === "ArrowRight") {
        display.scrollLeft += scrollAmount;
    }
}