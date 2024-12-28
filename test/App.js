import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import PostManager from './PostManager';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <h1>Post Manager</h1>
        <PostManager />
      </div>
    </Provider>
  );
}

export default App;

///npm install @reduxjs/toolkit react-redux axios