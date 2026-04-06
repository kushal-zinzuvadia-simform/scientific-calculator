'use strict'

export class Expression {
    tokenize(expr) {
        // Check for multiple decimal points in a single number (e.g., 1.2.3)
        // digits, dot, digits, dot = invalid
        if (/\d+\.\d*\./.test(expr)) {
            throw new Error("Invalid expression: multiple decimal points in number");
        }

        // Normalize operator symbols: × to *, ÷ to /
        expr = expr.replace(/×/g, "*").replace(/÷/g, "/");

        // (\d+\.?\d*) match integers or decimals
        //      |      OR
        // [+\-*/%()]  match operators and parentheses
        const tokens = expr.match(/(\d+\.?\d*|[+\-*/%()])/g);

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

            // Add implicit multiplication (*) when:
            // 1. 9(
            // 2. )(
            // 3. )9
            if (nextToken) {
                const isCurrentNumOrClose = !isNaN(token) || token === ")";
                const isNextOpenOrNum = token === "(" || !isNaN(nextToken);
                const isNextOpen = nextToken === "(";

                if (isCurrentNumOrClose && (isNextOpen || isNextOpenOrNum)) {
                    if ((token === ")" && nextToken === "(") ||
                        (!isNaN(token) && nextToken === "(") ||
                        (token === ")" && !isNaN(nextToken))) {
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
    if (op === "u-")
        return 3;

    return 0;
};

// Infix to Postfix
Expression.prototype.toPostfix = function (tokens) {
    const output = [];
    const stack = [];

    tokens.forEach((token, index) => {
        if (!isNaN(token)) {
            output.push(token);
        }

        else if ("+-*/%".includes(token)) {
            while (stack.length && this.precedence(stack.at(-1)) >= this.precedence(token)) {
                output.push(stack.pop());
            }

            stack.push(token);
        }

        else if (token === "u-") {
            // Unary minus - push to stack with high precedence
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

            // Check if opening parenthesis exists
            if (stack.length === 0) {
                throw new Error("Invalid expression: missing opening parenthesis");
            }

            stack.pop(); // Remove the matched "("
        }
    });

    // Check for unmatched opening parentheses
    if (stack.some(token => token === "(")) {
        throw new Error("Invalid expression: unmatched opening parenthesis");
    }

    return output.concat(stack.reverse());
};

Expression.prototype.evaluatePostfix = function (postfix) {
    const stack = [];

    postfix.forEach(token => {
        if (!isNaN(token)) {
            stack.push(Number(token));
        }

        else if (token === "u-") {
            // negate the top operand
            const a = stack.pop();
            stack.push(-a);
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
            }
        }
    });

    return stack[0];
};

Expression.prototype.evaluate = function (expr) {
    try {
        const tokens = this.tokenize(expr);
        const postfix = this.toPostfix(tokens);
        return this.evaluatePostfix(postfix);
    } catch (err) {
        throw new Error("Invalid Expression");
    }
};