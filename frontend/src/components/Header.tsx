import { getToken } from '@/lib/api'
import { Box, Flex, Group, Text, Title } from '@mantine/core'
import { Link, useRouterState } from '@tanstack/react-router'
import { ChefHat } from 'lucide-react'

export default function Header() {
  useRouterState()
  const isLoggedIn = !!getToken()

  return (
    <header className="ck-header shadow-lg border-b">
      <Box className="ck-header-inner">
        <Group className="ck-header-brand" gap="xs">
          <ChefHat size={30} color="white" />
          <div>
            <Title order={2} className="ck-header-title">
              Castelli Kitchen
            </Title>
            <Text size="sm" className="ck-header-subtitle">
              Reduce food waste, one recipe at a time
            </Text>
          </div>
        </Group>

        <Flex className="ck-header-nav" direction="row" justify="flex-end" gap="lg" align="center" wrap="wrap">
          <Link
            to="/home"
            className="ck-header-link"
            activeProps={{ style: { color: 'black' } }}
          >
            <span className="font-medium">Home</span>
          </Link>
          {isLoggedIn ? (
            <>
              <Link
                to="/ingredients"
                className="ck-header-link"
                activeProps={{ style: { color: 'black' } }}
              >
                <span className="font-medium">Ingredients</span>
              </Link>
              <Link
                to="/recipe"
                className="ck-header-link"
                activeProps={{ style: { color: 'black' } }}
              >
                <span className="font-medium">Recipe</span>
              </Link>
              <Link
                to="/notification"
                className="ck-header-link"
                activeProps={{ style: { color: 'black' } }}
              >
                <span className="font-medium">Notifications</span>
              </Link>
              <Link
                to="/profile"
                className="ck-header-link"
                activeProps={{ style: { color: 'black' } }}
              >
                <span className="font-medium">Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="ck-header-link"
                activeProps={{ style: { color: 'black' } }}
              >
                <span className="font-medium">Sign In</span>
              </Link>
              <Link
                to="/signup"
                className="ck-header-link"
                activeProps={{ style: { color: 'black' } }}
              >
                <span className="font-medium">Sign Up</span>
              </Link>
            </>
          )}
        </Flex>
      </Box>
    </header>
  )
}
