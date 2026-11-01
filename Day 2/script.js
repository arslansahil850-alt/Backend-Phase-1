"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // =================================
    // 1. MOBILE NAVIGATION & DROPDOWN
    // =================================
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    const dropdownBtn = document.querySelector(".nav-dropdown-btn");
    const dropdownMenu = document.querySelector(".nav-dropdown-menu");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.textContent = isOpen ? "✕" : "☰";
        });

        navLinks.querySelectorAll("a:not(.nav-dropdown-menu a)").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.textContent = "☰";
                if (dropdownMenu) dropdownMenu.style.display = "";
            });
        });
    }

    // Mobile dropdown toggle support
    if (dropdownBtn && dropdownMenu) {
        dropdownBtn.addEventListener("click", (e) => {
            if (window.innerWidth <= 760) {
                e.preventDefault();
                e.stopPropagation();
                const isDisplayed = dropdownMenu.style.display === "block";
                dropdownMenu.style.display = isDisplayed ? "none" : "block";
            }
        });
    }

    // =================================
    // 2. FOOTER YEAR
    // =================================
    const yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // =================================
    // 3. JAVASCRIPT PLAYGROUND
    // =================================
    const editor = document.getElementById("codeEditor");
    const output = document.getElementById("consoleOutput");
    const runButton = document.getElementById("runCode");
    const resetButton = document.getElementById("resetCode");
    const clearButton = document.getElementById("clearOutput");

    if (editor && output && runButton) {
        const starterCode = editor.value;

        function displayOutput(lines, isError = false) {
            output.textContent = lines.length
                ? lines.join("\n")
                : "Code executed. No console output.";

            output.classList.toggle("error", isError);
        }

        function formatValue(value) {
            if (typeof value === "string") return value;
            if (typeof value === "undefined") return "undefined";
            if (typeof value === "bigint") return `${value}n`;
            if (value instanceof Error) return `${value.name}: ${value.message}`;

            try {
                const result = JSON.stringify(value);
                return result !== undefined ? result : String(value);
            } catch {
                return String(value);
            }
        }

        runButton.addEventListener("click", () => {
            const code = editor.value;
            const logs = [];

            displayOutput(["Running..."]);
            runButton.disabled = true;

            const frame = document.createElement("iframe");
            frame.setAttribute("sandbox", "allow-scripts");
            frame.setAttribute("title", "Isolated JavaScript playground");
            frame.style.display = "none";

            const token = `${Date.now()}-${Math.random()}`;
            let finished = false;

            const cleanup = () => {
                window.removeEventListener("message", onMessage);
                clearTimeout(timeout);
                frame.remove();
                runButton.disabled = false;
            };

            const finish = (lines, isError = false) => {
                if (finished) return;
                finished = true;
                cleanup();
                displayOutput(lines, isError);
            };

            const onMessage = event => {
                if (event.source !== frame.contentWindow) return;
                const data = event.data;
                if (!data || data.token !== token) return;

                if (data.type === "log") {
                    logs.push(data.values.map(formatValue).join(" "));
                    return;
                }

                if (data.type === "done") {
                    finish(logs);
                    return;
                }

                if (data.type === "error") {
                    logs.push(`Error: ${data.message}`);
                    finish(logs, true);
                }
            };

            window.addEventListener("message", onMessage);

            const timeout = setTimeout(() => {
                finish([
                    ...logs,
                    "Execution stopped: the code exceeded the 2-second time limit."
                ], true);
            }, 2000);

            const safeCode = JSON.stringify(code);
            const safeToken = JSON.stringify(token);

            frame.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body>
                    <script>
                        "use strict";
                        const TOKEN = ${safeToken};
                        const send = (type, data = {}) => {
                            parent.postMessage({ token: TOKEN, type, ...data }, "*");
                        };

                        console.log = (...values) => {
                            send("log", {
                                values: values.map(value => {
                                    if (typeof value === "bigint") return value.toString() + "n";
                                    try {
                                        const json = JSON.stringify(value);
                                        return json === undefined ? String(value) : JSON.parse(json);
                                    } catch {
                                        return String(value);
                                    }
                                })
                            });
                        };

                        window.onerror = function(message) {
                            send("error", { message: String(message) });
                        };

                        try {
                            const userCode = ${safeCode};
                            new Function(userCode)();
                            send("done");
                        } catch (error) {
                            send("error", { message: error.name + ": " + error.message });
                        }
                    <\/script>
                </body>
                </html>
            `;

            document.body.appendChild(frame);
        });

        if (resetButton) {
            resetButton.addEventListener("click", () => {
                editor.value = starterCode;
                displayOutput(["Editor reset. Click Run Code to execute the example."]);
            });
        }

        if (clearButton) {
            clearButton.addEventListener("click", () => {
                displayOutput([]);
            });
        }
    }

    // =================================
    // 4. EXERCISE SOLUTIONS
    // =================================
    document.querySelectorAll(".show-solution").forEach(button => {
        button.addEventListener("click", () => {
            const solution = button.nextElementSibling;
            const isVisible = solution.classList.toggle("visible");
            button.textContent = isVisible ? "Hide Solution" : "Show Solution";
        });
    });

    // =================================
    // 5. QUIZ HANDLING
    // =================================
    const quizForm = document.getElementById("quizForm");
    const quizResult = document.getElementById("quizResult");

    const answers = {
        q1: "b",
        q2: "a",
        q3: "c",
        q4: "b",
        q5: "c"
    };

    const explanations = {
        q1: "Array destructuring assigns values according to their positions.",
        q2: "Spread expands the values of an iterable in an array literal.",
        q3: "A rest parameter uses three dots before its parameter name.",
        q4: "The first variable receives 5, and the second receives 8.",
        q5: "Object spread makes a shallow copy, so nested objects can remain shared."
    };

    if (quizForm && quizResult) {
        quizForm.addEventListener("submit", event => {
            event.preventDefault();

            let score = 0;
            const feedback = [];

            Object.keys(answers).forEach((question, index) => {
                const selected = quizForm.querySelector(`input[name="${question}"]:checked`);
                const correct = selected && selected.value === answers[question];

                if (correct) score++;

                feedback.push(`
                    <p class="${correct ? "correct" : "incorrect"}">
                        Question ${index + 1}: ${correct ? "Correct" : "Incorrect"}.
                        ${explanations[question]}
                    </p>
                `);
            });

            quizResult.innerHTML = `
                <strong>Your score: ${score}/5</strong>
                <p>${score === 5
                    ? "Excellent. You have a solid grasp of these concepts."
                    : score >= 3
                        ? "Good progress. Review the explanations for missed questions."
                        : "Review the lessons, then try again. Syntax becomes easier with practice."
                }</p>
                ${feedback.join("")}
            `;

            quizResult.classList.add("visible");
        });
    }

    // =================================
    // 6. LEARNING CHECKLIST PROGRESS
    // =================================
    const checkboxes = document.querySelectorAll(".progress-check");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    function updateProgress() {
        if (!progressFill || !progressText) return;
        const completed = [...checkboxes].filter(box => box.checked).length;
        const total = checkboxes.length;
        const percentage = (completed / total) * 100;

        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${completed} of ${total} completed`;
    }

    checkboxes.forEach(box => {
        box.addEventListener("change", updateProgress);
    });

    updateProgress();

    // =================================
    // 7. BACK TO TOP BUTTON
    // =================================
    const backToTop = document.getElementById("backToTop");

    if (backToTop) {
        function updateBackToTop() {
            backToTop.classList.toggle("show", window.scrollY > 300);
        }

        backToTop.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });

        window.addEventListener("scroll", updateBackToTop);
        updateBackToTop();
    }
});