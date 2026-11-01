"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    // Mobile navigation & dropdown toggle
    const menuToggle = $("#menuToggle");
    const navLinks = $("#navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navLinks.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.textContent = isOpen ? "✕" : "☰";
        });

        $$("#navLinks a:not(.nav-dropdown-menu a)").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.textContent = "☰";
            });
        });
    }

    // Current year
    const yearEl = $("#year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Playground elements
    const exampleSelect = $("#exampleSelect");
    const runButton = $("#runExample");
    const clearButton = $("#clearOutput");
    const output = $("#output");

    let runId = 0;

    function print(message) {
        if (output) output.textContent += `${message}\n`;
    }

    function showError(error) {
        print(`Error: ${error.message}`);
    }

    const wait = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    async function runExample(type) {
        if (!output) return;
        output.textContent = "";
        const currentRun = ++runId;

        if (runButton) {
            runButton.disabled = true;
            runButton.textContent = "Running...";
        }

        try {
            switch (type) {
                case "success": {
                    async function getMessage() {
                        return "Async function completed successfully!";
                    }

                    const message = await getMessage();

                    if (currentRun !== runId) return;
                    print(message);
                    break;
                }

                case "await": {
                    print("Starting...");
                    const value = await Promise.resolve(100);

                    if (currentRun !== runId) return;
                    print(`Promise result: ${value}`);
                    break;
                }

                case "error": {
                    async function riskyOperation() {
                        throw new Error("The operation failed.");
                    }

                    try {
                        print("Trying the operation...");
                        await riskyOperation();
                    } catch (error) {
                        if (currentRun !== runId) return;
                        showError(error);
                    }

                    if (currentRun !== runId) return;
                    print("The program continued after handling the error.");
                    break;
                }

                case "finally": {
                    try {
                        print("Starting operation...");
                        await wait(500);
                        print("Operation succeeded.");
                    } catch (error) {
                        showError(error);
                    } finally {
                        if (currentRun !== runId) return;
                        print("Finally: cleanup completed.");
                    }
                    break;
                }

                case "delay": {
                    print("Request started...");
                    await wait(1200);

                    if (currentRun !== runId) return;
                    print("Request completed.");
                    print('Received data: {"name":"Arslan","skill":"JavaScript"}');
                    break;
                }

                default:
                    print("Please select a valid example.");
            }
        } catch (error) {
            if (currentRun === runId) {
                showError(error);
            }
        } finally {
            if (currentRun === runId && runButton) {
                runButton.disabled = false;
                runButton.textContent = "▶ Run Example";
            }
        }
    }

    if (runButton && exampleSelect) {
        runButton.addEventListener("click", () => {
            runExample(exampleSelect.value);
        });
    }

    if (clearButton) {
        clearButton.addEventListener("click", () => {
            runId++;
            if (output) output.textContent = "Output cleared.";
            if (runButton) {
                runButton.disabled = false;
                runButton.textContent = "▶ Run Example";
            }
        });
    }

    // Reveal exercise solutions
    $$(".reveal-btn").forEach(button => {
        button.addEventListener("click", () => {
            const answer = document.getElementById(
                button.dataset.answer
            );

            if (!answer) return;
            const isHidden = answer.classList.toggle("hidden");

            button.textContent = isHidden
                ? "Reveal Solution"
                : "Hide Solution";
        });
    });

    // Quiz
    const quizForm = $("#quizForm");
    const quizResult = $("#quizResult");
    const resetQuiz = $("#resetQuiz");

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

            let score = 0;
            const unanswered = [];

            Object.entries(correctAnswers).forEach(([question, answer]) => {
                const selected = $(
                    `input[name="${question}"]:checked`,
                    quizForm
                );

                if (!selected) {
                    unanswered.push(question);
                } else if (selected.value === answer) {
                    score++;
                }
            });

            if (unanswered.length > 0) {
                quizResult.className = "quiz-result fail";
                quizResult.textContent =
                    `Answer all 5 questions first. You have answered ${5 - unanswered.length
                    } out of 5.`;
                return;
            }

            const percentage = Math.round((score / 5) * 100);

            quizResult.className =
                score >= 4
                    ? "quiz-result pass"
                    : "quiz-result fail";

            quizResult.textContent =
                `Your score: ${score}/5 (${percentage}%). ` +
                (score >= 4
                    ? "Good work! You understand the core concepts."
                    : "Review the lessons and try again.");

            if (score >= 4) {
                const quizCheck = $('.progress-check[data-key="quiz"]');
                if (quizCheck) {
                    quizCheck.checked = true;
                    saveProgress();
                    updateProgress();
                }
            }
        });
    }

    if (resetQuiz && quizForm) {
        resetQuiz.addEventListener("click", () => {
            quizForm.reset();
            quizResult.className = "quiz-result hidden";
            quizResult.textContent = "";
        });
    }

    // Persistent progress using localStorage
    const progressChecks = $$(".progress-check");
    const STORAGE_KEY = "arslanWeblabPhase1Day7Progress";

    function loadProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (!saved || typeof saved !== "object") return;

            progressChecks.forEach(check => {
                check.checked = saved[check.dataset.key] === true;
            });
        } catch (error) {
            console.warn("Could not load saved progress:", error.message);
        }
    }

    function saveProgress() {
        const progress = {};

        progressChecks.forEach(check => {
            progress[check.dataset.key] = check.checked;
        });

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
        } catch (error) {
            console.warn("Could not save progress:", error.message);
        }
    }

    function updateProgress() {
        const completed = progressChecks.filter(check => check.checked).length;
        const percentage = Math.round(
            (completed / progressChecks.length) * 100
        );

        const progressText = $("#progressText");
        const progressBar = $("#progressBar");

        if (progressText) progressText.textContent = `${percentage}%`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
    }

    progressChecks.forEach(check => {
        check.addEventListener("change", () => {
            saveProgress();
            updateProgress();
        });
    });

    loadProgress();
    updateProgress();

    // Back to top button
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