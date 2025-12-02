(() => {
    // Global state for the Shift function
    let isShifted = false;
    const DEGREES_TO_RADIANS = Math.PI / 180;

    const calculator = document.querySelector('.calculator-container');
    const display = calculator.querySelector('#display');

    /**
     * Helper function for factorial calculation (Gamma function approximation).
     */
    function gamma(n) {
        // Factorial function
        if (n < 0) throw new Error("Factorial of negative number");
        if (n === 0 || n === 1) return 1;
        if (n > 170) return Infinity; // Max integer factorial in JS is n=170

        // Simple loop for integers
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
     * Converts the expression string into an array of tokens (numbers, operators, functions).
     */
    function tokenize(expr) {
        const tokens = [];
        let current = "";
        let i = 0;

        // List of all functions to recognize (Updated list)
        const functions = [
            "log", "sqrt", "sin", "cos", "tan", "ln", "asin", "acos", "atan", "e^x",
            "abs", "fact", "1/x"
        ];
        
        // Symbols recognized outside of the function list
        const singleCharSymbols = "+-*/^()√"; 

        while (i < expr.length) {
            const char = expr[i];
            
            // 1. Check for functions first
            let funcFound = false;
            for (const func of functions) {
                if (expr.substring(i, i + func.length) === func) {
                    if (current) {
                        tokens.push(current);
                        current = "";
                    }
                    tokens.push(func);
                    i += func.length;
                    funcFound = true;
                    break;
                }
            }
            if (funcFound) continue;

            // 2. Handle numbers and decimal points
            if ("0123456789.".includes(char)) {
                current += char;
            } else {
                // If we hit an operator, push the current number
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                // 3. Handle operators
                if (singleCharSymbols.includes(char)) {
                    // Replace legacy √ with 'sqrt' token
                    tokens.push(char === '√' ? 'sqrt' : char);
                }
            }
            i++;
        }
        if (current) tokens.push(current);
        return tokens;
    }

    /**
     * Converts infix tokens to Reverse Polish Notation (RPN) using the Shunting-Yard algorithm.
     */
    function toPostfix(tokens) {
        const output = [];
        const ops = [];

        const precedence = {
            "+": 1, "-": 1,
            "*": 2, "/": 2,
            "^": 3,
            // All unary functions have high precedence
            "log": 4, "sqrt": 4, "sin": 4, "cos": 4, "tan": 4, "ln": 4, "asin": 4, "acos": 4, "atan": 4,
            "e^x": 4, "abs": 4, "fact": 4, "1/x": 4
        };
        
        // Functions and exponentiation (^) are right associative
        const rightAssociative = new Set([
            "^", "log", "sqrt", "sin", "cos", "tan", "ln", "asin", "acos", "atan", "e^x",
            "abs", "fact", "1/x"
        ]);
        
        const isOperatorOrFunction = (token) => 
            (precedence[token] !== undefined);

        for (const token of tokens) {
            if (!isNaN(Number(token)) && token !== "") {
                output.push(token);
            } 
            else if (isOperatorOrFunction(token)) {
                while (
                    ops.length &&
                    ops[ops.length - 1] !== "(" &&
                    (
                        precedence[ops[ops.length - 1]] > precedence[token] ||
                        (precedence[ops[ops.length - 1]] === precedence[token] && !rightAssociative.has(token))
                    )
                ) {
                    output.push(ops.pop());
                }
                ops.push(token);
            } 
            else if (token === "(") {
                ops.push(token);
            } 
            else if (token === ")") {
                while (ops.length && ops[ops.length - 1] !== "(") {
                    output.push(ops.pop());
                }
                if (ops.length && ops[ops.length - 1] === "(") {
                    ops.pop(); // remove "("
                }
                // Pop function if it was before the parenthesis
                if (ops.length && precedence[ops[ops.length - 1]] === 4) {
                    output.push(ops.pop());
                }
            }
        }

        while (ops.length) {
            const op = ops.pop();
            if (op !== "(") {
                output.push(op);
            }
        }

        return output;
    }

    /**
     * Evaluates the Reverse Polish Notation (RPN) array.
     */
    function evaluatePostfix(rpn) {
        const stack = [];

        for (const token of rpn) {
            // Handle numbers
            if (!isNaN(Number(token))) {
                stack.push(Number(token));
            } 
            // Handle binary operators
            else if (["+", "-", "*", "/", "^"].includes(token)) {
                if (stack.length < 2) throw new Error("Insufficient operands");
                const b = stack.pop();
                const a = stack.pop();
                let result;

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
            else if (["log", "sqrt", "sin", "cos", "tan", "ln", "asin", "acos", "atan", "e^x", "abs", "fact", "1/x"].includes(token)) {
                if (stack.length < 1) throw new Error("Insufficient operands for function");
                const a = stack.pop();
                let result;

                switch (token) {
                    // Log/Root
                    case "log": 
                        if (a <= 0) throw new Error("Log of non-positive number");
                        result = Math.log10(a); 
                        break;
                    case "sqrt":
                        if (a < 0) throw new Error("Square root of negative number");
                        result = Math.sqrt(a);
                        break;
                    case "ln": result = Math.log(a); break;
                    
                    // Exponent/Trig
                    case "e^x": result = Math.exp(a); break;
                    case "sin": result = Math.sin(a * DEGREES_TO_RADIANS); break;
                    case "cos": result = Math.cos(a * DEGREES_TO_RADIANS); break;
                    case "tan": 
                        if (Math.abs(a % 90) < 1e-9 && a % 180 !== 0) throw new Error("Domain Error: tan(90°)");
                        result = Math.tan(a * DEGREES_TO_RADIANS); 
                        break;

                    // Inverse Trig 
                    case "asin": 
                        if (Math.abs(a) > 1) throw new Error("Domain Error: asin(x) where |x| > 1");
                        result = Math.asin(a) / DEGREES_TO_RADIANS; 
                        break;
                    case "acos":
                        if (Math.abs(a) > 1) throw new Error("Domain Error: acos(x) where |x| > 1");
                        result = Math.acos(a) / DEGREES_TO_RADIANS;
                        break;
                    case "atan": result = Math.atan(a) / DEGREES_TO_RADIANS; break;

                    // New Unary Functions
                    case "abs": result = Math.abs(a); break;
                    case "fact": 
                        // Check if the input is a non-negative integer for factorial
                        if (a < 0 || Math.abs(a - Math.round(a)) > 1e-9) throw new Error("Factorial requires non-negative integer");
                        result = gamma(a); 
                        break;
                    case "1/x":
                        if (a === 0) throw new Error("Division by zero");
                        result = 1 / a;
                        break;
                        
                    default: throw new Error("Unknown function");
                }
                stack.push(result);
            }
        }

        if (stack.length !== 1) throw new Error("Invalid expression");
        return stack.pop();
    }

    calculator.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const type = button.dataset.type;
        let value = button.dataset.value;
        const shiftButton = calculator.querySelector('[data-value="shift"]');

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
                if (value === "shift") {
                    isShifted = !isShifted;
                    // Visually update the shift key
                    shiftButton.textContent = isShifted ? 'Shift (ON)' : 'Shift';
                } 
                else if (value === "pi") {
                    display.value += String(Math.PI).slice(0, 11); 
                } 
                else if (value === "e") {
                    display.value += String(Math.E).slice(0, 11); 
                }
                else {
                    let funcName = value;
                    // Apply 2nd function logic
                    if (isShifted) {
                        if (value === "sin") funcName = "asin"; 
                        if (value === "cos") funcName = "acos"; 
                        if (value === "tan") funcName = "atan"; 
                        if (value === "log") funcName = "e^x";   // Shift+log = e^x
                        if (value === "abs") funcName = "sqrt"; // Shift+abs = sqrt
                        if (value === "fact") funcName = "ln"; // Shift+fact = ln
                    }
                    
                    display.value += funcName; 
                    
                    // Reset shift after selecting any function
                    if (isShifted) {
                         isShifted = false;
                         shiftButton.textContent = 'Shift';
                    }
                }
                break;

            case "equals":
                try {
                    if (!display.value.trim()) return;
                    
                    // Cleanup for parsing
                    let expression = display.value.replace(/√/g, 'sqrt'); 
                    
                    const tokens = tokenize(expression);
                    const postfix = toPostfix(tokens);
                    const result = evaluatePostfix(postfix);
                    
                    // Round result for cleaner display
                    const rounded = Math.round(result * 1e10) / 1e10;
                    display.value = String(rounded);
                } catch (error) {
                    console.error("Calculation error:", error);
                    display.value = "Error: " + error.message.split(':').pop().trim();
                }
                break;
        }
    });

    // Add keyboard support (enhanced for scientific functions)
    document.addEventListener('keydown', (e) => {
        // Standard digits and operators
        if (e.key >= '0' && e.key <= '9') {
            display.value += e.key;
        } else if (['+', '-', '*', '/', '^', '(', ')', '.'].includes(e.key)) {
            display.value += e.key;
        } 
        // Controls
        else if (e.key === 'Enter' || e.key === '=') {
            const equalsBtn = calculator.querySelector('[data-type="equals"]');
            if(equalsBtn) equalsBtn.click();
        } else if (e.key === 'Escape') {
            display.value = '';
        } else if (e.key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        }
        // Scientific Function shortcuts
        else if (e.key.toLowerCase() === 'p') { // Pi
            display.value += String(Math.PI).slice(0, 11); 
        } else if (e.key.toLowerCase() === 'e') { // Euler's e
            display.value += String(Math.E).slice(0, 11); 
        } else if (e.key.toLowerCase() === 's') {
            display.value += 'sin';
        } else if (e.key.toLowerCase() === 'l') {
            display.value += 'log';
        }

        // Prevent default actions for calculator keys
        if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '^', '(', ')', '.', 'Enter', '=', 'Escape', 'Backspace'].includes(e.key) || ['p', 'e', 's', 'l', 'c', 't'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });
})();