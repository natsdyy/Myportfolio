<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="closeModal">
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-transform transform scale-100">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText class="w-5 h-5 text-blue-500" />
            Charles Louie Alvaran - Resume
          </h3>
          
          <div class="flex items-center gap-2">
            <a :href="pdfUrl" download="Charles_Louie_Alvaran_Resume.pdf" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Download class="w-4 h-4" />
              <span class="hidden sm:inline">Download PDF</span>
            </a>
            <button @click="closeModal" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- PDF Preview -->
        <div class="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4 overflow-hidden relative">
          <!-- Fallback message for mobile browsers that don't support iframe PDF rendering -->
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:hidden pointer-events-none z-0">
            <FileText class="w-12 h-12 text-slate-400 mb-3" />
            <p class="text-slate-600 dark:text-slate-400 text-sm">
              Preview might not be supported on all mobile browsers.<br/>
              Please use the download button above to view the resume.
            </p>
          </div>
          
          <!-- The iframe will cover the fallback if it loads successfully -->
          <iframe 
            :src="pdfUrl" 
            class="w-full h-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white shadow-inner relative z-10" 
            title="Resume Preview">
          </iframe>
        </div>
        
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { X, Download, FileText } from 'lucide-vue-next';
import { useResumeModal } from '../../composables/useResumeModal';

const { isOpen, closeModal } = useResumeModal();
const pdfUrl = '/Charles_Louie_Alvaran_Resume.pdf';
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .rounded-2xl {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-enter-from .rounded-2xl {
  transform: scale(0.95);
}

.fade-leave-active .rounded-2xl {
  transition: transform 0.2s ease;
}

.fade-leave-to .rounded-2xl {
  transform: scale(0.95);
}
</style>
