const registrationForm = document.querySelector<HTMLFormElement>("#registration-form");
const emailInput = document.querySelector<HTMLInputElement>("#email");
const passwordInput = document.querySelector<HTMLInputElement>("#password");
const warningMessage = document.querySelector<HTMLParagraphElement>("#registration-warning");
const registrationStatus = document.querySelector<HTMLParagraphElement>("#registration-status");

if (registrationForm && emailInput && passwordInput && warningMessage && registrationStatus) {
	registrationForm.noValidate = true;
	registrationForm.addEventListener("submit", (event: SubmitEvent) => {
		event.preventDefault();
		warningMessage.textContent = "";
		warningMessage.hidden = true;
		registrationStatus.textContent = "";

		emailInput.value = emailInput.value.trim();
		const validEmail = emailInput.validity.valid && emailInput.value.toLowerCase().endsWith("@paconsulting.com");
		const validPassword = passwordInput.value.length >= 8;
		const warnings: string[] = [];

		emailInput.setAttribute("aria-invalid", String(!validEmail));
		passwordInput.setAttribute("aria-invalid", String(!validPassword));

		if (!validEmail) {
			warnings.push("Use a valid work email ending in @paconsulting.com.");
		}
		if (!validPassword) {
			warnings.push("Your password must be at least eight characters long.");
		}
		if (warnings.length > 0) {
			warningMessage.textContent = warnings.join(" ");
			warningMessage.hidden = false;
			if (!validEmail) {
				emailInput.focus();
			} else {
				passwordInput.focus();
			}
			return;
		}

		if (!registrationForm.reportValidity()) {
			return;
		}
		registrationStatus.textContent = "Details are valid. Registration is not connected yet.";
	});
}
