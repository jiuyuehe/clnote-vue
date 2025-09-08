import { defineStore } from 'pinia'
import { createFetch } from '../utils/fetch-creator'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {
      data: {
        userName: 'jeff',
        userId: 98,
        userType: 0,
        userIcon: ''
      }
    }
  }),

  actions: {
    async getUserInfo() {
      try {
        const data = await createFetch({
          url: 'user'
        })
        this.userInfo = data
      } catch (err) {
        console.log('getUserInfo error:', err)
        window.location = '/login.html'
      }
    }
  }
})