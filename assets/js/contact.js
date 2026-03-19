/* ── Contact Form – EmailJS Integration ── */
(function () {
  'use strict';

  // ============================================================
  //  EmailJS Configuration
  //  Replace these three values with your own from emailjs.com
  // ============================================================
  const EMAILJS_PUBLIC_KEY = 'cHrHc3yvnSpmKpZug';
  const EMAILJS_SERVICE_ID = 'service_c3ym33t';
  const EMAILJS_TEMPLATE_ID = 'template_ve7nai9';

  // ── Rate-limiting ──
  const COOLDOWN_MS = 30000; // 30 seconds between submissions
  let lastSubmitTime = 0;

  // ── Initialise EmailJS ──
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

  // ── DOM refs ──
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('contact-submit');
  const statusEl = document.getElementById('contact-status');

  if (!form) return;

  // ── Helpers ──
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setStatus(type, message) {
    statusEl.className = 'contact-status';
    if (type) {
      statusEl.classList.add('contact-status--' + type);
      statusEl.textContent = message;
    } else {
      statusEl.textContent = '';
    }
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    if (on) {
      submitBtn.classList.add('btn-loading');
    } else {
      submitBtn.classList.remove('btn-loading');
    }
  }

  function showSuccess() {
    submitBtn.classList.remove('btn-loading');
    submitBtn.classList.add('btn-success');
    submitBtn.disabled = true;

    // Revert after 2.5 seconds
    setTimeout(function () {
      submitBtn.classList.remove('btn-success');
      submitBtn.disabled = false;
    }, 2500);
  }

  function setFieldError(field, msg) {
    clearFieldError(field);
    field.classList.add('form-input--error');
    const err = document.createElement('span');
    err.className = 'field-error';
    err.textContent = msg;
    field.parentNode.appendChild(err);
  }

  function clearFieldError(field) {
    field.classList.remove('form-input--error');
    const existing = field.parentNode.querySelector('.field-error');
    if (existing) existing.remove();
  }

  function clearAllErrors() {
    form.querySelectorAll('.form-input--error').forEach(f => f.classList.remove('form-input--error'));
    form.querySelectorAll('.field-error').forEach(e => e.remove());
  }

  // ── Validate ──
  function validate() {
    clearAllErrors();
    let valid = true;

    const name = form.querySelector('[name="from_name"]');
    const email = form.querySelector('[name="from_email"]');
    const subject = form.querySelector('[name="subject"]');
    const message = form.querySelector('[name="message"]');

    if (!name.value.trim()) {
      setFieldError(name, 'Name is required');
      valid = false;
    }

    if (!email.value.trim()) {
      setFieldError(email, 'Email is required');
      valid = false;
    } else if (!EMAIL_RE.test(email.value.trim())) {
      setFieldError(email, 'Please enter a valid email');
      valid = false;
    }

    if (!subject.value.trim()) {
      setFieldError(subject, 'Subject is required');
      valid = false;
    }

    if (!message.value.trim()) {
      setFieldError(message, 'Message is required');
      valid = false;
    }

    return valid;
  }

  // ── Clear field errors on input ──
  form.querySelectorAll('.form-input, .form-textarea').forEach(field => {
    field.addEventListener('input', () => clearFieldError(field));
  });

  // ── Submit ──
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus(null);

    if (!validate()) {
      setStatus('error', 'Please fix the errors above.');
      return;
    }

    // Rate-limit check
    const now = Date.now();
    if (now - lastSubmitTime < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastSubmitTime)) / 1000);
      setStatus('error', 'Please wait ' + remaining + ' seconds before sending again.');
      return;
    }

    setLoading(true);
    setStatus('loading', 'Sending your message…');

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form)
      .then(function () {
        lastSubmitTime = Date.now();
        setLoading(false);
        showSuccess();
        setStatus('success', 'Message sent successfully! I\'ll get back to you soon.');
        form.reset();
        // Auto-hide success after 6 seconds
        setTimeout(() => setStatus(null), 6000);
      })
      .catch(function (err) {
        setLoading(false);
        console.error('EmailJS Error:', err);

        // Provide specific error messages
        if (err && err.status === 422) {
          setStatus('error', 'Invalid form data. Please check your inputs and try again.');
        } else if (err && err.status === 429) {
          setStatus('error', 'Too many requests. Please wait a moment and try again.');
        } else if (!navigator.onLine) {
          setStatus('error', 'No internet connection. Please check your network and try again.');
        } else {
          setStatus('error', 'Failed to send message. Please try again or email me directly.');
        }
      });
  });
})();
