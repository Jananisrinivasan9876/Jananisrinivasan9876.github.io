
const toggleButton = document.getElementById("theme-toggle");
const toggleIcon = toggleButton.querySelector(".toggle-knob i");

function updateThemeButton() {
    const isDark = document.body.classList.contains("dark-theme");

    toggleIcon.className = isDark
        ? "fa-solid fa-sun"
        : "fa-regular fa-moon";

    toggleButton.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
    );

    toggleButton.setAttribute("aria-pressed", String(isDark));
}

// Restore the saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
}

updateThemeButton();

// Switch themes when clicked
toggleButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");

    const isDark = document.body.classList.contains("dark-theme");

    localStorage.setItem("theme", isDark ? "dark" : "light");

    updateThemeButton();
});
