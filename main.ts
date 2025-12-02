(() => {
    const calculator = document.querySelector('.calculator-container') as HTMLElement;
    const display = calculator.querySelector('#display') as HTMLInputElement;

    function tokenize(expr: string): string[] {
        const tokens: string[] = [];
        let current = "";
        let i = 0;

        while (i < expr.length) {
            const char = expr[i];
            
            // Handle function names (log, sqrt)
            if (char === 'l' && expr.substr(i, 3) === 'log') {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                tokens.push('log');
                i += 3;
                continue;
            } else if (char === '√' || (char === 's' && expr.substr(i, 4) === 'sqrt')) {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                tokens.push('sqrt');
                i += (char === '√') ? 1 : 4;
                continue;
            }
            
            // Handle numbers and decimal points
            if ("0123456789.".includes(char)) {
                current += char;
            } else {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                if ("+-*/^()".includes(char)) {
                    tokens.push(char);
                }
                // Skip whitespace
                else if (char !== ' ') {
                    // Handle unrecognized characters if needed
                }
            }
            i++;
        }
        if (current) tokens.push(current);
        return tokens;
    }

    function toPostfix(tokens: string[]): string[] {
        const output: string[] = [];
        const ops: string[] = [];

        const precedence: Record<string, number> = {
            "+": 1,
            "-": 1,
            "*": 2,
            "/": 2,
            "^": 3,
            "log": 4,
            "sqrt": 4
        };
        
        // Functions are right associative
        const rightAssociative = new Set(["^", "log", "sqrt"]);

        for (const token of tokens) {
            // Handle numbers
            if (!isNaN(Number(token)) && token !== "") {
                output.push(token);
            } 
            // Handle functions and operators
            else if (["+", "-", "*", "/", "^", "log", "sqrt"].includes(token)) {
                while (
                    ops.length &&
                    ops[ops.length - 1] !== "(" &&
                    (
                        precedence[ops[ops.length - 1]] > precedence[token] ||
                        (precedence[ops[ops.length - 1]] === precedence[token] &&
                         !rightAssociative.has(token))
                    )
                ) {
                    output.push(ops.pop()!);
                }
                ops.push(token);
            } 
            else if (token === "(") {
                ops.push(token);
            } 
            else if (token === ")") {
                while (ops.length && ops[ops.length - 1] !== "(") {
                    output.push(ops.pop()!);
                }
                if (ops[ops.length - 1] === "(") {
                    ops.pop(); // remove "("
                }
                // Check if the previous token in ops is a function
                if (ops.length && ["log", "sqrt"].includes(ops[ops.length - 1])) {
                    output.push(ops.pop()!);
                }
            }
        }

        while (ops.length) {
            const op = ops.pop()!;
            if (op !== "(") {
                output.push(op);
            }
        }

        return output;
    }

    function evaluatePostfix(rpn: string[]): number {
        const stack: number[] = [];

        for (const token of rpn) {
            // Handle numbers
            if (!isNaN(Number(token))) {
                stack.push(Number(token));
            } 
            // Handle binary operators
            else if (["+", "-", "*", "/", "^"].includes(token)) {
                if (stack.length < 2) throw new Error("Insufficient operands");
                const b = stack.pop()!;
                const a = stack.pop()!;
                let result: number;

                switch (token) {
                    case "+": result = a + b; break;
                    case "-": result = a - b; break;
                    case "*": result = a * b; break;
                    case "/": 
                        if (b === 0) throw new Error("Division by zero");
                        result = a / b; 
                        break;
                    case "^": result = Math.pow(a, b); break;
                    default: throw new Error("Unknown operator");
                }
                stack.push(result);
            }
            // Handle unary functions
            else if (["log", "sqrt"].includes(token)) {
                if (stack.length < 1) throw new Error("Insufficient operands");
                const a = stack.pop()!;
                let result: number;

                switch (token) {
                    case "log":
                        if (a <= 0) throw new Error("Log of non-positive number");
                        result = Math.log10(a);
                        break;
                    case "sqrt":
                        if (a < 0) throw new Error("Square root of negative number");
                        result = Math.sqrt(a);
                        break;
                    default: throw new Error("Unknown function");
                }
                stack.push(result);
            }
        }

        if (stack.length !== 1) throw new Error("Invalid expression");
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

            case "function":
                // For functions, we need to handle them specially
                if (value === "sqrt") {
                    display.value += "√";
                } else if (value === "log") {
                    display.value += "log";
                } else {
                    display.value += value;
                }
                break;

            case "equals":
                try {
                    if (!display.value.trim()) return;
                    
                    // Replace √ with sqrt for parsing
                    let expression = display.value.replace(/√/g, 'sqrt');
                    const tokens = tokenize(expression);
                    console.log("Tokens:", tokens);
                    const postfix = toPostfix(tokens);
                    console.log("Postfix:", postfix);
                    const result = evaluatePostfix(postfix);
                    
                    // Format result to avoid floating point weirdness
                    if (Math.abs(result - Math.round(result)) < 1e-10) {
                        display.value = String(Math.round(result));
                    } else {
                        // Round to 10 decimal places to avoid floating point issues
                        const rounded = Math.round(result * 1e10) / 1e10;
                        display.value = String(rounded);
                    }
                } catch (error: any) {
                    console.error("Calculation error:", error);
                    display.value = "Error: ";
                }
                break;
        }
    });

    // Add keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key >= '0' && e.key <= '9') {
            display.value += e.key;
        } else if (['+', '-', '*', '/', '^', '(', ')', '.'].includes(e.key)) {
            display.value += e.key;
        } else if (e.key === 'Enter' || e.key === '=') {
            const equalsBtn = calculator.querySelector('[data-type="equals"]') as HTMLButtonElement;
            equalsBtn.click();
        } else if (e.key === 'Escape') {
            display.value = '';
        } else if (e.key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        } else if (e.key.toLowerCase() === 'l') {
            display.value += 'log';
        }
        e.preventDefault();
    });
})();