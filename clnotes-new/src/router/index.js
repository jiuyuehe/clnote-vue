import { createRouter, createWebHashHistory } from 'vue-router'
import Loading from '@/components/Loading.vue'
import NoteEditor from '@/components/NoteEditor.vue'
import ShareNav from '@/components/ShareNav.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Loading
  },
  {
    path: '/loading/:nbi',
    name: 'Loading',
    component: Loading
  },
  {
    path: '/book/:nbi',
    name: 'Book',
    component: NoteEditor
  },
  {
    path: '/book/:nbi/note/:noteId',
    name: 'BookNote',
    component: NoteEditor
  },
  {
    path: '/share',
    name: 'Share',
    component: ShareNav
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router