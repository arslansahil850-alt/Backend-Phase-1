"use strict";

/* =================================
   1. SELECT DOM ELEMENTS
================================= */

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];


/* =================================
   2. MOBILE NAVIGATION SYSTEM
================================= */

const menuToggle = $("#menuToggle");
const navLinks = $(".nav-links");
const dropdownBtn = $(".nav-dropdown-btn");
const dropdownMenu = $(".nav-dropdown-menu");

function closeMenu() {
    if (!navLinks || !menuToggle) return;
    
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.textContent = "☰";

    // Close mobile dropdown if expanded
    if (dropdownMenu) {
        dropdownMenu.style.display = "";
    }
}

if (menuToggle && navLinks) {
    // Toggle mobile main navigation menu
    menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation" : "Open navigation"
        );

        menuToggle.textContent = isOpen ? "✕" : "☰";
    });

    // Toggle dropdown specifically on mobile click/tap
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

    // Close menu when clicking navigation links (excluding dropdown toggle button)
    $$(".nav-links a").forEach(link => {
        link.addEventListener("click", () => {
            closeMenu();
        });
    });

    // Close menu when clicking outside of navbar on mobile
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 760 && navLinks.classList.contains("open")) {
            if (!e.target.closest(".navbar")) {
                closeMenu();
            }
        }
    });

    // Close on Escape key press
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    // Reset menu on window resize
    window.addEventListener("resize", () => {
        if (window.innerWidth > 760) {
            closeMenu();
        }
    });
}


/* =================================
   3. COPY CODE BUTTONS
================================= */

$$("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
        const targetId = button.dataset.copy;
        const codeElement = document.getElementById(targetId);

        if (!codeElement) {
            return;
        }

        const originalText = button.textContent;

        try {
            await navigator.clipboard.writeText(
                codeElement.textContent
            );

            button.textContent = "Copied!";

        } catch (error) {
            console.error("Could not copy code:", error);

            button.textContent = "Copy failed";
        }

        window.setTimeout(() => {
            button.textContent = originalText;
        }, 1500);
    });
});


/* =================================
   4. JAVASCRIPT PLAYGROUND
================================= */

const codeEditor = $("#codeEditor");
const runButton = $("#runCode");
const clearConsoleButton = $("#clearConsole");
const consoleOutput = $("#consoleOutput");

let activeRunId = 0;
let activeFrame = null;

function displayOutput(message, type = "log") {
    if (!consoleOutput) return;
    const line = document.createElement("div");

    line.className = `console-line console-${type}`;
    line.textContent = message;

    consoleOutput.appendChild(line);
}

function runJavaScript() {
    if (!codeEditor || !runButton || !consoleOutput) return;

    const code = codeEditor.value;
    const runId = ++activeRunId;

    consoleOutput.replaceChildren();

    if (activeFrame) {
        activeFrame.remove();
        activeFrame = null;
    }

    runButton.disabled = true;
    runButton.textContent = "Running...";

    const frame = document.createElement("iframe");
    activeFrame = frame;

    frame.title = "Isolated JavaScript playground";
    frame.setAttribute("sandbox", "allow-scripts");
    frame.style.display = "none";

    const source = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body>
            <script>
                "use strict";

                const safePrint = value => {
                    if (typeof value === "string") {
                        return value;
                    }

                    if (typeof value === "undefined") {
                        return "undefined";
                    }

                    if (typeof value === "bigint") {
                        return value.toString() + "n";
                    }

                    try {
                        const result = JSON.stringify(value);

                        return result === undefined
                            ? String(value)
                            : result;

                    } catch {
                        return String(value);
                    }
                };

                const sendMessage = (type, values) => {
                    parent.postMessage({
                        source: "arslan-weblab-playground",
                        runId: ${runId},
                        type,
                        values
                    }, "*");
                };

                console.log = (...values) => {
                    sendMessage(
                        "log",
                        values.map(safePrint)
                    );
                };

                console.info = (...values) => {
                    sendMessage(
                        "info",
                        values.map(safePrint)
                    );
                };

                console.warn = (...values) => {
                    sendMessage(
                        "warn",
                        values.map(safePrint)
                    );
                };

                console.error = (...values) => {
                    sendMessage(
                        "error",
                        values.map(safePrint)
                    );
                };

                window.onerror = function(message) {
                    sendMessage("error", [String(message)]);
                };

                window.onunhandledrejection = function(event) {
                    sendMessage("error", [
                        "Unhandled promise rejection: " +
                        safePrint(event.reason)
                    ]);
                };

                window.addEventListener("message", event => {
                    if (
                        event.data?.source !==
                        "arslan-weblab-playground-parent"
                    ) {
                        return;
                    }

                    if (event.data.runId !== ${runId}) {
                        return;
                    }

                    try {
                        const run = new Function(
                            event.data.code
                        );

                        run();

                        sendMessage("done", []);

                    } catch (error) {
                        sendMessage("error", [
                            error.message || String(error)
                        ]);

                        sendMessage("done", []);
                    }
                });

                sendMessage("ready", []);
            <\/script>
        </body>
        </html>
    `;

    let finished = false;

    const finish = () => {
        if (finished) {
            return;
        }

        finished = true;

        runButton.disabled = false;
        runButton.textContent = "▶ Run Code";
    };

    const timeoutId = window.setTimeout(() => {
        if (runId !== activeRunId) {
            return;
        }

        displayOutput(
            "Execution timed out or did not finish.",
            "error"
        );

        finish();
    }, 3000);

    function handleMessage(event) {
        if (event.source !== frame.contentWindow) {
            return;
        }

        const data = event.data;

        if (
            !data ||
            data.source !== "arslan-weblab-playground" ||
            data.runId !== runId
        ) {
            return;
        }

        if (data.type === "ready") {
            frame.contentWindow.postMessage(
                {
                    source: "arslan-weblab-playground-parent",
                    runId,
                    code
                },
                "*"
            );

            return;
        }

        if (data.type === "done") {
            window.clearTimeout(timeoutId);
            window.removeEventListener("message", handleMessage);

            if (
                consoleOutput.childElementCount === 0
            ) {
                displayOutput(
                    "Code executed successfully. No console output."
                );
            }

            finish();
            return;
        }

        if (Array.isArray(data.values)) {
            displayOutput(
                data.values.join(" "),
                data.type
            );
        }
    }

    window.addEventListener("message", handleMessage);

    frame.srcdoc = source;

    document.body.appendChild(frame);
}

if (runButton) {
    runButton.addEventListener("click", runJavaScript);
}


/* =================================
   5. CLEAR PLAYGROUND CONSOLE
================================= */

if (clearConsoleButton && consoleOutput) {
    clearConsoleButton.addEventListener("click", () => {
        consoleOutput.replaceChildren();
        displayOutput("Console cleared.");
    });
}


/* =================================
   6. DAY 1 QUIZ
================================= */

const quizForm = $("#quizForm");
const quizResult = $("#quizResult");

const correctAnswers = {
    q1: "b",
    q2: "a",
    q3: "c",
    q4: "b",
    q5: "a"
};

if (quizForm && quizResult) {
    quizForm.addEventListener("submit", event => {
        event.preventDefault();

        const formData = new FormData(quizForm);
        const totalQuestions = Object.keys(correctAnswers).length;

        let score = 0;
        let unanswered = 0;

        for (const [question, correctAnswer] of Object.entries(
            correctAnswers
        )) {
            const selectedAnswer = formData.get(question);

            if (!selectedAnswer) {
                unanswered++;
                continue;
            }

            if (selectedAnswer === correctAnswer) {
                score++;
            }
        }

        if (unanswered > 0) {
            quizResult.className = "quiz-result error";
            quizResult.textContent =
                `Answer all questions first. ${unanswered} question(s) remain.`;
            return;
        }

        const percentage = Math.round(
            (score / totalQuestions) * 100
        );

        quizResult.className =
            score === totalQuestions
                ? "quiz-result success"
                : "quiz-result";

        let message;

        if (score === totalQuestions) {
            message = "Excellent work! You answered every question correctly.";
        } else if (score >= 3) {
            message = "Good progress. Review the topics you missed.";
        } else {
            message = "Review the lesson examples and try the quiz again.";
        }

        quizResult.textContent =
            `Your score: ${score}/${totalQuestions} (${percentage}%). ${message}`;
    });
}


/* =================================
   7. CURRENT YEAR & BACK TO TOP
================================= */

const yearElement = $("#year");
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

const backToTop = $("#backToTop");

if (backToTop) {
    backToTop.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    window.addEventListener("scroll", () => {
        backToTop.classList.toggle("show", window.scrollY > 300);
    });
}