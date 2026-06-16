import { Theme } from './settings/types';
import { C } from './components/generated/C';

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
      <C />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;