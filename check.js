// ====== DOM ELEMENTS ======
const passwordInput = document.getElementById("password");
const strengthBar = document.getElementById("strength-bar");
const feedback = document.getElementById("password-feedback");
const crackTimeValue = document.getElementById("crack-time-value");

// Requirement indicators
const reqLength = document.getElementById("req-length");
const reqUpper = document.getElementById("req-upper");
const reqLower = document.getElementById("req-lower");
const reqNumber = document.getElementById("req-number");
const reqSpecial = document.getElementById("req-special");

// Generated password UI
const generateBtn = document.getElementById("generate-password");
const generatedRow = document.getElementById("generated-row");
const generatedField = document.getElementById("generated-password");
const toggleGenVisibility = document.getElementById("toggle-gen-visibility");
const copyGenBtn = document.getElementById("copy-gen");

// Guide modal
const showGuide = document.getElementById("show-guide");
const guideModal = document.getElementById("guide-modal");
const guideBackdrop = document.getElementById("guide-backdrop");
const guideSheet = document.getElementById("guide-sheet");
const closeGuide = document.getElementById("close-guide");
const closeGuide2 = document.getElementById("close-guide-2");

// Eye toggles
const toggleVisibility = document.getElementById("toggle-visibility");
const eyeOpen = document.getElementById("eye-open");
const eyeClosed = document.getElementById("eye-closed");
const genEyeOpen = document.getElementById("gen-eye-open");
const genEyeClosed = document.getElementById("gen-eye-closed");

// ====== COMMON PASSWORD LIST ======
const commonPasswords = [
  "password", "123456", "12345", "12345678", "qwerty", "abc123",
  "letmein", "admin", "welcome", "monkey", "login", "dragon",
  "iloveyou", "111111", "user"
];

// ====== FORM HANDLER ======
const form = document.getElementById("pw-form");
form.addEventListener("submit", (event) => {
  event.preventDefault(); // prevent reload & URL exposure

  const password = passwordInput.value.trim();
  if (!password) {
    feedback.style.color = "#ef4444";
    feedback.textContent = "⚠️ Please enter a password before submitting.";
    return;
  }

  // Validate requirements
  const allMet = checkAllRequirements(password);
  if (!allMet) {
    feedback.style.color = "#ef4444";
    feedback.textContent = "❌ Please meet all password requirements before submitting.";
    return;
  }

  // Block common passwords
  const isCommon = commonPasswords.some(p => password.toLowerCase().includes(p));
  if (isCommon) {
    feedback.style.color = "#ef4444";
    feedback.textContent = "⚠️ This is a common password. Do not use such passwords.";
    return;
  }

  // If valid — show success feedback
  const { score, feedbackMsg, timeToCrack } = evaluatePassword(password);
  updateStrengthBar(score);
  feedback.style.color = "#22c55e";
  feedback.textContent = "✅ Successfully submitted! " + feedbackMsg;
  crackTimeValue.textContent = timeToCrack || "—";

  // Privacy measure: clear the input
  passwordInput.value = "";
  updateRequirements("");

  // Show success alert
  alert("✅ Password submitted successfully! (Not stored or sent)");
});

// ====== PASSWORD INPUT EVENT ======
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const { score, feedbackMsg, timeToCrack } = evaluatePassword(password);

  updateStrengthBar(score);
  feedback.style.color = "#333";
  feedback.textContent = feedbackMsg;
  crackTimeValue.textContent = timeToCrack || "—";

  updateRequirements(password);
});

// ====== REQUIREMENTS CHECK ======
function checkAllRequirements(password) {
  const minLength = password.length >= 8;
  const upper = /[A-Z]/.test(password);
  const lower = /[a-z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  return minLength && upper && lower && number && special;
}

// ====== UPDATE REQUIREMENTS ======
function updateRequirements(password) {
  markRequirement(reqLength, password.length >= 8);
  markRequirement(reqUpper, /[A-Z]/.test(password));
  markRequirement(reqLower, /[a-z]/.test(password));
  markRequirement(reqNumber, /[0-9]/.test(password));
  markRequirement(reqSpecial, /[^A-Za-z0-9]/.test(password));
}

function markRequirement(el, met) {
  el.textContent = met ? "✅" : "❌";
  el.style.color = met ? "#22c55e" : "#ef4444";
}

// ====== PASSWORD EVALUATION ======
function evaluatePassword(password) {
  if (!password) return { score: 0, feedbackMsg: "", timeToCrack: "" };

  let score = 0;
  let feedbackMsg = "";

  // Length
  if (password.length >= 16) score += 40;
  else if (password.length >= 12) score += 30;
  else if (password.length >= 8) score += 15;
  else score += 5;

  // Variety
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  score += variety * 10;

  // Common pattern penalty
  const isCommon = commonPasswords.some(p => password.toLowerCase().includes(p));
  if (isCommon) {
    score -= 25;
    feedbackMsg = "⚠️ Avoid common passwords or dictionary words.";
  }

  // Bonus for very strong passwords
  if (password.length >= 20 && variety >= 3) score += 15;
  score = Math.max(0, Math.min(score, 100));

  if (!feedbackMsg) {
    if (score < 30) feedbackMsg = "Weak password. Add more characters and symbols.";
    else if (score < 60) feedbackMsg = "Moderate password. Try adding variety and length.";
    else if (score < 80) feedbackMsg = "Strong password. Could be improved further.";
    else feedbackMsg = "Excellent! Your password is strong.";
  }

  const timeToCrack = estimateCrackTime(password);
  return { score, feedbackMsg, timeToCrack };
}

// ====== CRACK TIME ESTIMATION ======
function estimateCrackTime(password) {
  if (!password) return "";

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let pool = 0;
  if (hasLower) pool += 26;
  if (hasUpper) pool += 26;
  if (hasNumber) pool += 10;
  if (hasSpecial) pool += 32;
  if (pool === 0) pool = 26;

  const entropy = password.length * Math.log2(pool);
  const G = 1e10; // guesses per second
  const seconds = Math.pow(2, entropy - 1) / G;
  return formatDuration(seconds);
}

function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "<1 sec";
  const MIN = 60, HOUR = 3600, DAY = 86400, YEAR = 31557600;
  const fmt = n => (n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.round(n));
  if (seconds < MIN) return fmt(seconds) + " sec";
  if (seconds < HOUR) return fmt(seconds / MIN) + " min";
  if (seconds < DAY) return fmt(seconds / HOUR) + " hr";
  if (seconds < YEAR) return fmt(seconds / DAY) + " day";
  return fmt(seconds / YEAR) + " year";
}

// ====== STRENGTH BAR COLOR ======
function updateStrengthBar(score) {
  strengthBar.style.width = score + "%";
  if (score < 30) strengthBar.style.backgroundColor = "#ef4444";
  else if (score < 60) strengthBar.style.backgroundColor = "#f59e0b";
  else if (score < 80) strengthBar.style.backgroundColor = "#3b82f6";
  else strengthBar.style.backgroundColor = "#22c55e";
}

// ====== PASSWORD GENERATOR ======
generateBtn.addEventListener("click", () => {
  const password = generatePassword(12);
  generatedRow.classList.remove("hidden");
  generatedField.value = password;
  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event("input"));
});

function generatePassword(length) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.<>?/~`|\\";
  const allChars = upper + lower + numbers + symbols;
  let password = "";

  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password.split("").sort(() => 0.5 - Math.random()).join("");
}

// ====== COPY GENERATED PASSWORD ======
copyGenBtn.addEventListener("click", async () => {
  if (!generatedField.value) return;
  try {
    await navigator.clipboard.writeText(generatedField.value);
    copyGenBtn.textContent = "Copied!";
    setTimeout(() => (copyGenBtn.textContent = "Copy"), 1500);
  } catch {
    copyGenBtn.textContent = "Failed!";
    setTimeout(() => (copyGenBtn.textContent = "Copy"), 1500);
  }
});
// ====== GUIDE MODAL ======
showGuide.addEventListener("click", () => {
  guideModal.classList.remove("hidden");
  setTimeout(() => guideSheet.classList.add("open"), 10);
});

function closeGuideModal() {
  guideSheet.classList.remove("open");
  setTimeout(() => guideModal.classList.add("hidden"), 300);
}

closeGuide.addEventListener("click", closeGuideModal);
closeGuide2.addEventListener("click", closeGuideModal);
guideBackdrop.addEventListener("click", closeGuideModal);

// ====== INIT ======
updateRequirements("");
updateStrengthBar(0);
crackTimeValue.textContent = "—";
