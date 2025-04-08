import numpy as np
import os
import pickle
import random
from copy import deepcopy

class NeuralNetworkAgent:
    """
    Neural Network agent for Tic-Tac-Toe game
    Uses a simple neural network to evaluate board states and select moves
    """
    def __init__(self, learning_rate=0.01):
        self.learning_rate = learning_rate
        
        # Neural Network architecture (simple feedforward)
        # Input layer: 9 nodes (one for each cell: 1=X, 0=empty, -1=O)
        # Hidden layer: 27 nodes
        # Output layer: 9 nodes (one for each possible move)
        
        # Initialize weights with random values if no saved model exists
        if os.path.exists('nn_weights.pkl'):
            self.load_model()
        else:
            # Xavier initialization for weights
            self.weights_input_hidden = np.random.randn(9, 27) * np.sqrt(2.0/9)
            self.weights_hidden_output = np.random.randn(27, 9) * np.sqrt(2.0/27)
            
            # Bias terms
            self.bias_hidden = np.random.randn(27) * 0.01
            self.bias_output = np.random.randn(9) * 0.01
        
        # Store game data for training
        self.game_states = []  # [board_state, move_index, reward]
    
    def load_model(self):
        """โหลดโมเดลที่ฝึกไว้แล้ว"""
        try:
            with open('nn_weights.pkl', 'rb') as f:
                weights = pickle.load(f)
                self.weights_input_hidden = weights['input_hidden']
                self.weights_hidden_output = weights['hidden_output']
                self.bias_hidden = weights['bias_hidden']
                self.bias_output = weights['bias_output']
                print("Neural network model loaded successfully.")
        except Exception as e:
            print(f"Error loading neural network model: {e}")
            # Initialize with random weights if loading fails
            self.weights_input_hidden = np.random.randn(9, 27) * np.sqrt(2.0/9)
            self.weights_hidden_output = np.random.randn(27, 9) * np.sqrt(2.0/27)
            self.bias_hidden = np.random.randn(27) * 0.01
            self.bias_output = np.random.randn(9) * 0.01
    
    def save_model(self):
        """บันทึกโมเดลลงไฟล์"""
        weights = {
            'input_hidden': self.weights_input_hidden,
            'hidden_output': self.weights_hidden_output,
            'bias_hidden': self.bias_hidden,
            'bias_output': self.bias_output
        }
        try:
            with open('nn_weights.pkl', 'wb') as f:
                pickle.dump(weights, f)
                print("Neural network model saved successfully.")
        except Exception as e:
            print(f"Error saving neural network model: {e}")
    
    def reset_for_new_game(self):
        """รีเซ็ตข้อมูลสำหรับเกมใหม่"""
        self.game_states = []
    
    def _board_to_input(self, board):
        """แปลงกระดานเกมเป็น input vector"""
        # Flatten board and convert to numerical representation
        # X = 1, O = -1, empty = 0
        input_vector = np.zeros(9)
        for i in range(3):
            for j in range(3):
                index = i * 3 + j
                if board[i][j] == 'X':
                    input_vector[index] = 1
                elif board[i][j] == 'O':
                    input_vector[index] = -1
        return input_vector
    
    def _relu(self, x):
        """ฟังก์ชันเปิดใช้งาน ReLU"""
        return np.maximum(0, x)
    
    def _relu_derivative(self, x):
        """อนุพันธ์ของฟังก์ชัน ReLU"""
        return np.where(x > 0, 1, 0)
    
    def _softmax(self, x):
        """ฟังก์ชัน Softmax สำหรับ output layer"""
        exp_x = np.exp(x - np.max(x))  # ลบด้วยค่าสูงสุดเพื่อป้องกัน numerical overflow
        return exp_x / exp_x.sum()
    
    def _forward_pass(self, board_input):
        """คำนวณ forward pass ผ่านเครือข่าย"""
        # Hidden layer
        hidden_input = np.dot(board_input, self.weights_input_hidden) + self.bias_hidden
        hidden_output = self._relu(hidden_input)
        
        # Output layer
        output_input = np.dot(hidden_output, self.weights_hidden_output) + self.bias_output
        output = self._softmax(output_input)
        
        return hidden_input, hidden_output, output_input, output
    
    def choose_action(self, board):
        """เลือกการกระทำจากกระดานปัจจุบัน"""
        board_input = self._board_to_input(board)
        _, _, _, output = self._forward_pass(board_input)
        
        # Create a mask for valid moves (empty cells)
        valid_moves_mask = np.zeros(9)
        for i in range(3):
            for j in range(3):
                index = i * 3 + j
                if board[i][j] is None:
                    valid_moves_mask[index] = 1
        
        # Apply mask and get probabilities for valid moves only
        valid_move_probs = output * valid_moves_mask
        
        # If no valid moves, return None
        if np.sum(valid_move_probs) == 0:
            return None
        
        # Normalize probabilities
        valid_move_probs = valid_move_probs / np.sum(valid_move_probs)
        
        # Choose move based on probabilities
        # Exploration: sometimes choose randomly
        if random.random() < 0.1:  # 10% exploration rate
            valid_indices = np.where(valid_moves_mask == 1)[0]
            if len(valid_indices) > 0:
                move_index = np.random.choice(valid_indices)
            else:
                return None
        else:
            # Exploitation: choose the best move
            move_index = np.argmax(valid_move_probs)
        
        # Convert index back to board position
        row = move_index // 3
        col = move_index % 3
        
        return (row, col)
    
    def record_move(self, board, move, player):
        """บันทึกการเคลื่อนที่สำหรับการเรียนรู้ในภายหลัง"""
        board_input = self._board_to_input(board)
        move_index = move[0] * 3 + move[1]
        
        # สร้าง reward ชั่วคราว (จะอัปเดตในภายหลังเมื่อเกมจบ)
        reward = 0
        
        # บันทึกสถานะ
        self.game_states.append((board_input, move_index, reward))
    
    def train_on_game(self, final_reward):
        """ฝึกเครือข่ายประสาทเทียมบนเกมที่จบแล้ว"""
        if not self.game_states:
            return
        
        # อัปเดต reward สำหรับการเคลื่อนที่สุดท้าย
        last_state = self.game_states[-1]
        self.game_states[-1] = (last_state[0], last_state[1], final_reward)
        
        # Backpropagation สำหรับแต่ละการเคลื่อนที่
        for board_input, move_index, reward in self.game_states:
            # Forward pass
            hidden_input, hidden_output, output_input, output = self._forward_pass(board_input)
            
            # Target output - กำหนดเป้าหมายให้เป็น output ปัจจุบันและปรับการเคลื่อนที่ที่เลือกตาม reward
            target_output = np.array(output)
            target_output[move_index] += self.learning_rate * reward
            
            # Calculate output layer error
            output_error = target_output - output
            
            # Output layer gradients
            output_delta = output_error
            
            # Hidden layer error
            hidden_error = np.dot(output_delta, self.weights_hidden_output.T)
            
            # Hidden layer gradients
            hidden_delta = hidden_error * self._relu_derivative(hidden_input)
            
            # Update weights and biases
            # Output layer
            self.weights_hidden_output += self.learning_rate * np.outer(hidden_output, output_delta)
            self.bias_output += self.learning_rate * output_delta
            
            # Hidden layer
            self.weights_input_hidden += self.learning_rate * np.outer(board_input, hidden_delta)
            self.bias_hidden += self.learning_rate * hidden_delta
        
        # บันทึกโมเดลหลังจากฝึก
        self.save_model()
        
        # รีเซ็ตสำหรับเกมใหม่
        self.reset_for_new_game()

# ทดสอบ Neural Network Agent
if __name__ == "__main__":
    agent = NeuralNetworkAgent()
    
    # สร้างกระดานทดสอบ
    board = [
        ['X', None, None],
        [None, 'O', None],
        [None, None, None]
    ]
    
    print("Test board:")
    for row in board:
        print([cell if cell else ' ' for cell in row])
    
    # เลือกการกระทำ
    action = agent.choose_action(board)
    print(f"Chosen action: {action}")
    
    # ทดสอบการบันทึกและการฝึก
    agent.record_move(board, action, 'X')
    
    # สร้างกระดานและการเคลื่อนที่เพิ่มเติมเพื่อจำลองเกม
    board[action[0]][action[1]] = 'X'
    player_move = (2, 2)
    board[player_move[0]][player_move[1]] = 'O'
    agent.record_move(board, (0, 2), 'X')
    
    # ฝึกบนเกมที่จบ โดยสมมติว่า AI ชนะ
    agent.train_on_game(1.0)
    
    print("Test complete.")
