import json
import os
import random
from copy import deepcopy

class PatternRecognitionAgent:
    """
    Pattern Recognition agent for Tic-Tac-Toe game
    Analyzes player patterns and tries to predict and counter their moves
    """
    def __init__(self):
        self.player_patterns = {}
        self.current_game_moves = []
        self.load_patterns()
        self.settings = None
        self.game_settings = None
    
    def set_game_settings(self, game_settings):
        """ตั้งค่าการตั้งค่าเกม"""
        self.game_settings = game_settings
        self.settings = game_settings.get_settings()
    
    def load_patterns(self):
        """โหลดข้อมูลรูปแบบการเล่นจากไฟล์"""
        if os.path.exists('player_patterns.json'):
            try:
                with open('player_patterns.json', 'r') as f:
                    self.player_patterns = json.load(f)
                print(f"Loaded patterns for {len(self.player_patterns)} players")
            except Exception as e:
                print(f"Error loading pattern data: {e}")
    
    def save_patterns(self):
        """บันทึกข้อมูลรูปแบบการเล่นลงไฟล์"""
        try:
            with open('player_patterns.json', 'w') as f:
                json.dump(self.player_patterns, f, indent=2)
        except Exception as e:
            print(f"Error saving pattern data: {e}")
    
    def reset_for_new_game(self):
        """รีเซ็ตข้อมูลสำหรับเกมใหม่"""
        self.current_game_moves = []
    
    def _board_to_string(self, board):
        """แปลงกระดานเป็นสตริงเพื่อใช้เป็น key"""
        result = ""
        for row in board:
            for cell in row:
                if cell is None:
                    result += "_"
                else:
                    result += cell
        return result
    
    def record_move(self, board, move, player_id="default"):
        """บันทึกการเคลื่อนที่ของผู้เล่น"""
        board_str = self._board_to_string(board)
        self.current_game_moves.append({
            "board": board_str,
            "move": f"{move[0]},{move[1]}",
            "player": player_id
        })
    
    def analyze_game(self, winner=None, player_id="default"):
        """วิเคราะห์เกมที่จบแล้วและอัปเดตรูปแบบ"""
        if not self.current_game_moves:
            return
        
        # สร้างหรืออัปเดตข้อมูลผู้เล่น
        if player_id not in self.player_patterns:
            self.player_patterns[player_id] = {
                "games_played": 0,
                "win_rate": 0,
                "draw_rate": 0,
                "loss_rate": 0,
                "board_patterns": {},
                "first_moves": {},
                "favorite_moves": {},
                "adaptation_level": 1.0  # ระดับการปรับตัว
            }
        
        # ปรับการวิเคราะห์ตามระดับความยาก
        pattern_weight = self.settings['pattern_weight']
        adaptation_factor = self.player_patterns[player_id]["adaptation_level"]
        
        # อัปเดตข้อมูลการเล่น
        player_data = self.player_patterns[player_id]
        player_data["games_played"] += 1
        
        # ปรับระดับการปรับตัวตามผลการเล่น
        if winner == 'O':  # ผู้เล่นชนะ
            player_data["adaptation_level"] = min(1.0, player_data["adaptation_level"] + 0.1)
        elif winner == 'X':  # AI ชนะ
            player_data["adaptation_level"] = max(0.5, player_data["adaptation_level"] - 0.1)
        
        # บันทึกรูปแบบการเล่น
        for move_data in self.current_game_moves:
            if move_data["player"] == player_id:
                board_pattern = move_data["board"]
                move_str = move_data["move"]
                
                # ปรับน้ำหนักรูปแบบตามระดับการปรับตัว
                weight = pattern_weight * adaptation_factor
                
                # บันทึกรูปแบบกระดาน
                if board_pattern not in player_data["board_patterns"]:
                    player_data["board_patterns"][board_pattern] = {
                        "count": 0,
                        "moves": {},
                        "weight": weight
                    }
                
                board_data = player_data["board_patterns"][board_pattern]
                board_data["count"] += 1
                
                # บันทึกการเคลื่อนไหวที่โปรด
                if move_str not in board_data["moves"]:
                    board_data["moves"][move_str] = 0
                board_data["moves"][move_str] += weight
                
                # บันทึกการเคลื่อนไหวแรก
                if len(self.current_game_moves) == 1:
                    if move_str not in player_data["first_moves"]:
                        player_data["first_moves"][move_str] = 0
                    player_data["first_moves"][move_str] += weight
                
                # บันทึกการเคลื่อนไหวที่โปรด
                if move_str not in player_data["favorite_moves"]:
                    player_data["favorite_moves"][move_str] = 0
                player_data["favorite_moves"][move_str] += weight
        
        # บันทึกข้อมูลรูปแบบ
        self.save_patterns()
        
        # รีเซ็ตสำหรับเกมใหม่
        self.reset_for_new_game()
    
    def predict_move(self, board, player_id="default"):
        """ทำนายการเคลื่อนที่ถัดไปของผู้เล่นจากรูปแบบที่เคยเล่น"""
        # ถ้ายังไม่มีข้อมูลผู้เล่น
        if player_id not in self.player_patterns:
            return None
        
        current_board = self._board_to_string(board)
        player_data = self.player_patterns[player_id]
        
        # เช็คว่าเคยเจอรูปแบบกระดานนี้หรือไม่
        if current_board in player_data["board_patterns"]:
            patterns = player_data["board_patterns"][current_board]
            
            if patterns:
                # หาการเคลื่อนที่ที่พบบ่อยที่สุดสำหรับรูปแบบนี้
                best_move = max(patterns["moves"].items(), key=lambda x: x[1])[0]
                row, col = map(int, best_move.split(','))
                return (row, col)
        
        # ถ้าไม่เคยเจอรูปแบบนี้ ลองดูการเคลื่อนที่ที่ชอบ
        if player_data["favorite_moves"]:
            # กรองเฉพาะการเคลื่อนที่ที่ยังทำได้
            valid_moves = []
            
            for move_str, count in player_data["favorite_moves"].items():
                row, col = map(int, move_str.split(','))
                if row < 3 and col < 3 and board[row][col] is None:
                    valid_moves.append((move_str, count))
            
            if valid_moves:
                # เลือกการเคลื่อนที่ที่พบบ่อยที่สุด
                best_move = max(valid_moves, key=lambda x: x[1])[0]
                row, col = map(int, best_move.split(','))
                return (row, col)
        
        # ถ้าไม่มีรูปแบบที่พบหรือการเคลื่อนที่ที่ชอบที่ใช้ได้
        return None
    
    def choose_counter_move(self, board, player_id="default"):
        """เลือกการเคลื่อนที่เพื่อตอบโต้ผู้เล่น"""
        # ตรวจสอบการชนะของ AI
        for row in range(3):
            for col in range(3):
                if board[row][col] is None:
                    # ลองเคลื่อนที่
                    temp_board = deepcopy(board)
                    temp_board[row][col] = 'X'
                    
                    # ตรวจสอบชัยชนะ
                    if self._check_win(temp_board, 'X'):
                        return (row, col)  # ชนะได้ทันที
        
        # ตรวจสอบการป้องกันการชนะของผู้เล่น
        for row in range(3):
            for col in range(3):
                if board[row][col] is None:
                    # ลองสมมติว่าผู้เล่นเคลื่อนที่ตรงนี้
                    temp_board = deepcopy(board)
                    temp_board[row][col] = 'O'
                    
                    # ตรวจสอบว่าผู้เล่นชนะหรือไม่
                    if self._check_win(temp_board, 'O'):
                        return (row, col)  # ป้องกันการชนะ
        
        # ทำนายการเคลื่อนที่ถัดไปของผู้เล่น
        predicted_move = self.predict_move(board, player_id)
        
        if predicted_move:
            row, col = predicted_move
            # เช็คว่าการเคลื่อนที่นี้จะเป็นการชนะสำหรับผู้เล่นหรือไม่
            temp_board = deepcopy(board)
            temp_board[row][col] = 'O'
            
            if self._check_win(temp_board, 'O'):
                # ป้องกันการเคลื่อนที่นี้
                return (row, col)
        
        # สร้างกลยุทธ์การเคลื่อนที่ที่ดี
        
        # เลือกตรงกลางถ้าว่าง (กลยุทธ์ทั่วไป)
        if board[1][1] is None:
            return (1, 1)
        
        # เลือกมุมถ้าว่าง
        corners = [(0, 0), (0, 2), (2, 0), (2, 2)]
        available_corners = [corner for corner in corners if board[corner[0]][corner[1]] is None]
        if available_corners:
            # ลองหามุมที่สร้างโอกาสชนะมากที่สุด
            best_corner = None
            max_winning_lines = -1
            
            for corner in available_corners:
                temp_board = deepcopy(board)
                row, col = corner
                temp_board[row][col] = 'X'
                
                # นับแนวชนะที่เป็นไปได้
                winning_lines = self._count_potential_winning_lines(temp_board, 'X')
                
                if winning_lines > max_winning_lines:
                    max_winning_lines = winning_lines
                    best_corner = corner
            
            if best_corner:
                return best_corner
            
            # ถ้าไม่มีมุมที่ดีกว่ากัน สุ่มเลือก
            return random.choice(available_corners)
        
        # เลือกด้านถ้าว่าง
        edges = [(0, 1), (1, 0), (1, 2), (2, 1)]
        available_edges = [edge for edge in edges if board[edge[0]][edge[1]] is None]
        if available_edges:
            return random.choice(available_edges)
        
        # เลือกช่องว่างใดก็ได้
        empty_spots = []
        for row in range(3):
            for col in range(3):
                if board[row][col] is None:
                    empty_spots.append((row, col))
        
        if empty_spots:
            return random.choice(empty_spots)
        
        # ไม่มีการเคลื่อนที่ที่ใช้ได้
        return None
    
    def _check_win(self, board, player):
        """ตรวจสอบชัยชนะสำหรับผู้เล่น"""
        # ตรวจสอบแนวนอน
        for row in range(3):
            if board[row][0] == board[row][1] == board[row][2] == player:
                return True
        
        # ตรวจสอบแนวตั้ง
        for col in range(3):
            if board[0][col] == board[1][col] == board[2][col] == player:
                return True
        
        # ตรวจสอบแนวทแยง
        if board[0][0] == board[1][1] == board[2][2] == player:
            return True
        if board[0][2] == board[1][1] == board[2][0] == player:
            return True
        
        return False
    
    def _count_potential_winning_lines(self, board, player):
        """นับจำนวนแนวที่มีโอกาสชนะ (มีหมาก 2 ตัวในแนวและช่องว่าง 1 ช่อง)"""
        potential_wins = 0
        
        # ตรวจสอบแนวนอน
        for row in range(3):
            player_count = sum(1 for col in range(3) if board[row][col] == player)
            empty_count = sum(1 for col in range(3) if board[row][col] is None)
            if player_count == 2 and empty_count == 1:
                potential_wins += 1
        
        # ตรวจสอบแนวตั้ง
        for col in range(3):
            player_count = sum(1 for row in range(3) if board[row][col] == player)
            empty_count = sum(1 for row in range(3) if board[row][col] is None)
            if player_count == 2 and empty_count == 1:
                potential_wins += 1
        
        # ตรวจสอบแนวทแยง
        # แนวทแยงหลัก
        player_count_main = sum(1 for i in range(3) if board[i][i] == player)
        empty_count_main = sum(1 for i in range(3) if board[i][i] is None)
        if player_count_main == 2 and empty_count_main == 1:
            potential_wins += 1
        
        # แนวทแยงรอง
        player_count_other = sum(1 for i in range(3) if board[i][2-i] == player)
        empty_count_other = sum(1 for i in range(3) if board[i][2-i] is None)
        if player_count_other == 2 and empty_count_other == 1:
            potential_wins += 1
        
        return potential_wins

# ทดสอบ Pattern Recognition Agent
if __name__ == "__main__":
    agent = PatternRecognitionAgent()
    
    # สร้างกระดานทดสอบ
    board = [
        ['X', None, None],
        [None, 'O', None],
        [None, None, None]
    ]
    
    print("Test board:")
    for row in board:
        print([cell if cell else ' ' for cell in row])
    
    # ทดสอบการทำนายการเคลื่อนที่
    predicted_move = agent.predict_move(board)
    print(f"Predicted player move: {predicted_move}")
    
    # ทดสอบการเลือกการเคลื่อนที่ตอบโต้
    counter_move = agent.choose_counter_move(board)
    print(f"Counter move: {counter_move}")
    
    # ทดสอบการบันทึกการเคลื่อนที่
    agent.record_move(board, (1, 1), "test_player")
    
    # ทดสอบการวิเคราะห์เกม
    agent.analyze_game('X', "test_player")
    
    print("Test complete.")
