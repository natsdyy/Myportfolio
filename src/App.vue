<script setup>
import { ref } from 'vue'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import Hero from './components/sections/Hero.vue'
import About from './components/sections/About.vue'
import Projects from './components/sections/Projects.vue'
import Skills from './components/sections/Skills.vue'
import Contact from './components/sections/Contact.vue'
import Login from './components/common/Login.vue'
import UserDashboard from './components/common/UserDashboard.vue'
import ChatWidget from './components/common/chat/ChatWidget.vue'
import NotFound from './components/common/error/NotFound.vue'
import ServerError from './components/common/error/ServerError.vue'
import ResumeModal from './components/common/ResumeModal.vue'

const currentPage = ref('home')
const currentUser = ref(null)

const navigateTo = (page) => {
  currentPage.value = page
  window.scrollTo(0, 0)
}

const handleAuthSuccess = (account) => {
  currentUser.value = account
  navigateTo('dashboard')
}
</script>

<template>
  <div class="app flex flex-col md:flex-row min-h-screen relative bg-app text-main">
    <Header @navigate="navigateTo" :current-page="currentPage" />
    
    <div class="flex-1 md:ml-64 flex flex-col min-h-screen w-full relative transition-all duration-300">
      <main class="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-12">
        <!-- Single Page Layout -->
        <div v-if="currentPage === 'home'" class="flex flex-col w-full gap-24 pb-24">
          <Hero @navigate="navigateTo" />
          <About />
          <Projects />
          <Skills />
          <Contact />
        </div>

        <Login
          v-if="currentPage === 'login'"
          @auth-success="handleAuthSuccess"
        />
        <UserDashboard
          v-if="currentPage === 'dashboard'"
          :user="currentUser"
        />

        <!-- Error Pages -->
        <NotFound 
          v-if="currentPage === '404'" 
          @navigate="navigateTo" 
        />
        <ServerError 
          v-if="currentPage === '500'" 
          @navigate="navigateTo" 
        />

        <!-- Fallback for unknown pages (404) -->
        <NotFound 
          v-if="!['home', 'login', 'dashboard', '404', '500'].includes(currentPage)" 
          @navigate="navigateTo" 
        />
      </main>
      
      <Footer @navigate="navigateTo" />
    </div>
    
    <ChatWidget />
    <ResumeModal />
  </div>
</template>

<style scoped>
/* No additional styles needed - using Tailwind */
</style>
