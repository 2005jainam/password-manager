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

// Password input listener
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const { score, feedbackMsg, timeToCrack } = evaluatePassword(password);

  updateStrengthBar(score);
  feedback.textContent = feedbackMsg;
  crackTimeValue.textContent = timeToCrack || "—";

  updateRequirements(password);
});

// Evaluate password function
function evaluatePassword(password) {
  if (!password) return { score: 0, feedbackMsg: "", timeToCrack: "" };

  let score = 0;
  let feedbackMsg = "";

  // Length scoring
  if (password.length >= 16) score += 40;
  else if (password.length >= 12) score += 30;
  else if (password.length >= 8) score += 15;
  else score += 5;

  // Variety scoring
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const variety = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  score += variety * 10;

  // Penalize common patterns
  const commonPatterns = ["password", "12345", "qwerty", "abc", "letmein", "admin", "user"];
  for (let p of commonPatterns) {
    if (password.toLowerCase().includes(p)) {
      score -= 25;
      feedbackMsg = "⚠️ Avoid common patterns or dictionary words.";
      break;
    }
  }

  // Bonus for very long passwords
  if (password.length >= 20 && variety >= 3) score += 15;

  // Clamp score 0–100
  score = Math.max(0, Math.min(score, 100));

  // Feedback text if not set by pattern penalty
  if (!feedbackMsg) {
    if (score < 30) feedbackMsg = "Weak password. Add more characters and symbols.";
    else if (score < 60) feedbackMsg = "Moderate password. Try adding variety.";
    else if (score < 80) feedbackMsg = "Strong password. Could be improved with more length.";
    else feedbackMsg = "Excellent! Your password is strong.";
  }

  // Crack time estimate
  const timeToCrack = estimateCrackTime(password);

  return { score, feedbackMsg, timeToCrack };
}

// Estimate crack time based on entropy and return human-friendly duration like "5 years" or "1234 min"
function estimateCrackTime(password) {
  if (!password) return "";

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // Symbol set sizes
  const lowerSize = 26;
  const upperSize = 26;
  const numberSize = 10;
  const specialSize = 32; // approximate number of common symbols included in generator

  // Calculate pool size
  let pool = 0;
  if (hasLower) pool += lowerSize;
  if (hasUpper) pool += upperSize;
  if (hasNumber) pool += numberSize;
  if (hasSpecial) pool += specialSize;

  // If pool is zero (shouldn't happen), assume lowercase
  if (pool === 0) pool = lowerSize;

  // entropy in bits
  const entropy = password.length * Math.log2(pool);

  // Convert bits to number of guesses: ~2^entropy
  // Assume an attacker can try G guesses per second (offline GPU attack).
  // Use a high but reasonable value for powerful offline attackers:
  const G = 1e10; // 10 billion guesses per second

  // time in seconds to try all combinations (on average attacker needs half of the space)
  // but we'll express as median time = (2^entropy) / (2 * G) = 2^(entropy-1) / G
  // to avoid huge numbers, compute using exponent math
  const seconds = Math.pow(2, entropy - 1) / G;

  return formatDuration(seconds);
}

// Format seconds into human-friendly string (numeric + unit)
function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "<1 sec";

  const MIN = 60;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const YEAR = 365.25 * DAY;
  const CENTURY = 100 * YEAR;

  // helper to format with 1 decimal if <10
  function fmt(n) {
    return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.round(n).toString();
  }

  if (seconds < 1) return "<1 sec";
  if (seconds < MIN) return Math.round(seconds) + " sec";
  if (seconds < HOUR) {
    const mins = seconds / MIN;
    return fmt(mins) + " min";
  }
  if (seconds < DAY) {
    const hrs = seconds / HOUR;
    return fmt(hrs) + " hr";
  }
  if (seconds < YEAR) {
    const days = seconds / DAY;
    return fmt(days) + " day";
  }
  if (seconds < CENTURY) {
    const yrs = seconds / YEAR;
    return fmt(yrs) + " year" + (yrs >= 2 ? "s" : "");
  }
  // centuries or beyond
  const centuries = seconds / CENTURY;
  return fmt(centuries) + " century" + (centuries >= 2 ? "ies" : "");
}

// Update strength bar UI
function updateStrengthBar(score) {
  strengthBar.style.width = score + "%";

  if (score < 30) {
    strengthBar.style.backgroundColor = "#ef4444"; // red
  } else if (score < 60) {
    strengthBar.style.backgroundColor = "#f59e0b"; // yellow
  } else if (score < 80) {
    strengthBar.style.backgroundColor = "#3b82f6"; // blue
  } else {
    strengthBar.style.backgroundColor = "#22c55e"; // green
  }
}

// Update password requirement indicators
function updateRequirements(password) {
  markRequirement(reqLength, password.length >= 8);
  markRequirement(reqUpper, /[A-Z]/.test(password));
  markRequirement(reqLower, /[a-z]/.test(password));
  markRequirement(reqNumber, /[0-9]/.test(password));
  markRequirement(reqSpecial, /[^A-Za-z0-9]/.test(password));
}

// Mark requirement indicators
function markRequirement(element, met) {
  element.textContent = met ? "✅" : "❌";
  element.style.color = met ? "#22c55e" : "#ef4444";
}

// Password generator functionality
generateBtn.addEventListener("click", () => {
  const length = 12;
  const password = generatePassword(length);

  generatedRow.classList.remove("hidden");
  generatedField.value = password;

  // Auto-fill input to check instantly
  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event("input"));
});

// Function to generate password
function generatePassword(length) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.<>?/~`|\\";
  const allChars = upper + lower + numbers + symbols;
  let password = "";

  // Ensure at least one of each type for better generated passwords
  password += lower[Math.floor(Math.random() * lower.length)];
  password += upper[Math.floor(Math.random() * upper.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle
  password = password.split('').sort(() => 0.5 - Math.random()).join('');
  return password;
}

// Copy generated password
copyGenBtn.addEventListener("click", async () => {
  if (!generatedField.value) return;
  try {
    await navigator.clipboard.writeText(generatedField.value);
    copyGenBtn.textContent = "Copied";
    setTimeout(() => { copyGenBtn.textContent = "Copy"; }, 1500);
  } catch {
    copyGenBtn.textContent = "Copy failed";
    setTimeout(() => { copyGenBtn.textContent = "Copy"; }, 1500);
  }
});

// Toggle input visibility (for both input and generated)
toggleVisibility.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeOpen.classList.add("hidden");
    eyeClosed.classList.remove("hidden");
  } else {
    passwordInput.type = "password";
    eyeOpen.classList.remove("hidden");
    eyeClosed.classList.add("hidden");
  }
});

// Generated password visibility toggle
toggleGenVisibility.addEventListener("click", () => {
  // Toggle only icons and input type for visual clarity
  if (generatedField.type === "password") {
    // Show text
    generatedField.type = "text";
    genEyeOpen.classList.remove("hidden");
    genEyeClosed.classList.add("hidden");
  } else {
    // Hide text behind dots
    generatedField.type = "password";
    genEyeOpen.classList.add("hidden");
    genEyeClosed.classList.remove("hidden");
  }
});


// Guide modal show/hide
showGuide.addEventListener("click", () => {
  guideModal.classList.remove("hidden");
  // slide-up animation
  setTimeout(() => guideSheet.classList.add("open"), 10);
});

function closeGuideModal() {
  guideSheet.classList.remove("open");
  setTimeout(() => guideModal.classList.add("hidden"), 300);
}

closeGuide.addEventListener("click", closeGuideModal);
closeGuide2.addEventListener("click", closeGuideModal);
guideBackdrop.addEventListener("click", closeGuideModal);

// Initialize empty indicators
updateRequirements("");
updateStrengthBar(0);
crackTimeValue.textContent = "—";
