import VerifyEmailPage from '@/pages/verify-email'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/verify-email')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>) => ({
        token: typeof search.token === 'string' ? search.token : undefined,
    }),
})

function RouteComponent() {
    return <VerifyEmailPage />
}
