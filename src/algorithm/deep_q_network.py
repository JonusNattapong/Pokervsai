import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model, save_model
from tensorflow.keras.layers import Dense, Flatten, Conv2D
from tensorflow.keras.optimizers import Adam
import random
from collections import deque

class DeepQNetwork:
    """
    Deep Q-Network (DQN) algorithm for game AI
    Uses deep learning to learn optimal strategy through reinforcement learning
    """
    def __init__(self, state_size=(3, 3), action_size=9, learning_rate=0.001, gamma=0.95):
        self.state_size = state_size  # Board dimensions
        self.action_size = action_size  # Number of possible actions (9 for 3x3 board)
        self.memory = deque(maxlen=2000)  # Replay memory
        self.gamma = gamma  # Discount factor
        self.epsilon = 1.0  # Exploration rate
        self.epsilon_min = 0.01  # Minimum exploration probability
        self.epsilon_decay = 0.995  # Exponential decay rate for exploration
        self.learning_rate = learning_rate  # Learning rate
        self.model_path = 'dqn_model.h5'
        
        # Create network or load existing model
        if os.path.exists(self.model_path):
            self.model = load_model(self.model_path)
            print("Loaded existing DQN model")
        else:
            self.model = self._build_model()
            print("Created new DQN model")
    
    def _build_model(self):
        """Build deep neural network model"""
        model = Sequential()
        # Input layer: convolutional layer for board pattern recognition
        model.add(Conv2D(32, kernel_size=(2, 2), activation='relu', 
                         input_shape=(self.state_size[0], self.state_size[1], 1)))
        model.add(Conv2D(64, kernel_size=(2, 2), activation='relu'))
        model.add(Flatten())
        # Hidden layers
        model.add(Dense(64, activation='relu'))
        model.add(Dense(32, activation='relu'))
        # Output layer: one neuron per possible action
        model.add(Dense(self.action_size, activation='linear'))
        
        # Compile model
        model.compile(loss='mse', optimizer=Adam(learning_rate=self.learning_rate))
        return model
    
    def reset_for_new_game(self):
        """Reset internal state for new game"""
        # Nothing special to reset for DQN between games
        pass
    
    def _board_to_state(self, board):
        """Convert board to neural network input format"""
        # Convert the board to a numerical representation
        state = np.zeros((*self.state_size, 1))
        for i in range(self.state_size[0]):
            for j in range(self.state_size[1]):
                if board[i][j] == 'X':
                    state[i, j, 0] = 1  # AI's piece
                elif board[i][j] == 'O':
                    state[i, j, 0] = -1  # Player's piece
                # Empty spaces remain 0
        return state
    
    def _get_valid_actions(self, board):
        """Get all valid moves on current board"""
        valid_actions = []
        for i in range(self.state_size[0]):
            for j in range(self.state_size[1]):
                if board[i][j] is None:
                    valid_actions.append(i * self.state_size[1] + j)
        return valid_actions
    
    def choose_action(self, board):
        """
        Choose action for current board state
        Uses epsilon-greedy policy (exploration vs. exploitation)
        """
        # Convert board to state representation
        state = self._board_to_state(board)
        valid_actions = self._get_valid_actions(board)
        
        # If no valid actions, return None
        if not valid_actions:
            return None
        
        # Exploration: choose random action
        if np.random.rand() <= self.epsilon:
            action_idx = random.choice(valid_actions)
        else:
            # Exploitation: predict Q-values and choose best valid action
            q_values = self.model.predict(np.expand_dims(state, axis=0), verbose=0)[0]
            
            # Filter to only valid actions
            valid_q_values = [(action, q_values[action]) for action in valid_actions]
            action_idx = max(valid_q_values, key=lambda x: x[1])[0]
        
        # Convert action index to board coordinates
        row = action_idx // self.state_size[1]
        col = action_idx % self.state_size[1]
        
        return (row, col)
    
    def record_memory(self, state, action, reward, next_state, done):
        """Store experience in replay memory"""
        action_idx = action[0] * self.state_size[1] + action[1]  # Convert (row, col) to index
        self.memory.append((state, action_idx, reward, next_state, done))
    
    def record_move(self, board, action):
        """Record move for later training (simplified API)"""
        state = self._board_to_state(board)
        # The reward and next state will be set during learn_from_game
        # For now, store a placeholder
        self.current_state = state
        self.current_action = action
    
    def learn_from_game(self, reward):
        """
        Process game result and learn from it
        reward: 1.0 for win, -1.0 for loss, 0.0 for draw
        """
        # Decay exploration rate
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
        
        # Need enough samples in memory for meaningful learning
        if len(self.memory) < 32:
            return
        
        # Sample random batch from memory
        minibatch = random.sample(self.memory, min(32, len(self.memory)))
        
        for state, action, reward, next_state, done in minibatch:
            target = reward
            if not done:
                # Q-learning formula: Q(s,a) = r + γ max Q(s',a')
                target = reward + self.gamma * np.amax(self.model.predict(np.expand_dims(next_state, axis=0), verbose=0)[0])
            
            # Get current Q-values
            target_f = self.model.predict(np.expand_dims(state, axis=0), verbose=0)
            # Update the Q-value for the action
            target_f[0][action] = target
            
            # Train the network
            self.model.fit(np.expand_dims(state, axis=0), target_f, epochs=1, verbose=0)
        
        # Save model periodically
        if random.random() < 0.1:  # 10% chance to save
            self.save_model()
    
    def process_game_result(self, final_board, result):
        """Process entire game result with final reward"""
        if hasattr(self, 'current_state') and hasattr(self, 'current_action'):
            # Convert action to index
            action_idx = self.current_action[0] * self.state_size[1] + self.current_action[1]
            
            # Final state is the end of game
            final_state = self._board_to_state(final_board)
            
            # Record in memory with final reward
            self.memory.append((self.current_state, action_idx, result, final_state, True))
            
            # Learn from this experience
            self.learn_from_game(result)
            
            # Clear current state/action
            del self.current_state
            del self.current_action
    
    def save_model(self):
        """Save trained model to file"""
        try:
            self.model.save(self.model_path)
            print("DQN model saved successfully")
        except Exception as e:
            print(f"Error saving DQN model: {e}")
    
    def load_model(self):
        """Load trained model from file"""
        try:
            if os.path.exists(self.model_path):
                self.model = load_model(self.model_path)
                print("DQN model loaded successfully")
        except Exception as e:
            print(f"Error loading DQN model: {e}")

# Test code
if __name__ == "__main__":
    dqn_agent = DeepQNetwork()
    
    # Test board
    board = [
        ['X', None, None],
        [None, 'O', None],
        [None, None, None]
    ]
    
    # Choose action
    action = dqn_agent.choose_action(board)
    print(f"DQN chose action: {action}")
    
    # Record move
    dqn_agent.record_move(board, action)
    
    # Simulate making the move
    if action:
        board[action[0]][action[1]] = 'X'
    
    # Process result (assume AI wins)
    dqn_agent.process_game_result(board, 1.0)
    
    print("Test complete")
