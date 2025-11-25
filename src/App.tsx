import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import MusicList from './pages/MusicList'
import Evaluate from './pages/Evaluate'
import Trash from './pages/Trash'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MusicList />} />
          <Route path="evaluate" element={<Evaluate />} />
          <Route path="trash" element={<Trash />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
