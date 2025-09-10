import './App.css'
import Navbar from './components/Navbar'
import News from './components/News'
import { Provider } from "react-redux"
import { store } from './store/store'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Navbar/>
        <Routes>
           <Route path="/" element={<News />} />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App