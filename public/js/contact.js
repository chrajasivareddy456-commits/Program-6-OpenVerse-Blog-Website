document.addEventListener('DOMContentLoaded', () => {
  OV.renderNavbar('contact');
  OV.renderFooter();

  const form = document.getElementById('contactForm');
  const fields = {
    name: { el: document.getElementById('cName'), validate: (v) => v.trim().length >= 2, msg: 'Please enter your name' },
    email: {
      el: document.getElementById('cEmail'),
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg: 'Please enter a valid email'
    },
    subject: { el: document.getElementById('cSubject'), validate: (v) => v.trim().length >= 2, msg: 'Please enter a subject' },
    message: {
      el: document.getElementById('cMessage'),
      validate: (v) => v.trim().length >= 10,
      msg: 'Message should be at least 10 characters'
    }
  };

  function validateField(key) {
    const { el, validate, msg } = fields[key];
    const group = el.closest('.form-group');
    const errEl = group.querySelector('.form-error');
    const ok = validate(el.value);
    group.classList.toggle('invalid', !ok);
    if (errEl) errEl.textContent = msg;
    return ok;
  }

  Object.keys(fields).forEach((key) => {
    fields[key].el.addEventListener('blur', () => validateField(key));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const allValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!allValid) {
      OV.toast('Please fix the highlighted fields', 'error');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const res = await OV.api('/contact', {
      method: 'POST',
      body: JSON.stringify({
        name: fields.name.el.value.trim(),
        email: fields.email.el.value.trim(),
        subject: fields.subject.el.value.trim(),
        message: fields.message.el.value.trim()
      })
    });

    btn.innerHTML = original;
    btn.disabled = false;

    if (res.success) {
      OV.toast(res.message, 'success');
      form.reset();
    } else {
      OV.toast(res.message || 'Could not send your message', 'error');
      if (res.errors) {
        Object.entries(res.errors).forEach(([key, msg]) => {
          if (fields[key]) {
            const group = fields[key].el.closest('.form-group');
            group.classList.add('invalid');
            group.querySelector('.form-error').textContent = msg;
          }
        });
      }
    }
  });
});
