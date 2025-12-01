(function () {
    var calculator = document.querySelector('.calculator-container');
    var display = calculator.querySelector('#display');
    function tokenize(expr) {
        var tokens = [];
        var current = "";
        for (var _i = 0, expr_1 = expr; _i < expr_1.length; _i++) {
            var char = expr_1[_i];
            if ("0123456789.".includes(char)) {
                current += char;
            }
            else {
                if (current)
                    tokens.push(current);
                current = "";
                if ("+-*/^()".includes(char))
                    tokens.push(char);
            }
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
            "^": 3
        };
        var rightAssociative = new Set(["^"]);
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            if (Number.isFinite(Number(token))) {
                output.push(token);
            }
            else if ("+-*/^".includes(token)) {
                while (ops.length &&
                    "+-*/^".includes(ops[ops.length - 1]) &&
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
                ops.pop(); // remove "("
            }
        }
        while (ops.length)
            output.push(ops.pop());
        return output;
    }
    function evaluatePostfix(rpn) {
        var stack = [];
        for (var _i = 0, rpn_1 = rpn; _i < rpn_1.length; _i++) {
            var token = rpn_1[_i];
            if (Number.isFinite(Number(token))) {
                stack.push(Number(token));
            }
            else {
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
                        result = a / b;
                        break;
                    case "^":
                        result = Math.pow(a, b);
                        break;
                    default: throw new Error("Unknown operator");
                }
                stack.push(result);
            }
        }
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
            case "equals":
                try {
                    var tokens = tokenize(display.value);
                    var postfix = toPostfix(tokens);
                    var result = evaluatePostfix(postfix);
                    display.value = String(result);
                }
                catch (_a) {
                    display.value = "Error";
                }
                break;
        }
    });
})();