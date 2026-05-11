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
  <div class="app flex flex-col min-h-screen">
    <Header @navigate="navigateTo" :current-page="currentPage" />
    
    <main class="flex-1">
      <Hero v-if="currentPage === 'home'" />
      <About v-if="currentPage === 'about'" />
      <Projects v-if="currentPage === 'projects'" />
      <Skills v-if="currentPage === 'skills'" />
      <Contact v-if="currentPage === 'contact'" />
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
        v-if="!['home', 'about', 'projects', 'skills', 'contact', 'login', 'dashboard', '404', '500'].includes(currentPage)" 
        @navigate="navigateTo" 
      />
    </main>
    
    <Footer @navigate="navigateTo" />
    <ChatWidget />
    <ResumeModal />
  </div>
</template>

<style scoped>
/* No additional styles needed - using Tailwind */
</style>
