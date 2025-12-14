// Test setup file
import { beforeEach } from 'vitest'

beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear()
  
  // Reset DOM
  document.body.innerHTML = ''
})
