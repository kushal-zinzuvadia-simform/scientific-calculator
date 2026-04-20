'use strict'

export class Expression {
    tokenize(expr) {
        // Check for multiple decimal points in a single number (1.2.3)
        if (/\d+\.\d*\./.test(expr)) {
            throw new Error("Invalid expression: multiple decimal points in number");
        }

        // Check for consecutive functions
        if (/[+\-*/%^!]{2,}/.test(expr)) {
            throw new Error("Invalid expression: consecutive operators");
        }

        // Normalize operator symbols: × to *, ÷ to /
        expr = expr.replace(/×/g, "*").replace(/÷/g, "/");

        // (\d+\.?\d*) match integers or decimals
        //      |      OR
        // (ln|log|√|abs|sin|cos|tan|asin|acos|atan|floor|ceil|round)  match function names
        //      |      OR
        // [+\-*/%()^!]  match operators and parentheses, including ^
        //      |      OR
        // (π|e)       match pi and e constants
        const tokens = expr.match(/(\d+\.?\d*|ln|log|√|abs|sin|cos|tan|asin|acos|atan|floor|ceil|round|∛|[+\-*/%()^!]|π|e|10\^|1\/)/g);

        // Process tokens to identify unary minus
        return this.processUnaryMinus(tokens);
    }

    processUnaryMinus(tokens) {
        if (!tokens) return tokens;

        // handle implicit multiplication
        const withImplicitMult = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null;

            withImplicitMult.push(token);

            // Add implicit multiplication when:
            // 1. 9(
            // 2. )(
            // 3. )9
            // 4. 9π or 9e
            // 5. )π or )e
            // 6. π( or e(
            if (nextToken) {
                const isCurrentNumOrClose = !isNaN(token) || token === ")" || token === "π" || token === "e";
                const isNextOpenOrNum = token === "(" || !isNaN(nextToken) || nextToken === "π" || nextToken === "e";
                const isNextOpen = nextToken === "(";

                if (isCurrentNumOrClose && (isNextOpen || isNextOpenOrNum)) {
                    if ((token === ")" && nextToken === "(") ||
                        (!isNaN(token) && nextToken === "(") ||
                        (token === ")" && !isNaN(nextToken)) ||
                        (!isNaN(token) && (nextToken === "π" || nextToken === "e")) ||
                        ((token === "π" || token === "e") && nextToken === "(") ||
                        (token === ")" && (nextToken === "π" || nextToken === "e"))) {
                        withImplicitMult.push("*");
                    }
                }
            }
        }

        // handle unary minus
        const processed = [];
        for (let i = 0; i < withImplicitMult.length; i++) {
            const token = withImplicitMult[i];
            const prevToken = i > 0 ? withImplicitMult[i - 1] : null;

            // Check if "-" is unary: at start or after operator or opening paren
            if (token === "-" && (prevToken === null || "+-*/%(".includes(prevToken))) {
                processed.push("u-"); // Mark as unary minus
            } else {
                processed.push(token);
            }
        }

        return processed;
    }
}

Expression.prototype.precedence = function (op) {
    if (op === "+" || op === "-")
        return 1;
    if (op === "*" || op === "/" || op === "%")
        return 2;
    if (op === "^")
        return 3;
    if (op === "u-")
        return 4;
    if (op === "ln" || op === "log" || op === "√" || op === "abs" || op === "!")
        return 5;

    return 0;
};

// Infix to Postfix
Expression.prototype.toPostfix = function (tokens) {
    const output = [];
    const stack = [];
    const prefixFunctions = ["ln", "log", "√", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "floor", "ceil", "round", "∛"];

    tokens.forEach((token, index) => {
        if (!isNaN(token)) {
            output.push(token);
        } else if (token === "π" || token === "e") {
            output.push(token);
        }

        else if (prefixFunctions.includes(token)) {
            while (stack.length && this.precedence(stack.at(-1)) >= this.precedence(token) && stack.at(-1) !== "(") {
                output.push(stack.pop());
            }
            stack.push(token);
        }

        else if (token === "!") {
            output.push(token);
        }

        else if ("+-*/%^".includes(token)) {
            while (stack.length && this.precedence(stack.at(-1)) >= this.precedence(token)) {
                output.push(stack.pop());
            }

            stack.push(token);
        }

        else if (token === "u-") {
            while (stack.length && this.precedence(stack.at(-1)) > this.precedence(token)) {
                output.push(stack.pop());
            }
            stack.push(token);
        }

        else if (token == "(") {
            stack.push(token);
        }

        else if (token == ")") {
            while (stack.length && stack.at(-1) !== "(") {
                output.push(stack.pop());
            }

            if (stack.length === 0) {
                throw new Error("Invalid expression: missing opening parenthesis");
            }

            stack.pop();
        }
    });

    if (stack.some(token => token === "(")) {
        throw new Error("Invalid expression: unmatched opening parenthesis");
    }

    return output.concat(stack.reverse());
};

Expression.prototype.evaluatePostfix = function (postfix, mode) {
    const stack = [];
    const prefixFunctions = ["ln", "log", "√", "abs", "sin", "cos", "tan", "asin", "acos", "atan", "floor", "ceil", "round", "∛"];

    postfix.forEach(token => {
        if (!isNaN(token)) {
            stack.push(Number(token));
        } else if (token === "π") {
            stack.push(Math.PI);
        } else if (token === "e") {
            stack.push(Math.E);
        }

        else if (token === "u-") {
            const a = stack.pop();
            stack.push(-a);
        }

        else if (token === "!") {
            const n = stack.pop();
            if (!Number.isInteger(n) || n < 0) {
                throw new Error("Factorial of negative or non-integer");
            }
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result *= i;
            }
            stack.push(result);
        }

        else if (prefixFunctions.includes(token)) {
            const x = stack.pop();
            let result;

            switch (token) {
                case "ln":
                    if (x <= 0) throw new Error("ln of non-positive number");
                    result = Math.log(x);
                    break;
                case "log":
                    if (x <= 0) throw new Error("log of non-positive number");
                    result = Math.log10(x);
                    break;
                case "√":
                    if (x < 0) throw new Error("sqrt of negative number");
                    result = Math.sqrt(x);
                    break;
                case "abs":
                    result = Math.abs(x);
                    break;
                case "sin":
                    result = mode === "DEG"
                        ? Math.sin(x * Math.PI / 180)
                        : Math.sin(x);
                    break;
                case "cos":
                    result = mode === "DEG"
                        ? Math.cos(x * Math.PI / 180)
                        : Math.cos(x);
                    break;
                case "tan":
                    result = mode === "DEG"
                        ? Math.tan(x * Math.PI / 180)
                        : Math.tan(x);
                    break;
                case "asin":
                    if (x < -1 || x > 1) throw new Error("asin domain error");
                    result = mode === "DEG"
                        ? Math.asin(x) * 180 / Math.PI
                        : Math.asin(x);
                    break;
                case "acos":
                    if (x < -1 || x > 1) throw new Error("acos domain error");
                    result = mode === "DEG"
                        ? Math.acos(x) * 180 / Math.PI
                        : Math.acos(x);
                    break;
                case "atan":
                    result = mode === "DEG"
                        ? Math.atan(x) * 180 / Math.PI
                        : Math.atan(x);
                    break;
                case "floor":
                    result = Math.floor(x);
                    break;
                case "ceil":
                    result = Math.ceil(x);
                    break;
                case "round":
                    result = Math.round(x);
                    break;
                case "∛":
                    result = Math.cbrt(x);
                    break;
                default:
                    throw new Error("Unknown function: " + token);
            }
            stack.push(result);
        }

        else {
            const b = stack.pop();
            const a = stack.pop();

            if (token === "/" && b === 0) {
                throw new Error("Invalid division by zero");
            }

            switch (token) {
                case "+":
                    stack.push(a + b);
                    break;

                case "-":
                    stack.push(a - b);
                    break;

                case "*":
                    stack.push(a * b);
                    break;

                case "/":
                    stack.push(a / b);
                    break;

                case "%":
                    stack.push(a % b);
                    break;

                case "^":
                    stack.push(Math.pow(a, b));
                    break;
            }
        }
    });

    return stack[0];
};

Expression.prototype.evaluate = function (expr, mode = "DEG") {
    try {
        const tokens = this.tokenize(expr);
        const postfix = this.toPostfix(tokens);
        return this.evaluatePostfix(postfix, mode);
    } catch (err) {
        throw new Error("Invalid Expression");
    }
};