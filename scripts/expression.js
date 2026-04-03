export class Expression {
    tokenize(expr) {
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

        const processed = [];
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const prevToken = i > 0 ? tokens[i - 1] : null;

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
            stack.pop();
        }
    });

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