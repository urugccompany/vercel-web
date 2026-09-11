/**
 * URUGC — Minimal, Truthful Interactive Core
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initMobileMenu();
  initSmoothScroll();
});

/* Sticky Header Scroll Treatment */
function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* Mobile Menu Toggle & Scrim Management */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const scrim = document.getElementById('mobile-menu-scrim');

  if (!toggleBtn || !mobileMenu) return;

  function closeMenu() {
    toggleBtn.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('active');
    if (scrim) scrim.classList.remove('active');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  function openMenu() {
    toggleBtn.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('active');
    if (scrim) scrim.classList.add('active');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (scrim) {
    scrim.addEventListener('click', closeMenu);
  }

  // Close mobile menu on anchor click or action buttons
  const mobileLinks = mobileMenu.querySelectorAll('a, button');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });
}

/* Smooth Anchor Scrolling with Dynamic Header Offset */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const header = document.getElementById('site-header');
        const headerOffset = header ? header.offsetHeight + 12 : 75;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* Modal Management: Creator Network */
window.openCreatorModal = function() {
  const modal = document.getElementById('creator-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

window.closeCreatorModal = function() {
  const modal = document.getElementById('creator-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
};

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCreatorModal();
  }
});

/* ==========================================================================
   FORM VALIDATION & SUBMISSION CORE
   ========================================================================== */

/** Email format verification */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
}

/** URL format verification (http, https, www) */
function isValidUrl(url) {
  if (!url || !url.trim()) return true; // Optional field
  return /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(String(url).trim());
}

/** Clear all inline validation error outlines and error messages */
function clearFormErrors(form) {
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
}

/** Show an inline error on a specific form input field */
function setFieldError(field, message) {
  field.classList.add('input-error');
  const group = field.closest('.form-group') || field.parentElement;
  if (group && !group.querySelector('.field-error-msg')) {
    const errorSpan = document.createElement('span');
    errorSpan.className = 'field-error-msg';
    errorSpan.textContent = message;
    group.appendChild(errorSpan);
  }
}

/**
 * Format payload for FormSubmit to ensure clean presentation in email table
 */
function formatEmailSubmissionPayload(payload) {
  const isBrand = payload.submission_type === 'Brand';
  const now = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
  const subject = isBrand
    ? `[URUGC Brand Enquiry] ${payload.brand_company || payload.name} — ${payload.name}`
    : `[URUGC Creator Application] ${payload.name} (${payload.category || 'Creator'})`;

  const emailData = {
    _subject: subject,
    _replyto: payload.email,
    _template: 'table',
    _captcha: 'false',
    'Submission Date & Time': now,
    'Submission Type': payload.submission_type,
    'Full Name': payload.name,
    'Email Address': payload.email
  };

  if (isBrand) {
    emailData['Brand / Company'] = payload.brand_company || payload.brand || '—';
    emailData['Campaign Details'] = payload.campaign_details || payload.message || '—';
  } else {
    emailData['Social Handle / Profile Link'] = payload.social_profile_link || payload.c_handle || '—';
    emailData['Primary Category'] = payload.category || payload.c_niche || '—';
    emailData['Portfolio / Video Reel Link'] = payload.portfolio_link || payload.c_portfolio || '—';
  }

  return emailData;
}

/**
 * Sends form data to configured backend:
 * 1. Google Apps Script Web App (updates Google Sheet & sends Gmail notification)
 * 2. FormSubmit endpoint (direct email delivery to urugccompany@gmail.com on live domain)
 * 3. Local Python API (/api/submit) when testing locally
 */
async function dispatchFormSubmission(payload) {
  const config = window.URUGC_CONFIG || {};
  const googleUrl = config.GOOGLE_SCRIPT_URL && config.GOOGLE_SCRIPT_URL.trim();
  const recipientEmail = config.RECIPIENT_EMAIL || 'urugccompany@gmail.com';
  const emailEndpoint = config.EMAIL_SUBMISSION_ENDPOINT || `https://formsubmit.co/ajax/${recipientEmail}`;

  const isLocal = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1' ||
                  window.location.protocol === 'file:' ||
                  !window.location.origin ||
                  window.location.origin === 'null';

  let success = false;
  let lastError = null;

  // 1. If Google Apps Script Web App is configured, send to Google Sheets
  if (googleUrl) {
    try {
      const gRes = await fetch(googleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
      if (gRes.ok) {
        success = true;
      }
    } catch (err) {
      console.warn('Google Apps Script request failed, attempting email fallback:', err);
      lastError = err;
    }
  }

  // 2. If running locally and Google Apps Script is not configured, send to local API server
  if (!success && isLocal) {
    try {
      let localUrl = config.LOCAL_API_ENDPOINT || '/api/submit';
      if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
        localUrl = 'http://localhost:8080/api/submit';
      }
      const localRes = await fetch(localUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (localRes.ok) {
        success = true;
      }
    } catch (err) {
      console.warn('Local server submission error, trying direct email:', err);
      lastError = err;
    }
  }

  // 3. If on live web domain (e.g. Render) OR if Google URL / local server didn't succeed,
  // submit directly via email endpoint to guarantee notification lands in urugccompany@gmail.com
  if (!success) {
    try {
      const emailPayload = formatEmailSubmissionPayload(payload);
      const emailRes = await fetch(emailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      if (emailRes.ok) {
        const json = await emailRes.json().catch(() => ({}));
        if (json.success === 'true' || json.success === true || json.status === 'success' || !json.error) {
          success = true;
        } else {
          throw new Error(json.message || 'Email delivery failed');
        }
      } else {
        throw new Error(`Email delivery service responded with ${emailRes.status}`);
      }
    } catch (err) {
      console.error('Email delivery error:', err);
      lastError = err;
    }
  }

  if (!success) {
    throw new Error(lastError ? (lastError.message || String(lastError)) : 'Submission failed. Please try again.');
  }

  return { status: 'success', message: 'Submission successfully recorded.' };
}

/* -------------------------------------------------------------------------
   1. Brand Campaign Enquiry Form Handling
   ------------------------------------------------------------------------- */
window.handleEnquirySubmit = async function(e) {
  e.preventDefault();
  const form = document.getElementById('campaign-enquiry-form');
  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('submit-enquiry-btn');
  const recipient = (window.URUGC_CONFIG && window.URUGC_CONFIG.RECIPIENT_EMAIL) || 'urugccompany@gmail.com';

  if (!form || !feedback || !submitBtn) return;

  // Clear previous states
  clearFormErrors(form);
  feedback.className = 'form-feedback-banner hidden';
  feedback.textContent = '';

  // Get field elements
  const nameInput = form.querySelector('#name');
  const brandInput = form.querySelector('#brand');
  const emailInput = form.querySelector('#email');
  const messageInput = form.querySelector('#message');

  const nameVal = nameInput ? nameInput.value.trim() : '';
  const brandVal = brandInput ? brandInput.value.trim() : '';
  const emailVal = emailInput ? emailInput.value.trim() : '';
  const messageVal = messageInput ? messageInput.value.trim() : '';

  // Field validation
  let hasError = false;
  let firstErrorEl = null;

  if (!nameVal) {
    setFieldError(nameInput, 'Please enter your name.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = nameInput;
  }

  if (!brandVal) {
    setFieldError(brandInput, 'Please enter your brand or company name.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = brandInput;
  }

  if (!emailVal) {
    setFieldError(emailInput, 'Please enter your email address.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = emailInput;
  } else if (!isValidEmail(emailVal)) {
    setFieldError(emailInput, 'Please enter a valid email address (e.g. name@company.com).');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = emailInput;
  }

  if (!messageVal) {
    setFieldError(messageInput, 'Please tell us about your campaign requirements.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = messageInput;
  }

  if (hasError) {
    if (firstErrorEl) firstErrorEl.focus();
    return;
  }

  // Prevent duplicate submissions & show loading state
  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-spinner"></span><span>Submitting...</span>';

  const payload = {
    submission_type: 'Brand',
    name: nameVal,
    brand_company: brandVal,
    brand: brandVal,
    email: emailVal,
    social_profile_link: '—',
    category: '—',
    portfolio_link: '—',
    campaign_details: messageVal,
    message: messageVal
  };

  try {
    await dispatchFormSubmission(payload);

    // Success State
    feedback.className = 'form-feedback-banner success';
    feedback.textContent = "Thank you. Your campaign enquiry has been received. We'll get back to you shortly.";
    feedback.classList.remove('hidden');

    form.reset();
    clearFormErrors(form);
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('Brand enquiry submission error:', err);
    // Failure State (Never falsely show success)
    feedback.className = 'form-feedback-banner error';
    feedback.innerHTML = `Submission failed. Please try again or contact <a href="mailto:${recipient}" class="text-link">${recipient}</a> directly.`;
    feedback.classList.remove('hidden');
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
  }
};

/* -------------------------------------------------------------------------
   2. Creator Network Application Form Handling
   ------------------------------------------------------------------------- */
window.handleCreatorSubmit = async function(e) {
  e.preventDefault();
  const form = document.getElementById('creator-form');
  const feedback = document.getElementById('creator-feedback');
  const submitBtn = document.getElementById('submit-creator-btn') || form.querySelector('button[type="submit"]');
  const recipient = (window.URUGC_CONFIG && window.URUGC_CONFIG.RECIPIENT_EMAIL) || 'urugccompany@gmail.com';

  if (!form || !feedback || !submitBtn) return;

  // Clear previous states
  clearFormErrors(form);
  feedback.className = 'form-feedback-banner hidden';
  feedback.textContent = '';

  // Get field elements
  const nameInput = form.querySelector('#c-name');
  const emailInput = form.querySelector('#c-email');
  const handleInput = form.querySelector('#c-handle');
  const nicheSelect = form.querySelector('#c-niche');
  const portfolioInput = form.querySelector('#c-portfolio');

  const nameVal = nameInput ? nameInput.value.trim() : '';
  const emailVal = emailInput ? emailInput.value.trim() : '';
  const handleVal = handleInput ? handleInput.value.trim() : '';
  const nicheVal = nicheSelect ? nicheSelect.value : '';
  const portfolioVal = portfolioInput ? portfolioInput.value.trim() : '';

  // Field validation
  let hasError = false;
  let firstErrorEl = null;

  if (!nameVal) {
    setFieldError(nameInput, 'Please enter your full name.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = nameInput;
  }

  if (!emailVal) {
    setFieldError(emailInput, 'Please enter your email address.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = emailInput;
  } else if (!isValidEmail(emailVal)) {
    setFieldError(emailInput, 'Please enter a valid email address.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = emailInput;
  }

  if (!handleVal) {
    setFieldError(handleInput, 'Please provide your social handle or profile link.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = handleInput;
  }

  if (!nicheVal) {
    setFieldError(nicheSelect, 'Please select your primary category.');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = nicheSelect;
  }

  if (portfolioVal && !isValidUrl(portfolioVal)) {
    setFieldError(portfolioInput, 'Please enter a valid URL (starting with http:// or https://).');
    hasError = true;
    if (!firstErrorEl) firstErrorEl = portfolioInput;
  }

  if (hasError) {
    if (firstErrorEl) firstErrorEl.focus();
    return;
  }

  // Prevent duplicate submissions & show loading state
  const originalBtnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="btn-spinner"></span><span>Submitting...</span>';

  const payload = {
    submission_type: 'Creator',
    name: nameVal,
    c_name: nameVal,
    brand_company: '—',
    email: emailVal,
    c_email: emailVal,
    social_profile_link: handleVal,
    c_handle: handleVal,
    category: nicheVal,
    c_niche: nicheVal,
    portfolio_link: portfolioVal || '—',
    c_portfolio: portfolioVal || '—',
    campaign_details: '—'
  };

  try {
    await dispatchFormSubmission(payload);

    // Success State
    feedback.className = 'form-feedback-banner success';
    feedback.textContent = "Thank you. Your creator profile has been submitted and will be reviewed for relevant opportunities.";
    feedback.classList.remove('hidden');

    form.reset();
    clearFormErrors(form);
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    console.error('Creator application submission error:', err);
    // Failure State (Never falsely show success)
    feedback.className = 'form-feedback-banner error';
    feedback.innerHTML = `Submission failed. Please try again or contact <a href="mailto:${recipient}" class="text-link">${recipient}</a> directly.`;
    feedback.classList.remove('hidden');
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnHtml;
  }
};
