import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,

  beforeLoad: async () => {
    throw redirect({ to: '/home' })
  }
})

function App() {
  return
}