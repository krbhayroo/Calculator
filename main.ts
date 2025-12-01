(() => {
    const calculator = document.querySelector('.calculator-container') as HTMLElement;
    const display = calculator.querySelector('#display') as HTMLInputElement;

    function tokenize(expr: string): string[] {
        const tokens: string[] = [];
        let current = "";

        for (const char of expr) {
            if ("0123456789.".includes(char)) {
                current += char;
            } else {
                if (current) tokens.push(current);
                current = "";
                if ("+-*/^()".includes(char)) tokens.push(char);
            }
        }
        if (current) tokens.push(current);
        return tokens;
    }

    //Source: https://www.free-online-calculator-use.com/postfix-evaluator.html

    //https://www.geeksforgeeks.org/java/java-program-to-implement-shunting-yard-algorithm/
    function toPostfix(tokens: string[]): string[] {
        const output: string[] = [];
        const ops: string[] = [];

        const precedence: Record<string, number> = {
            "+": 1,
            "-": 1,
            "*": 2,
            "/": 2,
            "^": 3
        };
        const rightAssociative = new Set(["^"]);

        for (const token of tokens) {
            if (Number.isFinite(Number(token))) {
                output.push(token);
            } else if ("+-*/^".includes(token)) {
                while (
                    ops.length &&
                    "+-*/^".includes(ops[ops.length - 1]) &&
                    (
                        precedence[ops[ops.length - 1]] > precedence[token] ||
                        (precedence[ops[ops.length - 1]] === precedence[token] &&
                         !rightAssociative.has(token))
                    )
                ) {
                    output.push(ops.pop()!);
                }
                ops.push(token);
            } else if (token === "(") {
                ops.push(token);
            } else if (token === ")") {
                while (ops.length && ops[ops.length - 1] !== "(") {
                    output.push(ops.pop()!);
                }
                ops.pop(); // remove "("
            }
        }

        while (ops.length) output.push(ops.pop()!);

        return output;
    }

    function evaluatePostfix(rpn: string[]): number {
        const stack: number[] = [];

        for (const token of rpn) {
            if (Number.isFinite(Number(token))) {
                stack.push(Number(token));
            } else {
                const b = stack.pop()!;
                const a = stack.pop()!;
                let result: number;

                switch (token) {
                    case "+": result = a + b; break;
                    case "-": result = a - b; break;
                    case "*": result = a * b; break;
                    case "/": result = a / b; break;
                    case "^": result = a ** b; break;
                    default: throw new Error("Unknown operator");
                }
                stack.push(result);
            }
        }
        return stack.pop()!;
    }

    calculator.addEventListener('click', (e) => {
        const button = (e.target as HTMLElement).closest('button');
        if (!button) return;

        const type = button.dataset.type;
        const value = button.dataset.value;

        switch (type) {
            case "clear":
                display.value = "";
                break;

            case "delete":
                display.value = display.value.slice(0, -1);
                break;

            case "operator":
            case "digit":
            case "decimal":
                display.value += value;
                break;

            case "equals":
                try {
                    const tokens = tokenize(display.value);
                    const postfix = toPostfix(tokens);
                    const result = evaluatePostfix(postfix);
                    display.value = String(result);
                } catch {
                    display.value = "Error";
                }
                break;
        }
    });
})();