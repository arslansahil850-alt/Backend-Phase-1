"use strict";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

document.addEventListener("DOMContentLoaded", () => {
    // Footer year
    const yearEl = $("#year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Mobile navigation & dropdown toggle
    const menuToggle = $("#menuToggle");
    const navMenu = $("#navMenu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navMenu.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.textContent = isOpen ? "✕" : "☰";
        });

        navMenu.querySelectorAll("a:not(.nav-dropdown-menu a)").forEach(link => {
            link.addEventListener("click", () => {
                navMenu.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.textContent = "☰";
            });
        });
    }

    // 1. Successful Promise
    const successBtn = $("#successButton");
    if (successBtn) {
        successBtn.addEventListener("click", async () => {
            const output = $("#successOutput");
            output.textContent = "Waiting for the Promise...";

            try {
                const result = await new Promise(resolve => {
                    setTimeout(() => {
                        resolve("Success! The operation finished.");
                    }, 1500);
                });

                output.textContent = result;
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            }
        });
    }

    // 2. Rejected Promise
    const errorBtn = $("#errorButton");
    if (errorBtn) {
        errorBtn.addEventListener("click", async () => {
            const output = $("#errorOutput");
            output.textContent = "Starting operation...";

            try {
                const result = await new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error("The operation failed."));
                    }, 1000);
                });

                output.textContent = result;
            } catch (error) {
                output.textContent = `Caught error: ${error.message}`;
            }
        });
    }

    // 3. Promise chaining
    const chainBtn = $("#chainButton");
    if (chainBtn) {
        chainBtn.addEventListener("click", () => {
            const output = $("#chainOutput");
            output.textContent = "Calculating...";

            Promise.resolve(5)
                .then(number => number * 2)
                .then(number => number + 3)
                .then(result => {
                    output.textContent = `Final result: ${result}`;
                })
                .catch(error => {
                    output.textContent = `Error: ${error.message}`;
                });
        });
    }

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