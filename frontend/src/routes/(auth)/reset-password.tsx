import ResetPasswordPage from '@/pages/reset-password'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/reset-password')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => ({
        token: typeof search.token === 'string' ? search.token : undefined,
    }),
})

function RouteComponent() {
    return <ResetPasswordPage />
}
