import { Theme } from './settings/types';
import { Codex } from './components/generated/Codex';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <Codex />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;