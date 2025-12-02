(function () {
    var calculator = document.querySelector('.calculator-container');
    var display = calculator.querySelector('#display');
    function tokenize(expr) {
        var tokens = [];
        var current = "";
        var i = 0;
        while (i < expr.length) {
            var char = expr[i];
            if (char === 'l' && expr.substr(i, 3) === 'log') {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                tokens.push('log');
                i += 3;
                continue;
            }
            else if (char === '√' || (char === 's' && expr.substr(i, 4) === 'sqrt')) {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                tokens.push('sqrt');
                i += (char === '√') ? 1 : 4;
                continue;
            }
            if ("0123456789.".includes(char)) {
                current += char;
            }
            else {
                if (current) {
                    tokens.push(current);
                    current = "";
                }
                if ("+-*/^()".includes(char)) {
                    tokens.push(char);
                }
                else if (char !== ' ') {
                }
            }
            i++;
        }
        if (current)
            tokens.push(current);
        return tokens;
    }
    function toPostfix(tokens) {
        var output = [];
        var ops = [];
        var precedence = {
            "+": 1,
            "-": 1,
            "*": 2,
            "/": 2,
            "^": 3,
            "log": 4,
            "sqrt": 4
        };
        var rightAssociative = new Set(["^", "log", "sqrt"]);
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (!isNaN(Number(token)) && token !== "") {
                output.push(token);
            }
            else if (["+", "-", "*", "/", "^", "log", "sqrt"].includes(token)) {
                while (ops.length &&
                    ops[ops.length - 1] !== "(" &&
                    (precedence[ops[ops.length - 1]] > precedence[token] ||
                        (precedence[ops[ops.length - 1]] === precedence[token] &&
                            !rightAssociative.has(token)))) {
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
                if (ops[ops.length - 1] === "(") {
                    ops.pop();
                }
                if (ops.length && ["log", "sqrt"].includes(ops[ops.length - 1])) {
                    output.push(ops.pop());
                }
            }
        }
        while (ops.length) {
            var op = ops.pop();
            if (op !== "(") {
                output.push(op);
            }
        }
        return output;
    }
    function evaluatePostfix(rpn) {
        var stack = [];
        for (var _i = 0, rpn_1 = rpn; _i < rpn_1.length; _i++) {
            var token = rpn_1[_i];
            if (!isNaN(Number(token))) {
                stack.push(Number(token));
            }
            else if (["+", "-", "*", "/", "^"].includes(token)) {
                if (stack.length < 2)
                    throw new Error("Insufficient operands");
                var b = stack.pop();
                var a = stack.pop();
                var result = void 0;
                switch (token) {
                    case "+":
                        result = a + b;
                        break;
                    case "-":
                        result = a - b;
                        break;
                    case "*":
                        result = a * b;
                        break;
                    case "/":
                        if (b === 0)
                            throw new Error("Division by zero");
                        result = a / b;
                        break;
                    case "^":
                        result = Math.pow(a, b);
                        break;
                    default:
                        throw new Error("Unknown operator");
                }
                stack.push(result);
            }
            else if (["log", "sqrt"].includes(token)) {
                if (stack.length < 1)
                    throw new Error("Insufficient operands");
                var a = stack.pop();
                var result = void 0;
                switch (token) {
                    case "log":
                        if (a <= 0)
                            throw new Error("Log of non-positive number");
                        result = Math.log10(a);
                        break;
                    case "sqrt":
                        if (a < 0)
                            throw new Error("Square root of negative number");
                        result = Math.sqrt(a);
                        break;
                    default:
                        throw new Error("Unknown function");
                }
                stack.push(result);
            }
        }
        if (stack.length !== 1)
            throw new Error("Invalid expression");
        return stack.pop();
    }
    calculator.addEventListener('click', function (e) {
        var button = e.target.closest('button');
        if (!button)
            return;
        var type = button.dataset.type;
        var value = button.dataset.value;
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
                if (value === "sqrt") {
                    display.value += "√";
                }
                else if (value === "log") {
                    display.value += "log";
                }
                else {
                    display.value += value;
                }
                break;
            case "equals":
                try {
                    if (!display.value.trim())
                        return;
                    var expression_1 = display.value.replace(/√/g, 'sqrt');
                    var tokens = tokenize(expression_1);
                    console.log("Tokens:", tokens);
                    var postfix = toPostfix(tokens);
                    console.log("Postfix:", postfix);
                    var result = evaluatePostfix(postfix);
                    if (Math.abs(result - Math.round(result)) < 1e-10) {
                        display.value = String(Math.round(result));
                    }
                    else {
                        var rounded = Math.round(result * 1e10) / 1e10;
                        display.value = String(rounded);
                    }
                }
                catch (error) {
                    console.error("Calculation error:", error);
                    display.value = "Error";
                }
                break;
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key >= '0' && e.key <= '9') {
            display.value += e.key;
        }
        else if (['+', '-', '*', '/', '^', '(', ')', '.'].includes(e.key)) {
            display.value += e.key;
        }
        else if (e.key === 'Enter' || e.key === '=') {
            var equalsBtn = calculator.querySelector('[data-type="equals"]');
            equalsBtn.click();
        }
        else if (e.key === 'Escape') {
            display.value = '';
        }
        else if (e.key === 'Backspace') {
            display.value = display.value.slice(0, -1);
        }
        else if (e.key.toLowerCase() === 'l') {
            display.value += 'log';
        }
        e.preventDefault();
    });
})();