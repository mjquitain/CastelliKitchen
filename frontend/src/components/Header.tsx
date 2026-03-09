import { getToken } from '@/lib/api';
import { Box, Flex, Group, Text, Title } from '@mantine/core';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChefHat } from 'lucide-react';

export default function Header() {
  useRouterState()
  const isLoggedIn = !!getToken()

  return (
    <>
      <header className="p-2 flex space-between shadow-lg border-b" style={{ borderColor: '#8a9a7b', position: 'sticky', top: 0, backgroundColor: '#8a9a7b', zIndex: 15 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Group ml={'16px'}>
            <ChefHat size={32} color="white" />
            <div>
              <Title order={2} style={{ color: 'white', marginBottom: 0 }}>
                Castelli Kitchen
              </Title>
              <Text size="sm" style={{ color: 'white' }}>
                Reduce food waste, one recipe at a time
              </Text>
            </div>
          </Group>
          <Flex direction="row" justify='flex-end' mr={"16px"} gap={"xl"} align={"center"}>
            <Link
              to="/home"
              className="text-white hover:text-black"
              activeProps={{ style: { color: 'black' } }}
            >
              <span className="font-medium">Home</span>
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  to="/ingredients"
                  className="text-white hover:text-black"
                  activeProps={{ style: { color: 'black' } }}
                >
                  <span className="font-medium">Ingredients</span>
                </Link>
                <Link
                  to="/recipe"
                  className="text-white hover:text-black"
                  activeProps={{ style: { color: 'black' } }}
                >
                  <span className="font-medium">Recipe</span>
                </Link>
                <Link
                  to="/notification"
                  className="text-white hover:text-black"
                  activeProps={{ style: { color: 'black' } }}
                >
                  <span className="font-medium">Notifications</span>
                </Link>
                <Link
                  to="/profile"
                  className="text-white hover:text-black"
                  activeProps={{ style: { color: 'black' } }}
                >
                  <span className="font-medium">Profile</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-black"
                  activeProps={{ style: { color: 'black' } }}
                >
                  <span className="font-medium">Sign In</span>
                </Link>
                <Link
                  to="/signup"
                  className="text-white hover:text-black"
                  activeProps={{ style: { color: 'black' } }}
                >
                  <span className="font-medium">Sign Up</span>
                </Link>
              </>
            )}
          </Flex>
        </Box>
      </header>
    </>
  )
}
