// Wiederverwendbares Modal-System
const Modal = {
  element: null,
  backdrop: null,
  closeBtn: null,
  cancelBtn: null,
  confirmBtn: null,
  titleEl: null,
  messageEl: null,
  onConfirm: null,

  init() {
    this.element = document.getElementById('modal');
    if (!this.element) return;

    this.backdrop = this.element.querySelector('.modal-backdrop');
    this.closeBtn = this.element.querySelector('.modal-close');
    this.cancelBtn = this.element.querySelector('#modal-cancel');
    this.confirmBtn = this.element.querySelector('#modal-confirm');
    this.titleEl = this.element.querySelector('#modal-title');
    this.messageEl = this.element.querySelector('#modal-message');

    // Event Listeners
    this.closeBtn.addEventListener('click', () => this.close());
    this.cancelBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    this.confirmBtn.addEventListener('click', () => {
      if (this.onConfirm) {
        this.onConfirm();
      }
      this.close();
    });

    // ESC-Taste zum Schließen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.element.style.display === 'flex') {
        this.close();
      }
    });
  },

  open({ title, message, confirmText = 'Bestätigen', cancelText = 'Abbrechen', onConfirm, danger = false }) {
    if (!this.element) return;

    this.titleEl.textContent = title;
    this.messageEl.textContent = message;
    this.confirmBtn.textContent = confirmText;
    this.cancelBtn.textContent = cancelText;
    this.onConfirm = onConfirm;

    // Styling für Danger-Button
    if (danger) {
      this.confirmBtn.classList.add('btn-danger');
      this.confirmBtn.classList.remove('btn');
    } else {
      this.confirmBtn.classList.remove('btn-danger');
      this.confirmBtn.classList.add('btn');
    }

    this.element.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.element) return;
    this.element.style.display = 'none';
    document.body.style.overflow = '';
    this.onConfirm = null;
  }
};

// Auto-Init beim Laden
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Modal.init());
} else {
  Modal.init();
}
