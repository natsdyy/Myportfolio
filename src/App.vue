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
    </main>
    
    <Footer @navigate="navigateTo" />
  </div>
</template>

<style scoped>
/* No additional styles needed - using Tailwind */
</style>
