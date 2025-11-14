<script setup>
import { ref } from 'vue'
import Header from './components/Header.vue'
import Hero from './components/Hero.vue'
import About from './components/About.vue'
import Projects from './components/Projects.vue'
import Skills from './components/Skills.vue'
import Contact from './components/Contact.vue'
import Login from './components/Login.vue'
import Footer from './components/Footer.vue'

const currentPage = ref('home')

const navigateTo = (page) => {
  currentPage.value = page
  window.scrollTo(0, 0)
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
      <Login v-if="currentPage === 'login'" />
    </main>
    
    <Footer />
  </div>
</template>

<style scoped>
/* No additional styles needed - using Tailwind */
</style>
