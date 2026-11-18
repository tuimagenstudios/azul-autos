"use strict";
// No authentication is simulated. No credentials are persisted or transmitted.
(() => {
  const dialog = document.querySelector('#authDialog');
  const form = document.querySelector('#authForm');
  const email = document.querySelector('#authEmail');
  const password = document.querySelector('#authPassword');
  const confirm = document.querySelector('#authConfirm');
  const name = document.querySelector('#authName');
  const error = document.querySelector('#authError');
  let view = 'login';
  const copy = {
    login: ['Ingresá a tu cuenta', 'Volvé a tus favoritos y administrá tus publicaciones.', 'Ingresar'],
    register: ['Creá tu cuenta', 'Una cuenta para encontrar tu auto o publicar el tuyo. Antes de ingresar, deberás confirmar tu correo.', 'Crear cuenta'],
    recover: ['Recuperá tu acceso', 'Indicá tu correo para solicitar un enlace de recuperación.', 'Solicitar enlace'],
    resend: ['Confirmá tu correo', 'Si no encontrás el mensaje, revisá spam o solicitá otro enlace.', 'Solicitar confirmación']
  };
  function setView(next) {
    if (!copy[next]) return;
    view = next;
    form.reset();
    password.type = 'password';
    document.querySelector('#togglePassword').textContent = 'Mostrar';
    document.querySelector('#togglePassword').setAttribute('aria-pressed', 'false');
    error.hidden = true;
    error.textContent = '';
    form.querySelectorAll('input').forEach(input => { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); });
    const register = view === 'register';
    const credentials = register || view === 'login';
    document.querySelector('#authTitle').textContent = copy[view][0];
    document.querySelector('#authIntro').textContent = copy[view][1];
    document.querySelector('#authSubmit').textContent = copy[view][2];
    document.querySelector('#authNameWrap').hidden = !register;
    document.querySelector('#authConfirmWrap').hidden = !register;
    document.querySelector('#authPasswordWrap').hidden = !credentials;
    document.querySelector('#passwordHelp').hidden = !register;
    document.querySelector('#forgotPassword').hidden = view !== 'login';
    name.required = register; name.disabled = !register;
    confirm.required = register; confirm.disabled = !register;
    password.required = credentials; password.disabled = !credentials;
    password.minLength = register ? 15 : 1;
    password.autocomplete = register ? 'new-password' : 'current-password';
    document.querySelectorAll('.auth-tabs button').forEach(b => b.setAttribute('aria-current', String(b.dataset.authView === view)));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    (register ? name : email).focus();
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-auth-view]');
    if (trigger) setView(trigger.dataset.authView);
  });
  document.querySelector('#togglePassword').addEventListener('click', event => {
    const show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    event.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar';
    event.currentTarget.setAttribute('aria-pressed', String(show));
  });
  form.addEventListener('input', () => {
    confirm.setCustomValidity(''); name.setCustomValidity('');
    error.hidden = true;
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    email.value = email.value.trim();
    if (view === 'register') {
      name.setCustomValidity(name.value.trim().length < 2 ? 'Escribí tu nombre.' : '');
      confirm.setCustomValidity(password.value === confirm.value ? '' : 'Las contraseñas no coinciden.');
    }
    if (!form.reportValidity()) return;
    // Fail closed until a real identity service and email delivery are configured.
    password.value = ''; confirm.value = '';
    error.textContent = 'El acceso real todavía no está habilitado. No se creó una cuenta, no se inició sesión ni se envió un correo. Falta conectar el servicio de autenticación.';
    error.hidden = false;
  });
  dialog.addEventListener('close', () => {
    form.reset(); password.type = 'password'; error.textContent = ''; error.hidden = true;
  });
})();

document.querySelector('[data-preview-account]').addEventListener('click',()=>{document.querySelector('#authDialog').close();document.querySelector('#accountPreview').showModal()});document.querySelector('[data-preview-listings]').addEventListener('click',()=>{document.querySelector('#previewListings').hidden=false});
