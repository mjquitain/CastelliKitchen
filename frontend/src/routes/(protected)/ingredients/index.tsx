import IngredientsPage from '@/pages/ingredients';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(protected)/ingredients/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <IngredientsPage />;
}
