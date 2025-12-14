import './style.css'

// Main application entry point
document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('#app')
  
  app.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="text-4xl font-bold text-center bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          Meme vs Market Dashboard
        </h1>
        <p class="text-center text-dark-400 mt-2">
          Exploring correlations between Indian stock market volatility and meme popularity
        </p>
      </header>
      
      <div id="dashboard-container">
        <!-- Dashboard components will be rendered here -->
      </div>
    </div>
  `
})
