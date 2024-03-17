import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

//pages
import Home from "./pages/home";
import Lobby from "./pages/lobby";
import AppContext from "./AppContext";

function App() {
  return (
    <Router>
      <div className='App bg-background bg-cover bg-center font-nunito'>
        <AppContext>
          <Routes>
            <Route path='/' exact element={<Home />} />
            <Route path='/Lobby' element={<Lobby />} />
            <Route path='/Lobby/:id' element={<Lobby />} />
          </Routes>
        </AppContext>
      </div>
    </Router>
  );
}

export default App;
