import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Room from "./Views/Room";

import './App.css';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Room} />
      </Switch>
    </Router>
  );
}

export default App;
