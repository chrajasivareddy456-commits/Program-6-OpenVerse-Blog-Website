document.addEventListener('DOMContentLoaded', async () => {
  OV.renderNavbar('');
  OV.renderFooter();

  const editId = OV.qs('id');
  const form = document.getElementById('writeForm');
  const catSelect = document.getElementById('fieldCategory');
  const authorField = document.getElementById('fieldAuthor');
  const authorDisplayName = document.getElementById('authorDisplayName');
  const authorDisplayAvatar = document.getElementById('authorDisplayAvatar');
  const imageInput = document.getElementById('fieldImage');
  const preview = document.getElementById('imagePreview');
  const tagInput = document.getElementById('fieldTags');
  const tagPreview = document.getElementById('tagPreview');
  const pageTitle = document.getElementById('writePageTitle');
  const pageSub = document.getElementById('writePageSub');
  const publishBtn = document.getElementById('publishBtn');
  const draftBtn = document.getElementById('draftBtn');
  const deleteBtn = document.getElementById('deleteBtn');

  await loadOptions();

  if (editId) {
    pageTitle.textContent = 'Edit Story';
    pageSub.textContent = 'Update your story and republish it.';
    publishBtn.textContent = 'Save Changes';
    deleteBtn.style.display = 'inline-flex';
    await loadExisting(editId);
  }

  imageInput.addEventListener('input', () => {
    const url = imageInput.value.trim();
    if (url) {
      preview.querySelector('img').src = url;
      preview.classList.add('show');
    } else {
      preview.classList.remove('show');
    }
  });

  tagInput.addEventListener('input', () => {
    const tags = tagInput.value.split(',').map((t) => t.trim()).filter(Boolean);
    tagPreview.innerHTML = tags.map((t) => `<span class="tag">#${OV.escapeHtml(t)}</span>`).join('');
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = editId ? `/article?id=${editId}` : '/explore';
  });

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const ok = await OV.confirmModal({
        title: 'Delete this story?',
        message: 'This action cannot be undone. The story and its comments will be permanently removed.',
        confirmText: 'Delete Story'
      });
      if (!ok) return;
      const res = await OV.api(`/posts/${editId}`, { method: 'DELETE' });
      if (res.success) {
        OV.toast('Story deleted', 'success');
        setTimeout(() => (window.location.href = '/explore'), 900);
      } else {
        OV.toast(res.message || 'Could not delete story', 'error');
      }
    });
  }

  draftBtn.addEventListener('click', () => submitForm('draft'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm('published');
  });

  async function loadOptions() {
    const catsRes = await OV.api('/categories');
    if (catsRes.success) {
      catSelect.innerHTML =
        '<option value="">Select a category</option>' +
        catsRes.data.map((c) => `<option value="${c.name}">${c.icon} ${OV.escapeHtml(c.name)}</option>`).join('');
    }
    // New stories are always published as the site's author — there is no
    // author picker, so this can never be left blank or reassigned.
    if (!editId) {
      setAuthorDisplay(OV.CURRENT_USER.name, OV.authorAvatarPath(OV.CURRENT_USER.slug));
    }
  }

  function setAuthorDisplay(name, avatarUrl) {
    authorField.value = name;
    authorDisplayName.textContent = name;
    authorDisplayAvatar.src = avatarUrl;
    authorDisplayAvatar.alt = name;
  }

  async function loadExisting(id) {
    const res = await OV.api(`/posts/${id}`);
    if (!res.success) {
      OV.toast('Could not load story for editing', 'error');
      return;
    }
    const post = res.data;
    document.getElementById('fieldTitle').value = post.title;
    document.getElementById('fieldSubtitle').value = post.subtitle || '';
    // The author of an existing story is locked to whoever originally wrote
    // it — editing a story can never reassign it to someone else.
    setAuthorDisplay(post.author, OV.authorAvatarPath(post.authorSlug));
    document.getElementById('authorHelp').textContent = "This story's author can't be changed here.";
    catSelect.value = post.category;
    imageInput.value = post.image;
    imageInput.dispatchEvent(new Event('input'));
    tagInput.value = post.tags.join(', ');
    tagInput.dispatchEvent(new Event('input'));
    document.getElementById('fieldContent').value = post.content.join('\n\n');
    document.getElementById('fieldReadingTime').value = post.readingTime;
    document.getElementById('fieldExcerpt').value = post.excerpt;
  }

  function validate() {
    let valid = true;
    const requiredFields = [
      ['fieldTitle', 'Title is required'],
      ['fieldCategory', 'Please choose a category'],
      ['fieldContent', 'Story content is required']
    ];
    requiredFields.forEach(([id, msg]) => {
      const el = document.getElementById(id);
      const group = el.closest('.form-group');
      const errEl = group.querySelector('.form-error');
      if (!el.value.trim()) {
        group.classList.add('invalid');
        if (errEl) errEl.textContent = msg;
        valid = false;
      } else {
        group.classList.remove('invalid');
      }
    });
    return valid;
  }

  async function submitForm(status) {
    if (status === 'published' && !validate()) {
      OV.toast('Please fill in all required fields', 'error');
      return;
    }
    const payload = {
      title: document.getElementById('fieldTitle').value.trim(),
      subtitle: document.getElementById('fieldSubtitle').value.trim(),
      excerpt: document.getElementById('fieldExcerpt').value.trim(),
      author: authorField.value,
      category: catSelect.value,
      image: imageInput.value.trim(),
      tags: tagInput.value.split(',').map((t) => t.trim()).filter(Boolean),
      content: document.getElementById('fieldContent').value.trim(),
      readingTime: document.getElementById('fieldReadingTime').value || undefined,
      status
    };

    const btn = status === 'draft' ? draftBtn : publishBtn;
    const original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    const res = editId
      ? await OV.api(`/posts/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await OV.api('/posts', { method: 'POST', body: JSON.stringify(payload) });

    btn.innerHTML = original;
    btn.disabled = false;

    if (res.success) {
      OV.toast(editId ? 'Story updated successfully' : status === 'draft' ? 'Draft saved' : 'Story published successfully', 'success');
      const target = res.data.id;
      setTimeout(() => (window.location.href = `/article?id=${target}`), 900);
    } else {
      OV.toast(res.message || 'Something went wrong', 'error');
    }
  }
});
