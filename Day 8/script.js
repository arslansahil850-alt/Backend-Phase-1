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

    // Footer year
    const yearEl = $("#year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // HTTP playground
    const methodSelect = $("#methodSelect");
    const endpointSelect = $("#endpointSelect");
    const bodyInput = $("#bodyInput");
    const sendButton = $("#sendRequest");
    const clearButton = $("#clearResponse");
    const responseOutput = $("#responseOutput");
    const responseStatus = $("#responseStatus");

    function showResponse(status, statusText, headers, body) {
        if (!responseStatus || !responseOutput) return;

        responseStatus.textContent = `${status} ${statusText}`;
        responseStatus.className =
            `status-pill ${status >= 400 ? "error" : "success"}`;

        responseOutput.textContent =
`HTTP/1.1 ${status} ${statusText}

Response Headers:
${Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n")}

Response Body:
${typeof body === "string" ? body : JSON.stringify(body, null, 2)}`;
    }

    function simulateRequest(method, endpoint, rawBody) {
        let parsedBody = null;

        if (["POST", "PUT", "PATCH"].includes(method)) {
            try {
                parsedBody = JSON.parse(rawBody);
            } catch {
                return {
                    status: 400,
                    statusText: "Bad Request",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: {
                        error: "Invalid JSON in request body."
                    }
                };
            }
        }

        const headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        };

        if (endpoint === "/error") {
            return {
                status: 500,
                statusText: "Internal Server Error",
                headers,
                body: {
                    error: "The simulated server encountered a problem."
                }
            };
        }

        if (endpoint === "/notfound") {
            return {
                status: 404,
                statusText: "Not Found",
                headers,
                body: {
                    error: "The requested resource was not found."
                }
            };
        }

        if (endpoint === "/users" && method === "GET") {
            return {
                status: 200,
                statusText: "OK",
                headers,
                body: {
                    users: [
                        { id: 1, name: "Arslan" },
                        { id: 2, name: "Alex" }
                    ]
                }
            };
        }

        if (endpoint === "/products" && method === "GET") {
            return {
                status: 200,
                statusText: "OK",
                headers,
                body: {
                    products: [
                        { id: 101, name: "Laptop" },
                        { id: 102, name: "Keyboard" }
                    ]
                }
            };
        }

        if (endpoint === "/users" && method === "POST") {
            return {
                status: 201,
                statusText: "Created",
                headers,
                body: {
                    message: "A new user would be created.",
                    received: parsedBody
                }
            };
        }

        if (endpoint === "/users/5" && method === "GET") {
            return {
                status: 200,
                statusText: "OK",
                headers,
                body: {
                    id: 5,
                    name: "Arslan"
                }
            };
        }

        if (endpoint === "/users/5" && method === "PUT") {
            return {
                status: 200,
                statusText: "OK",
                headers,
                body: {
                    message: "The user would be replaced.",
                    received: parsedBody
                }
            };
        }

        if (endpoint === "/users/5" && method === "PATCH") {
            return {
                status: 200,
                statusText: "OK",
                headers,
                body: {
                    message: "The user would be partially updated.",
                    received: parsedBody
                }
            };
        }

        if (endpoint === "/users/5" && method === "DELETE") {
            return {
                status: 204,
                statusText: "No Content",
                headers: {},
                body: "(No response body)"
            };
        }

        return {
            status: 405,
            statusText: "Method Not Allowed",
            headers,
            body: {
                error: `${method} is not configured for ${endpoint} in this demo.`
            }
        };
    }

    if (sendButton && methodSelect && endpointSelect && bodyInput) {
        sendButton.addEventListener("click", () => {
            const method = methodSelect.value;
            const endpoint = endpointSelect.value;
            const rawBody = bodyInput.value;

            sendButton.disabled = true;
            sendButton.textContent = "Processing...";

            setTimeout(() => {
                try {
                    const response = simulateRequest(method, endpoint, rawBody);

                    showResponse(
                        response.status,
                        response.statusText,
                        response.headers,
                        response.body
                    );
                } catch (error) {
                    showResponse(500, "Internal Server Error", {}, {
                        error: error.message
                    });
                } finally {
                    sendButton.disabled = false;
                    sendButton.textContent = "Send Simulated Request";
                }
            }, 300);
        });
    }

    if (clearButton && responseStatus && responseOutput) {
        clearButton.addEventListener("click", () => {
            responseStatus.textContent = "Waiting";
            responseStatus.className = "status-pill";
            responseOutput.textContent =
                "Choose a method and endpoint, then send your simulated request.";
        });
    }

    // Reveal exercise answers
    $$(".reveal-btn").forEach(button => {
        button.addEventListener("click", () => {
            const answer = document.getElementById(button.dataset.answer);
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
        q1: "a",
        q2: "b",
        q3: "c",
        q4: "a",
        q5: "b"
    };

    if (quizForm && quizResult) {
        quizForm.addEventListener("submit", event => {
            event.preventDefault();

            let score = 0;
            let unanswered = 0;

            Object.entries(correctAnswers).forEach(([question, answer]) => {
                const selected = $(
                    `input[name="${question}"]:checked`,
                    quizForm
                );

                if (!selected) {
                    unanswered++;
                } else if (selected.value === answer) {
                    score++;
                }
            });

            if (unanswered > 0) {
                quizResult.className = "quiz-result fail";
                quizResult.textContent =
                    `Answer all questions first. ${unanswered} question(s) remain unanswered.`;
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
                    ? "Good work! You understand the HTTP fundamentals."
                    : "Review the lessons and try again.");

            if (score >= 4) {
                const quizCheck = $('.progress-check[data-key="practice"]');
                if (quizCheck) {
                    quizCheck.checked = true;
                    saveProgress();
                    updateProgress();
                }
            }
        });
    }

    if (resetQuiz && quizForm && quizResult) {
        resetQuiz.addEventListener("click", () => {
            quizForm.reset();
            quizResult.className = "quiz-result hidden";
            quizResult.textContent = "";
        });
    }

    // Save progress in localStorage
    const progressChecks = $$(".progress-check");
    const STORAGE_KEY = "arslanWeblabPhase1Day8Progress";

    function loadProgress() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (!saved || typeof saved !== "object") {
                return;
            }

            progressChecks.forEach(check => {
                check.checked = saved[check.dataset.key] === true;
            });
        } catch (error) {
            console.warn("Could not load progress:", error.message);
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