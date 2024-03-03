import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

//pages
import Home from "./pages/home";
import Lobby from "./pages/lobby";

function App() {
  return (
    <Router>
      <div className='App'>
        <Routes>
          <Route path='/' exact element={<Home />} />
          <Route path='/Lobby' element={<Lobby />} />
          <Route path='/Lobby/:id' element={<Lobby />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
