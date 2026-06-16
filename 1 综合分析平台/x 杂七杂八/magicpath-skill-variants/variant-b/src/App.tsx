import { Theme } from './settings/types';
import { B } from './components/generated/B';

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
      <B />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;