const adminForm = document.getElementById('adminLogin');
const adminStatus = document.getElementById('adminStatus');
const adminResults = document.getElementById('adminResults');
if(!RoamBackend.enabled){adminForm.hidden = true;} else {adminStatus.textContent = 'Sign in with an authorised staff account.';}
adminForm.addEventListener('submit', async event => {
  event.preventDefault();
  adminStatus.textContent = 'Signing in…';
  try {
    const session = await RoamBackend.signIn(document.getElementById('adminEmail').value, document.getElementById('adminPassword').value);
    const enquiries = await RoamBackend.listEnquiries(session.access_token);
    adminStatus.textContent = `${enquiries.length} enquiries loaded.`;
    adminResults.innerHTML = enquiries.map(item => `<article class="admin-enquiry"><strong>${item.name}</strong><span>${item.email}</span><p>${item.summary || ''}</p></article>`).join('');
  } catch(error) {
    adminStatus.textContent = 'Sign-in failed. Check your account and backend configuration.';
  }
});
