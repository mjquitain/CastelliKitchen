import RecipePage from '@/pages/recipe';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(protected)/recipe/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <RecipePage />;
}
