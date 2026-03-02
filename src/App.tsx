import { Route, Switch } from 'wouter';
import { Landing } from './pages/landing/Landing';
import { CreateGame } from './pages/create-game/CreateGame';
import { GameLobby } from './pages/lobby/GameLobby';

function App() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/create" component={CreateGame} />
      <Route path="/game/:gameId" component={GameLobby} />
    </Switch>
  );
}

export default App;

