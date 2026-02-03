import { Box, Flex, Group, Text, Title } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { ChefHat } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="p-2 flex space-between shadow-lg border-b" style={{ borderColor: '#8a9a7b', position: 'sticky', top: 0, backgroundColor: '#8a9a7b', zIndex: 15 }}>
        <Box style={{ display: 'flex', justifyContent: 'space-between', width: '100%', }}>
          <Group ml={'16px'} >
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
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-black"
              activeProps={{
                style: { color: 'black' }
              }}
            >
              <span className="font-medium">Home</span>
            </Link>
            <Link
              to="/ingredients"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-black"
              activeProps={{
                style: { color: 'black' }
              }}
            >
              <span className="font-medium">Ingredients</span>
            </Link>
            <Link
              to="/recipe"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-black"
              activeProps={{
                style: { color: 'black' }
              }}
            >
              <span className="font-medium">Recipe</span>
            </Link>
            <Link
              to="/notification"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-black"
              activeProps={{
                style: { color: 'black' }
              }}
            >
              <span className='font-medium'>Notifications</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-black"
              activeProps={{
                style: { color: 'black' }
              }}
            >
              <span className='font-medium'>Profile</span>
            </Link>
          </Flex>
        </Box>
      </header>
    </>
  )
}

// import { Link } from '@tanstack/react-router'

// import { Home, Menu, X } from 'lucide-react'
// import { useState } from 'react'

// export default function Header() {
//   const [isOpen, setIsOpen] = useState(false)

//   return (
//     <>
//       <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
//         <button
//           onClick={() => setIsOpen(true)}
//           className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
//           aria-label="Open menu"
//         >
//           <Menu size={24} />
//         </button>
//         <h1 className="ml-4 text-xl font-semibold">
//           <Link to="/">
//             <img
//               src="/tanstack-word-logo-white.svg"
//               alt="TanStack Logo"
//               className="h-10"
//             />
//           </Link>
//         </h1>
//       </header>

//       <aside
//         className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
//           }`}
//       >
//         <div className="flex items-center justify-between p-4 border-b border-gray-700">
//           <h2 className="text-xl font-bold">Navigation</h2>
//           <button
//             onClick={() => setIsOpen(false)}
//             className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
//             aria-label="Close menu"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         <nav className="flex-1 p-4 overflow-y-auto">
//           <Link
//             to="/"
//             onClick={() => setIsOpen(false)}
//             className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
//             activeProps={{
//               className:
//                 'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
//             }}
//           >
//             <Home size={20} />
//             <span className="font-medium">Home</span>
//           </Link>

//           {/* Demo Links Start */}

//           {/* <Link
//             to="/demo/tanstack-query"
//             onClick={() => setIsOpen(false)}
//             className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
//             activeProps={{
//               className:
//                 'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
//             }}
//           >
//             <Network size={20} />
//             <span className="font-medium">TanStack Query</span>
//           </Link> */}

//           {/* Demo Links End */}
//         </nav>
//       </aside>
//     </>
//   )
// }
