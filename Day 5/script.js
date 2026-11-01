"use strict";

// Helper functions for selecting HTML elements.
const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

// Footer year.
const yearEl = $("#year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Mobile navigation.
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

// Example 1: Convert JSON text into a JavaScript object.
const parseBtn = $("#parseBtn");
const parseOutput = $("#parseOutput");

if (parseBtn && parseOutput) {
    parseBtn.addEventListener("click", () => {
        try {
            const jsonText = '{"name":"Arslan","skill":"JavaScript"}';
            const user = JSON.parse(jsonText);

            parseOutput.textContent =
                `Name: ${user.name}\nSkill: ${user.skill}`;
        } catch (error) {
            parseOutput.textContent = `JSON error: ${error.message}`;
        }
    });
}

// Example 2: Fetch data from a public testing API.
const fetchBtn = $("#fetchBtn");
const fetchOutput = $("#fetchOutput");

if (fetchBtn && fetchOutput) {
    fetchBtn.addEventListener("click", async () => {
        fetchBtn.disabled = true;
        fetchBtn.textContent = "Loading...";
        fetchOutput.textContent = "Sending request to the API...";

        try {
            const response = await fetch(
                "https://jsonplaceholder.typicode.com/users/1"
            );

            // fetch does not automatically reject for HTTP 404 or 500.
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            // Read the response body and parse it as JSON.
            const user = await response.json();

            fetchOutput.textContent = [
                `Name: ${user.name}`,
                `Username: ${user.username}`,
                `Email: ${user.email}`,
                `City: ${user.address.city}`
            ].join("\n");

        } catch (error) {
            fetchOutput.textContent =
                `Could not fetch user data.\n${error.message}\n\nCheck your internet connection and try again.`;

        } finally {
            fetchBtn.disabled = false;
            fetchBtn.textContent = "Fetch User";
        }
    });
}

// Back to top button functionality.
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