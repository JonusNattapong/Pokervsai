import numpy as np
import pickle
import os
import random
from copy import deepcopy

class QLearningAgent:
    """
    Q-Learning agent for Tic-Tac-Toe game
    Uses Q-learning algorithm to improve playing strategy over time
    """
    def __init__(self, learning_rate=0.3, discount_factor=0.9, exploration_rate=0.2):
        self.learning_rate = learning_rate  # Alpha: โอกาสในการเรียนรู้
        self.discount_factor = discount_factor  # Gamma: น้ำหนักของรางวัลในอนาคต
        self.exploration_rate = exploration_rate  # Epsilon: โอกาสในการสำรวจ
        self.q_values = {}  # Q-table เก็บค่า Q(s,a)
        self.last_states = []  # เก็บสถานะที่ผ่านมาในเกมปัจจุบัน
        self.last_actions = []  # เก็บการกระทำที่ผ่านมาในเกมปัจจุบัน
        
        # โหลด Q-values จากไฟล์ถ้ามีอยู่
        self.load_q_values()
    
    def load_q_values(self):
        """โหลด Q-values จากไฟล์"""
        if os.path.exists('q_values.pkl'):
            try:
                with open('q_values.pkl', 'rb') as f:
                    self.q_values = pickle.load(f)
                print(f"Loaded {len(self.q_values)} Q-values from file")
            except Exception as e:
                print(f"Error loading Q-values: {e}")
    
    def save_q_values(self):
        """บันทึก Q-values ลงไฟล์"""
        try:
            with open('q_values.pkl', 'wb') as f:
                pickle.dump(self.q_values, f)
        except Exception as e:
            print(f"Error saving Q-values: {e}")
    
    def reset_for_new_game(self):
        """รีเซ็ตสถานะสำหรับเกมใหม่"""
        self.last_states = []
        self.last_actions = []
    
    def _board_to_state(self, board):
        """
        แปลงกระดานเป็น state string ที่ใช้เป็น key ใน Q-table
        board: รายการ 2 มิติของ 'X', 'O', หรือ None
        """
        # แปลงกระดานเป็น tuple ของสตริง
        state = []
        for row in board:
            state_row = []
            for cell in row:
                if cell is None:
                    state_row.append('_')
                else:
                    state_row.append(cell)
            state.append(''.join(state_row))
        
        return tuple(state)
    
    def _get_possible_actions(self, board):
        """
        หาการกระทำที่เป็นไปได้ (ช่องว่างทั้งหมดบนกระดาน)
        """
        possible_actions = []
        for i in range(3):
            for j in range(3):
                if board[i][j] is None:
                    possible_actions.append((i, j))
        return possible_actions
    
    def _get_q_value(self, state, action):
        """
        ดึงค่า Q(s,a) จาก Q-table
        ถ้าไม่มี ให้ค่าเริ่มต้นเป็น 0
        """
        state_str = str(state)
        action_str = str(action)
        
        if state_str not in self.q_values:
            self.q_values[state_str] = {}
        
        if action_str not in self.q_values[state_str]:
            self.q_values[state_str][action_str] = 0.0
        
        return self.q_values[state_str][action_str]
    
    def _update_q_value(self, state, action, value):
        """
        อัปเดตค่า Q(s,a) ใน Q-table
        """
        state_str = str(state)
        action_str = str(action)
        
        if state_str not in self.q_values:
            self.q_values[state_str] = {}
        
        self.q_values[state_str][action_str] = value
    
    def _best_action(self, state, possible_actions):
        """
        เลือกการกระทำที่ดีที่สุดโดยพิจารณาจากค่า Q
        """
        if not possible_actions:
            return None
        
        # ค้นหาค่า Q สูงสุด
        best_actions = []
        best_q_value = float('-inf')
        
        for action in possible_actions:
            q_value = self._get_q_value(state, action)
            
            if q_value > best_q_value:
                best_actions = [action]
                best_q_value = q_value
            elif q_value == best_q_value:
                best_actions.append(action)
        
        # สุ่มเลือกจากการกระทำที่ดีที่สุด (กรณีที่มีหลายตัวเท่ากัน)
        return random.choice(best_actions) if best_actions else None
    
    def choose_action(self, board):
        """
        เลือกการกระทำตามนโยบาย epsilon-greedy
        """
        state = self._board_to_state(board)
        possible_actions = self._get_possible_actions(board)
        
        if not possible_actions:
            return None
        
        # สำรวจ (Exploration) ด้วยความน่าจะเป็น epsilon
        if random.random() < self.exploration_rate:
            action = random.choice(possible_actions)
        # เลือกการกระทำที่ดีที่สุดตามค่า Q (Exploitation)
        else:
            action = self._best_action(state, possible_actions)
        
        return action
    
    def record_move(self, board, action):
        """
        บันทึกสถานะและการกระทำในเกมปัจจุบัน
        """
        state = self._board_to_state(board)
        self.last_states.append(state)
        self.last_actions.append(action)
    
    def learn_from_game(self, reward):
        """
        เรียนรู้จากเกมที่จบแล้ว ด้วยรางวัลที่ได้รับ
        reward: 1.0 สำหรับชนะ, -1.0 สำหรับแพ้, 0.0 สำหรับเสมอ
        """
        if not self.last_states or not self.last_actions:
            return
        
        # ระบุรางวัลสำหรับสถานะสุดท้าย
        self._update_q_value(
            self.last_states[-1],
            self.last_actions[-1],
            reward
        )
        
        # อัปเดตค่า Q สำหรับทุกสถานะก่อนหน้า
        for i in range(len(self.last_states) - 2, -1, -1):
            state = self.last_states[i]
            action = self.last_actions[i]
            next_state = self.last_states[i + 1]
            next_possible_actions = self._get_possible_actions(self._state_to_board(next_state))
            
            # หาค่า Q สูงสุดที่เป็นไปได้จากสถานะถัดไป
            if next_possible_actions:
                max_next_q = max([self._get_q_value(next_state, a) for a in next_possible_actions])
            else:
                max_next_q = 0
            
            # คำนวณค่า Q ใหม่ตามสูตร Q-learning
            current_q = self._get_q_value(state, action)
            new_q = current_q + self.learning_rate * (self.discount_factor * max_next_q - current_q)
            
            # อัปเดต Q-value
            self._update_q_value(state, action, new_q)
        
        # บันทึก Q-values ลงไฟล์
        self.save_q_values()
        
        # รีเซ็ตสำหรับเกมใหม่
        self.reset_for_new_game()
    
    def _state_to_board(self, state):
        """
        แปลง state กลับเป็นกระดาน (สำหรับการคำนวณภายใน)
        """
        board = []
        for row_str in state:
            row = []
            for cell in row_str:
                if cell == '_':
                    row.append(None)
                else:
                    row.append(cell)
            board.append(row)
        return board

# ทดสอบ Q-Learning Agent
if __name__ == "__main__":
    agent = QLearningAgent()
    
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
    
    # ทดสอบการเรียนรู้
    agent.record_move(board, action)
    agent.learn_from_game(1.0)  # สมมติว่า AI ชนะ
    
    print("Test complete.")
