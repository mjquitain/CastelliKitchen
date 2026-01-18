import NotificationPage from '@/pages/notification';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(protected)/notification/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <NotificationPage />;
}
