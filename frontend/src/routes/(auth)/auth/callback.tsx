import AuthCallbackPage from '@/pages/auth/callback'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/auth/callback')({
    component: RouteComponent,
})

function RouteComponent() {
    return <AuthCallbackPage />
}
