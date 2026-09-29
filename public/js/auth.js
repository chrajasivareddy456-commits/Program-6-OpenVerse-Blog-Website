document.addEventListener('DOMContentLoaded', () => {
  OV.renderNavbar('');
  OV.renderFooter();

  const existing = OV.getSession();
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const fillDemoBtn = document.getElementById('fillDemoBtn');

  if (existing && (signinForm || signupForm)) {
    OV.toast(`You're already signed in as ${existing.name}`, 'info');
  }

  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      document.getElementById('siEmail').value = 'raja@openverse.com';
      document.getElementById('siPassword').value = 'Raja@123';
      OV.toast('Demo credentials filled in — click Sign In', 'info', 2500);
    });
  }

  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('siEmail').value.trim();
      const password = document.getElementById('siPassword').value;
      if (!email || !password) {
        OV.toast('Enter your email and password', 'error');
        return;
      }

      const btn = signinForm.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;

      const res = await OV.api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

      btn.innerHTML = original;
      btn.disabled = false;

      if (!res.success) {
        OV.toast(res.message || 'Invalid email or password', 'error');
        return;
      }

      OV.setSession(res.data);
      OV.toast(`Welcome back, ${res.data.name}!`, 'success');
      const destination = res.data.authorId ? `/author?id=${res.data.authorId}` : '/';
      setTimeout(() => (window.location.href = destination), 700);
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('suName').value.trim();
      const email = document.getElementById('suEmail').value.trim();
      const password = document.getElementById('suPassword').value;

      const btn = signupForm.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner"></span>';
      btn.disabled = true;

      const res = await OV.api('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });

      btn.innerHTML = original;
      btn.disabled = false;

      if (!res.success) {
        OV.toast(res.message || 'Could not create your account', 'error');
        return;
      }

      OV.setSession(res.data);
      OV.toast(`Account created. Welcome to OpenVerse, ${res.data.name}!`, 'success');
      setTimeout(() => (window.location.href = '/'), 700);
    });
  }
});
