"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    // Mobile navigation & dropdown toggle (Switches between ☰ and ✕)
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

    // Progress elements
    const progressCircle = $("#progressCircle");
    const progressPercent = $("#progressPercent");
    const progressTitle = $("#progressTitle");
    const progressText = $("#progressText");
    const resetProgress = $("#resetProgress");
    const completionMessage = $("#completionMessage");

    const topicChecks = $$(".topic-check");
    const goalChecks = $$(".goal-check");

    // Store progress so refreshing the page does not erase it.
    const STORAGE_KEY = "arslanPhase1Day10Progress";

    function loadProgress() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.warn("Could not load saved progress:", error);
            return {};
        }
    }

    let savedProgress = loadProgress();

    function saveProgress() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(savedProgress)
            );
        } catch (error) {
            console.warn("Could not save progress:", error);
        }
    }

    // Restore the saved checkboxes.
    function restoreChecks() {
        topicChecks.forEach(checkbox => {
            const key = `topic-${checkbox.dataset.topic}`;
            checkbox.checked = Boolean(savedProgress[key]);

            const card = checkbox.closest(".topic-card");
            if (card) {
                card.classList.toggle("completed", checkbox.checked);
            }
        });

        goalChecks.forEach(checkbox => {
            const key = `goal-${checkbox.dataset.goal}`;
            checkbox.checked = Boolean(savedProgress[key]);
        });
    }

    // Update the revision progress display.
    function updateProgress() {
        const completedTopics = topicChecks.filter(
            checkbox => checkbox.checked
        ).length;

        const totalTopics = topicChecks.length;
        if (totalTopics === 0) return;

        const percentage = Math.round(
            (completedTopics / totalTopics) * 100
        );

        if (progressPercent) progressPercent.textContent = `${percentage}%`;

        if (progressCircle) {
            progressCircle.style.background =
                `conic-gradient(var(--accent) ${percentage}%, #24354b ${percentage}%)`;
        }

        if (percentage === 100) {
            if (progressTitle) progressTitle.textContent = "Revision complete";
            if (progressText) progressText.textContent = "All ten topics are marked as reviewed.";
        } else {
            if (progressTitle) progressTitle.textContent = `${completedTopics} of ${totalTopics} topics`;
            if (progressText) progressText.textContent = "Mark a topic after you understand its code and purpose.";
        }

        updateCompletionMessage();
    }

    // Update the final learning checklist message.
    function updateCompletionMessage() {
        if (!completionMessage) return;

        const completedGoals = goalChecks.filter(
            checkbox => checkbox.checked
        ).length;

        const totalGoals = goalChecks.length;
        if (totalGoals === 0) return;

        if (completedGoals === totalGoals) {
            completionMessage.textContent =
                "All learning goals are checked. Explain each concept without looking at the code, then build a small project.";
        } else if (completedGoals === 0) {
            completionMessage.textContent =
                "Start with the concepts you find difficult. Understanding matters more than speed.";
        } else {
            completionMessage.textContent =
                `${completedGoals} of ${totalGoals} learning goals completed. Review the unchecked concepts and practise them in code.`;
        }
    }

    // Save topic progress whenever a checkbox changes.
    topicChecks.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const key = `topic-${checkbox.dataset.topic}`;

            savedProgress[key] = checkbox.checked;

            const card = checkbox.closest(".topic-card");
            if (card) {
                card.classList.toggle("completed", checkbox.checked);
            }

            saveProgress();
            updateProgress();
        });
    });

    // Save final learning goals.
    goalChecks.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const key = `goal-${checkbox.dataset.goal}`;

            savedProgress[key] = checkbox.checked;

            saveProgress();
            updateCompletionMessage();
        });
    });

    // Clear only this revision page's saved progress.
    if (resetProgress) {
        resetProgress.addEventListener("click", () => {
            const shouldReset = confirm(
                "Reset all Phase 1 Day 10 revision progress?"
            );

            if (!shouldReset) return;

            savedProgress = {};

            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (error) {
                console.warn("Could not clear saved progress:", error);
            }

            restoreChecks();
            updateProgress();
        });
    }

    // Small JavaScript examples.
    const examples = {
        array() {
            const numbers = [2, 4, 6];
            const result = numbers.map(number => number * 2);

            return JSON.stringify(result);
        },

        promise() {
            return new Promise(resolve => {
                resolve("Learning works!");
            });
        },

        object() {
            const student = {
                name: "Arslan",
                level: "Beginner"
            };

            const { name } = student;

            return name;
        }
    };

    // Run an example and display its result.
    $$(".run-example").forEach(button => {
        button.addEventListener("click", async () => {
            const exampleName = button.dataset.example;
            const output = $(`#${exampleName}Output`);
            if (!output) return;

            button.disabled = true;
            button.textContent = "Running...";

            try {
                const result = await examples[exampleName]();

                output.textContent =
                    typeof result === "string"
                        ? result
                        : JSON.stringify(result);
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            } finally {
                button.disabled = false;
                button.textContent = "Run example";
            }
        });
    });

    // Initial setup.
    restoreChecks();
    updateProgress();

    // Back to top button functionality
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