import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [maze, setMaze] = useState([]);
  const [mazeSize, setMazeSize] = useState(10);
  const [algorithm, setAlgorithm] = useState('bfs');
  const [solving, setSolving] = useState(false);
  const [solution, setSolution] = useState([]);
  const [startPoint, setStartPoint] = useState({ row: 0, col: 0 });
  const [endPoint, setEndPoint] = useState({ row: 9, col: 9 });
  const [settingStart, setSettingStart] = useState(false);
  const [settingEnd, setSettingEnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [animationSpeed, setAnimationSpeed] = useState(50);
  const animationRef = useRef(null);
  const [visitedCells, setVisitedCells] = useState([]);
  const [animationStep, setAnimationStep] = useState(0);

  const generateMaze = async () => {
    try {
      setLoading(true);
      setError(null);
      setSolution([]);
      setVisitedCells([]);
      setAnimationStep(0);
      
      const response = await fetch(`http://localhost:5000/generate-maze?size=${mazeSize}`);
      if (!response.ok) {
        throw new Error('Failed to generate maze');
      }
      
      const data = await response.json();
      setMaze(data.maze);
      
      // Reset start and end points based on maze size
      setStartPoint({ row: 0, col: 0 });
      setEndPoint({ row: data.maze.length - 1, col: data.maze[0].length - 1 });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Solve the current maze
  const solveMaze = async () => {
    try {
      setLoading(true);
      setError(null);
      setSolving(true);
      setVisitedCells([]);
      setAnimationStep(0);
      
      const response = await fetch('http://localhost:5000/solve-maze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maze: maze,
          algorithm: algorithm,
          start: [startPoint.row, startPoint.col],
          end: [endPoint.row, endPoint.col]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to solve maze');
      }
      
      const data = await response.json();
      
      if (data.solution.length === 0) {
        setError('No solution found!');
        setSolving(false);
        setLoading(false);
        return;
      }
      
      setSolution(data.solution);
      setVisitedCells(data.visited);
      
      // Start animation
      setAnimationStep(1);
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setSolving(false);
      setLoading(false);
    }
  };
  
  // Handle cell click to set start/end points
  const handleCellClick = (row, col) => {
    // If the cell is a wall, we can't set start/end points there
    if (maze[row][col] === 1) return;
    
    if (settingStart) {
      setStartPoint({ row, col });
      setSettingStart(false);
    } else if (settingEnd) {
      setEndPoint({ row, col });
      setSettingEnd(false);
    }
  };
  
  // Animate the solution path
  useEffect(() => {
    if (animationStep > 0 && animationStep <= visitedCells.length + solution.length) {
      animationRef.current = setTimeout(() => {
        setAnimationStep(animationStep + 1);
      }, animationSpeed);
    } else if (animationStep > visitedCells.length + solution.length) {
      setSolving(false);
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [animationStep, visitedCells, solution, animationSpeed]);
  
  // Generate initial maze on component mount
  useEffect(() => {
    generateMaze();
  }, []);
  
  // Get cell class based on its state
  const getCellClass = (row, col) => {
    const isStart = row === startPoint.row && col === startPoint.col;
    const isEnd = row === endPoint.row && col === endPoint.col;
    const isWall = maze[row]?.[col] === 1;
    
    // Animation logic
    const visitedIndex = visitedCells.findIndex(cell => cell[0] === row && cell[1] === col);
    const isVisited = animationStep > visitedIndex && visitedIndex !== -1;
    
    const solutionIndex = solution.findIndex(cell => cell[0] === row && cell[1] === col);
    const isPath = animationStep > visitedCells.length + solutionIndex && solutionIndex !== -1;
    
    if (isStart) return 'bg-green-500';
    if (isEnd) return 'bg-red-500';
    if (isWall) return 'bg-gray-800';
    if (isPath) return 'bg-yellow-300';
    if (isVisited) return 'bg-blue-300';
    
    return 'bg-white';
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-4">Maze Generator & Solver</h1>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <label htmlFor="mazeSize" className="mr-2">Maze Size:</label>
          <input
            id="mazeSize"
            type="number"
            min="5"
            max="30"
            value={mazeSize}
            onChange={(e) => setMazeSize(parseInt(e.target.value))}
            className="border rounded p-1 w-16"
          />
        </div>
        
        <div className="flex items-center ml-4">
          <label htmlFor="algorithm" className="mr-2">Algorithm:</label>
          <select
            id="algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="border rounded p-1"
          >
            <option value="bfs">BFS (Shortest Path)</option>
            <option value="dfs">DFS (Depth-First)</option>
          </select>
        </div>
        
        <div className="flex items-center ml-4">
          <label htmlFor="animationSpeed" className="mr-2">Speed:</label>
          <input
            id="animationSpeed"
            type="range"
            min="10"
            max="200"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={generateMaze}
          disabled={loading || solving}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          Generate New Maze
        </button>
        
        <button
          onClick={() => setSettingStart(true)}
          disabled={loading || solving}
          className={`bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ${settingStart ? 'ring-2 ring-offset-2 ring-green-500' : ''}`}
        >
          Set Start Point
        </button>
        
        <button
          onClick={() => setSettingEnd(true)}
          disabled={loading || solving}
          className={`bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ${settingEnd ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
        >
          Set End Point
        </button>
        
        <button
          onClick={solveMaze}
          disabled={loading || solving || maze.length === 0}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {solving ? 'Solving...' : 'Solve Maze'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center">
        <div className="mb-2 flex gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-1"></div>
            <span>Start</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-1"></div>
            <span>End</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-300 mr-1"></div>
            <span>Visited</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-300 mr-1"></div>
            <span>Path</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="border border-gray-300 rounded overflow-hidden">
            {maze.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-6 h-6 ${getCellClass(rowIndex, colIndex)} border border-gray-200`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;