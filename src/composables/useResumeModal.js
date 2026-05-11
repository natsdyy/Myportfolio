import { ref } from 'vue';

const isOpen = ref(false);

export function useResumeModal() {
  const openModal = () => {
    isOpen.value = true;
    // Prevent background scrolling
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeModal = () => {
    isOpen.value = false;
    // Restore background scrolling
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  return {
    isOpen,
    openModal,
    closeModal
  };
}
