# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import random
from collections import deque
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def generate_maze_recursive_backtracking(size):
    maze = [[1 for _ in range(size)] for _ in range(size)]
    
    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    
    def is_valid(row, col):
        return 0 <= row < size and 0 <= col < size
    
    def recursive_backtrack(row, col):
        # Mark current cell as a path (0)
        maze[row][col] = 0
        
        shuffled_dirs = directions.copy()
        random.shuffle(shuffled_dirs)
        
        # Try each direction
        for dr, dc in shuffled_dirs:
            new_row, new_col = row + dr*2, col + dc*2
            
            if is_valid(new_row, new_col) and maze[new_row][new_col] == 1:

                maze[row + dr][col + dc] = 0
                recursive_backtrack(new_row, new_col)
    
    start_row, start_col = 0, 0
    recursive_backtrack(start_row, start_col)
    
    maze[0][0] = 0
    maze[size-1][size-1] = 0
    
    return maze


def solve_maze_bfs(maze, start, end):
    rows, cols = len(maze), len(maze[0])
    
    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    
    queue = deque([(start[0], start[1])])
    
    visited = set([(start[0], start[1])])
    visited_list = [(start[0], start[1])]  
    parent = {}
    
    while queue:
        row, col = queue.popleft()
        
        if row == end[0] and col == end[1]:

            path = []
            current = (row, col)
            
            while current != (start[0], start[1]):
                path.append(current)
                current = parent[current]
            
            path.append((start[0], start[1]))
            path.reverse()
            
            return [list(p) for p in path], visited_list
        
        for dr, dc in directions:
            new_row, new_col = row + dr, col + dc
            
            if (0 <= new_row < rows and 
                0 <= new_col < cols and 
                maze[new_row][new_col] == 0 and 
                (new_row, new_col) not in visited):
                
                queue.append((new_row, new_col))
                visited.add((new_row, new_col))
                visited_list.append([new_row, new_col])
                parent[(new_row, new_col)] = (row, col)
    
    return [], visited_list

def solve_maze_dfs(maze, start, end):
    rows, cols = len(maze), len(maze[0])
    
    directions = [(-1, 0), (0, 1), (1, 0), (0, -1)]
    
    stack = [(start[0], start[1])]
    
    visited = set([(start[0], start[1])])
    visited_list = [(start[0], start[1])] 
    parent = {}
    
    while stack:
        row, col = stack.pop()
        
        if row == end[0] and col == end[1]:

            path = []
            current = (row, col)
            
            while current != (start[0], start[1]):
                path.append(current)
                current = parent[current]
            
            path.append((start[0], start[1]))
            path.reverse()
            
            return [list(p) for p in path], visited_list
        
        shuffled_dirs = directions.copy()
        random.shuffle(shuffled_dirs)
        
        for dr, dc in shuffled_dirs:
            new_row, new_col = row + dr, col + dc
            
            if (0 <= new_row < rows and 
                0 <= new_col < cols and 
                maze[new_row][new_col] == 0 and 
                (new_row, new_col) not in visited):
                
                stack.append((new_row, new_col))
                visited.add((new_row, new_col))
                visited_list.append([new_row, new_col])
                parent[(new_row, new_col)] = (row, col)
    
    return [], visited_list

@app.route('/generate-maze', methods=['GET'])
def generate_maze():
    try:
        size = int(request.args.get('size', 10))
        
        # Validate size
        if size < 5 or size > 30:
            return jsonify({'error': 'Size must be between 5 and 30'}), 400
        
       
        maze = generate_maze_recursive_backtracking(size)

        
        return jsonify({'maze': maze})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/solve-maze', methods=['POST'])
def solve_maze():
    try:
        data = request.json
        maze = data.get('maze')
        algorithm = data.get('algorithm', 'bfs')
        start = data.get('start', [0, 0])
        end = data.get('end', [len(maze)-1, len(maze[0])-1])
        
        # Validate input
        if not maze:
            return jsonify({'error': 'No maze provided'}), 400
        
        if algorithm == 'bfs':
            solution, visited = solve_maze_bfs(maze, start, end)
        elif algorithm == 'dfs':
            solution, visited = solve_maze_dfs(maze, start, end)
        else:
            return jsonify({'error': 'Invalid algorithm'}), 400
        visited_list = [list(v) for v in visited]
        
        return jsonify({
            'solution': solution,
            'visited': visited_list
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)