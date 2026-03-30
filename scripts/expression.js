export class Expression {
    tokenize(expr) {
        // Normalize operator symbols: × to *, ÷ to /
        expr = expr.replace(/×/g, "*").replace(/÷/g, "/");
        return expr.match(/(\d+\.?\d*|[+\-*/()])/g);
    }
}

Expression.prototype.precedence = function (op) {
    if (op === "+" || op === "-")
        return 1;
    if (op === "*" || op === "/")
        return 2;

    return 0;
};

// Infix to Postfix
Expression.prototype.toPostfix = function (tokens) {
    const output = [];
    const stack = [];

    tokens.forEach(token => {
        if (!isNaN(token)) {
            output.push(token);
        }

        else if ("+-*/".includes(token)) {
            while (stack.length && this.precedence(stack.at(-1)) >= this.precedence(token)) {
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
            }
        }
    });

    return stack[0];
};

Expression.prototype.evaluate = function (expr) {
    console.log("Evaluating expression..." + expr);
    try {
        const tokens = this.tokenize(expr);
        console.log("Tokenized expression..." + tokens);
        const postfix = this.toPostfix(tokens);
        return this.evaluatePostfix(postfix);
    } catch (err) {
        throw new Error("Invalid Expression");
    }
};