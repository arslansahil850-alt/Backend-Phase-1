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
        let activeRun = null;

        function showOutput(lines, isError = false) {
            output.textContent = lines.length
                ? lines.join("\n")
                : "No console output.";

            output.classList.toggle("error", isError);
        }

        function stopActiveRun() {
            if (!activeRun) return;

            clearTimeout(activeRun.timeout);
            window.removeEventListener("message", activeRun.onMessage);
            activeRun.frame.remove();

            activeRun = null;
            runButton.disabled = false;
        }

        runButton.addEventListener("click", () => {
            stopActiveRun();

            const frame = document.createElement("iframe");
            const token = `${Date.now()}-${Math.random()}`;
            const logs = [];

            frame.setAttribute("sandbox", "allow-scripts");
            frame.setAttribute("title", "Isolated JavaScript playground");
            frame.style.display = "none";

            let finished = false;

            const cleanup = () => {
                clearTimeout(timeout);
                window.removeEventListener("message", onMessage);
                frame.remove();

                if (activeRun?.frame === frame) {
                    activeRun = null;
                }

                runButton.disabled = false;
            };

            const finish = (lines, isError = false) => {
                if (finished) return;

                finished = true;
                cleanup();
                showOutput(lines, isError);
            };

            const onMessage = event => {
                if (event.source !== frame.contentWindow) return;

                const data = event.data;

                if (!data || data.token !== token) return;

                if (data.type === "log") {
                    logs.push(data.values.map(value => {
                        if (typeof value === "string") return value;

                        try {
                            return JSON.stringify(value);
                        } catch {
                            return String(value);
                        }
                    }).join(" "));

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
                    "Execution stopped because the 2-second time limit was reached."
                ], true);
            }, 2000);

            activeRun = { frame, timeout, onMessage };
            runButton.disabled = true;
            showOutput(["Running..."]);

            const code = JSON.stringify(editor.value);
            const safeToken = JSON.stringify(token);

            frame.srcdoc = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body>
                    <script>
                        "use strict";

                        const token = ${safeToken};

                        function send(type, data = {}) {
                            parent.postMessage({
                                token,
                                type,
                                ...data
                            }, "*");
                        }

                        function serialize(value) {
                            if (typeof value === "bigint") {
                                return value.toString() + "n";
                            }

                            if (value instanceof Error) {
                                return value.name + ": " + value.message;
                            }

                            try {
                                const result = JSON.stringify(value);

                                return result === undefined
                                    ? String(value)
                                    : JSON.parse(result);
                            } catch {
                                return String(value);
                            }
                        }

                        console.log = (...values) => {
                            send("log", {
                                values: values.map(serialize)
                            });
                        };

                        window.onerror = message => {
                            send("error", {
                                message: String(message)
                            });
                        };

                        try {
                            new Function(${code})();
                            send("done");
                        } catch (error) {
                            send("error", {
                                message: error.name + ": " + error.message
                            });
                        }
                    <\/script>
                </body>
                </html>
            `;

            document.body.appendChild(frame);
        });

        if (resetButton) {
            resetButton.addEventListener("click", () => {
                stopActiveRun();
                editor.value = starterCode;
                showOutput(["Editor reset. Click Run Code to execute the example."]);
            });
        }

        if (clearButton) {
            clearButton.addEventListener("click", () => {
                showOutput([]);
            });
        }
    }

    // =================================
    // 4. EXERCISE SOLUTIONS
    // =================================
    document.querySelectorAll(".show-solution").forEach(button => {
        button.addEventListener("click", () => {
            const solution = button.nextElementSibling;
            const visible = solution.classList.toggle("visible");

            button.textContent = visible
                ? "Hide Solution"
                : "Show Solution";
        });
    });

    // =================================
    // 5. QUIZ HANDLING
    // =================================
    const quizForm = document.getElementById("quizForm");
    const quizResult = document.getElementById("quizResult");

    const answers = {
        q1: "b",
        q2: "c",
        q3: "a",
        q4: "b",
        q5: "a"
    };

    const explanations = {
        q1: "The export keyword exposes values from a module.",
        q2: "Named imports use curly braces and the exported name.",
        q3: "A module can have only one default export.",
        q4: "The as keyword gives the imported value a different local name.",
        q5: 'Setting "type": "module" in package.json is a common way to enable ES modules in Node.js.'
    };

    if (quizForm && quizResult) {
        quizForm.addEventListener("submit", event => {
            event.preventDefault();

            let score = 0;
            const feedback = [];

            Object.keys(answers).forEach((question, index) => {
                const selected = quizForm.querySelector(
                    `input[name="${question}"]:checked`
                );

                const correct = selected?.value === answers[question];

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
                    ? "Excellent work. You understand JavaScript modules."
                    : score >= 3
                        ? "Good progress. Review the missed concepts."
                        : "Review the lessons and try the quiz again."
                }</p>
                ${feedback.join("")}
            `;

            quizResult.classList.add("visible");
        });
    }

    // =================================
    // 6. PROGRESS CHECKLIST
    // =================================
    const checkboxes = document.querySelectorAll(".progress-check");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");

    function updateProgress() {
        if (!progressFill || !progressText) return;
        const completed = [...checkboxes].filter(box => box.checked).length;
        const total = checkboxes.length;

        progressFill.style.width = `${(completed / total) * 100}%`;
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