import math
import random
import time
from copy import deepcopy

class Node:
    """Node in the Monte Carlo Tree Search"""
    
    def __init__(self, state, parent=None, action=None):
        self.state = state  # Current game state (board)
        self.parent = parent  # Parent node
        self.action = action  # Action that led to this state
        self.children = []  # Child nodes
        self.visits = 0  # Number of visits to this node
        self.wins = 0  # Number of wins from this node (for the AI)
        self.untried_actions = self._get_untried_actions()  # Actions not yet explored
    
    def _get_untried_actions(self):
        """Get list of untried actions from the current state"""
        if hasattr(self.state, 'get_valid_moves'):
            valid_moves = []
            for row in range(len(self.state)):
                for col in range(len(self.state[0])):
                    if self.state[row][col] is None:
                        valid_moves.append((row, col))
            return valid_moves
        else:
            # ใช้สำหรับสถานะเกมทั่วไปที่ไม่มีเมธอด get_valid_moves
            return [(row, col) for row in range(3) for col in range(3) 
                   if self.state[row][col] is None]
    
    def select_child(self, exploration_weight=1.0):
        """
        Select a child node according to the UCB1 formula
        balancing exploration and exploitation
        """
        # UCB1 formula: wi/ni + c * sqrt(ln(N)/ni)
        # wi = wins for the node
        # ni = visits for the node
        # N = total visits for the parent
        # c = exploration weight
        
        # Prevent division by zero
        if self.visits == 0:
            return None
        
        # Select the child with the highest UCB value
        log_visits = math.log(self.visits)
        ucb_values = [
            (child.wins / child.visits) + 
            exploration_weight * math.sqrt(log_visits / child.visits)
            if child.visits > 0 else float('inf')
            for child in self.children
        ]
        
        return self.children[ucb_values.index(max(ucb_values))]
    
    def add_child(self, action, state):
        """Add a new child node"""
        child = Node(state=state, parent=self, action=action)
        
        # Remove the action from untried actions
        if action in self.untried_actions:
            self.untried_actions.remove(action)
        
        self.children.append(child)
        return child
    
    def update(self, result):
        """Update node statistics"""
        self.visits += 1
        self.wins += result

class MCTS:
    """Monte Carlo Tree Search algorithm"""
    
    def __init__(self, exploration_weight=1.0):
        self.exploration_weight = exploration_weight
        self.root = None
    
    def reset_for_new_game(self):
        """Reset the search tree for a new game"""
        self.root = None
    
    def choose_action(self, board, time_limit=1.0, max_iterations=1000):
        """
        Choose the best action using MCTS within a time limit
        
        Args:
            board: The current state of the game board
            time_limit: Maximum time (in seconds) for MCTS
            max_iterations: Maximum number of iterations
            
        Returns:
            tuple: Best action (row, col)
        """
        # Create a deep copy of the board to avoid modifying the original
        board_copy = deepcopy(board)
        
        # Initialize the root node with the current board state
        self.root = Node(state=board_copy)
        
        # Run MCTS within time limit or iteration limit
        start_time = time.time()
        iterations = 0
        
        while (time.time() - start_time < time_limit and 
               iterations < max_iterations):
            # Phase 1: Selection
            node = self._select(self.root)
            
            # Phase 2: Expansion
            if node.untried_actions:
                # If there are untried actions, expand the node
                action = random.choice(node.untried_actions)
                
                # Create a deep copy of the state
                state_copy = deepcopy(node.state)
                
                # Apply the action
                state_copy[action[0]][action[1]] = 'X'  # AI's move
                
                # Add the new child node
                node = node.add_child(action, state_copy)
            
            # Phase 3: Simulation
            result = self._simulate(node.state)
            
            # Phase 4: Backpropagation
            self._backpropagate(node, result)
            
            iterations += 1
        
        # Choose the best child of the root based on the most visits
        if not self.root.children:
            # If no children (shouldn't happen with a valid board)
            valid_moves = [(r, c) for r in range(3) for c in range(3) 
                         if board[r][c] is None]
            return random.choice(valid_moves) if valid_moves else (0, 0)
        
        # Select the child with the most visits
        visits = [child.visits for child in self.root.children]
        best_child = self.root.children[visits.index(max(visits))]
        
        return best_child.action
    
    def _select(self, node):
        """
        Select a node for expansion
        Traverse the tree from the root to a leaf node using UCB1
        """
        while not node.untried_actions and node.children:
            node = node.select_child(self.exploration_weight)
        return node
    
    def _simulate(self, state):
        """
        Simulate a random playout from the given state
        Return 1 for AI win, 0 for draw, -1 for AI loss
        """
        # Create a copy of the state for simulation
        state_copy = deepcopy(state)
        current_player = 'O'  # Player's move after AI's move
        
        # Simulate until the game is over
        while True:
            # Get valid moves
            valid_moves = [(r, c) for r in range(3) for c in range(3) 
                          if state_copy[r][c] is None]
            
            # If no valid moves, the game is a draw
            if not valid_moves:
                return 0  # Draw
            
            # Choose a random move
            row, col = random.choice(valid_moves)
            state_copy[row][col] = current_player
            
            # Check if the game is over
            if self._is_winner(state_copy, current_player):
                # If the player (O) wins, it's a loss for the AI
                if current_player == 'O':
                    return -1
                # If the AI (X) wins, it's a win for the AI
                else:
                    return 1
            
            # Switch player
            current_player = 'X' if current_player == 'O' else 'O'
    
    def _backpropagate(self, node, result):
        """Backpropagate the result up the tree"""
        while node:
            node.update(result)
            node = node.parent
    
    def _is_winner(self, state, player):
        """Check if a player has won on the given state"""
        # Check rows
        for row in range(3):
            if state[row][0] == state[row][1] == state[row][2] == player:
                return True
        
        # Check columns
        for col in range(3):
            if state[0][col] == state[1][col] == state[2][col] == player:
                return True
        
        # Check diagonals
        if state[0][0] == state[1][1] == state[2][2] == player:
            return True
        if state[0][2] == state[1][1] == state[2][0] == player:
            return True
        
        return False
    
    def adapt_for_game(self, game_type):
        """
        Adapt MCTS for different game types
        
        Args:
            game_type: Type of game ('TicTacToe', 'ConnectFour', 'Checkers', 'Chess')
        """
        if game_type == 'TicTacToe':
            # Default implementation already works for TicTacToe
            pass
        elif game_type == 'ConnectFour':
            # Modify for Connect Four specific rules
            pass
        elif game_type == 'Checkers':
            # Modify for Checkers specific rules
            pass
        elif game_type == 'Chess':
            # Modify for Chess specific rules
            pass
