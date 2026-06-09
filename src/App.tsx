import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import MainMenu from '@/pages/MainMenu'
import LevelSelect from '@/pages/LevelSelect'
import GamePlay from '@/pages/Home'
import Shop from '@/pages/Shop'
import Settings from '@/pages/Settings'

function AnimatedRoutes() {
  const location = useLocation()

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      y: -15,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const,
      },
    },
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="h-full w-full"
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<MainMenu />} />
          <Route path="/levels" element={<LevelSelect />} />
          <Route path="/game/:levelId" element={<GamePlay />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<MainMenu />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

function AppContent() {
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement
      doc.style.setProperty('--app-height', `${window.innerHeight}px`)
    }
    setAppHeight()
    window.addEventListener('resize', setAppHeight)
    window.addEventListener('orientationchange', setAppHeight)
    return () => {
      window.removeEventListener('resize', setAppHeight)
      window.removeEventListener('orientationchange', setAppHeight)
    }
  }, [])

  return (
    <div
      className="relative w-full overflow-hidden bg-wood-900"
      style={{
        height: 'var(--app-height, 100vh)',
      }}
    >
      <AnimatedRoutes />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
