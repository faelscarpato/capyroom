
import React from 'react';
import { useStore } from './store';
import { ViewMode } from './types';
import Gallery from './components/Gallery';
import Editor from './components/Editor/Editor';

const App: React.FC = () => {
  const { view } = useStore();

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {view === ViewMode.GALLERY && <Gallery />}
      {view === ViewMode.EDITOR && <Editor />}
    </div>
  );
};

export default App;
