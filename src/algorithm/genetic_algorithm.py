import numpy as np
import random
import pickle
import os
from copy import deepcopy

class GeneticAlgorithm:
    """
    Genetic Algorithm agent for playing Tic Tac Toe
    Uses a population of strategies that evolve over time
    """
    def __init__(self, population_size=50, mutation_rate=0.1):
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.population = []  # List of strategies (weighted matrices)
        self.fitness_scores = []
        self.best_strategy = None
        self.generation = 0
        self.init_population()
        self.load_best_strategy()
    
    def init_population(self):
        """Initialize the population with random strategies"""
        self.population = []
        for _ in range(self.population_size):
            # Create a random strategy (weights matrix for board evaluation)
            strategy = np.random.uniform(-1, 1, 10)  # 9 board positions + 1 bias
            self.population.append(strategy)
        
        self.fitness_scores = [0] * self.population_size
    
    def reset_for_new_game(self):
        """Reset the agent for a new game (no state needs to be maintained)"""
        pass
    
    def load_best_strategy(self):
        """Load the best strategy from file if available"""
        best_strategy_file = 'best_genetic_strategy.pkl'
        
        if os.path.exists(best_strategy_file):
            try:
                with open(best_strategy_file, 'rb') as f:
                    self.best_strategy = pickle.load(f)
                    print("Loaded best genetic strategy from file.")
            except Exception as e:
                print(f"Error loading genetic strategy: {e}")
                self.best_strategy = self.population[0] if self.population else None
        else:
            self.best_strategy = self.population[0] if self.population else None
    
    def save_best_strategy(self):
        """Save the best strategy to file"""
        if self.best_strategy is not None:
            try:
                with open('best_genetic_strategy.pkl', 'wb') as f:
                    pickle.dump(self.best_strategy, f)
            except Exception as e:
                print(f"Error saving best genetic strategy: {e}")
    
    def evaluate_board(self, board, strategy):
        """Evaluate a board state using a given strategy
        
        Args:
            board: 3x3 tic tac toe board
            strategy: weights vector for evaluation
            
        Returns:
            float: score for the board state
        """
        features = self.extract_features(board)
        return np.dot(features, strategy)
    
    def extract_features(self, board):
        """Extract features from the board state for evaluation
        
        Returns:
            numpy array: features vector
        """
        # Flatten the board and convert to numerical values
        features = np.zeros(10)  # 9 board positions + 1 bias
        
        # Set bias term
        features[9] = 1.0
        
        # Process board positions
        for i in range(3):
            for j in range(3):
                idx = i * 3 + j
                if board[i][j] == 'X':  # AI's piece
                    features[idx] = 1
                elif board[i][j] == 'O':  # Player's piece
                    features[idx] = -1
                # Empty spaces remain 0
        
        return features
    
    def choose_action(self, board):
        """Choose the best move according to the best evolved strategy
        
        Args:
            board: Current board state
            
        Returns:
            tuple: (row, col) of the chosen move
        """
        # Use best strategy if available, otherwise use first in population
        strategy = self.best_strategy if self.best_strategy is not None else self.population[0]
        
        best_score = float('-inf')
        best_move = None
        
        # Try each possible move
        for row in range(3):
            for col in range(3):
                if board[row][col] is None:
                    # Create a new board with this move
                    new_board = deepcopy(board)
                    new_board[row][col] = 'X'  # AI's move
                    
                    # Evaluate the resulting position
                    score = self.evaluate_board(new_board, strategy)
                    
                    # Keep track of the best move
                    if score > best_score:
                        best_score = score
                        best_move = (row, col)
        
        return best_move
    
    def evolve(self, num_generations=10):
        """Evolve the population over multiple generations
        
        Args:
            num_generations: Number of generations to evolve
        """
        for _ in range(num_generations):
            self._evolve_one_generation()
        
        # Update the best strategy
        best_idx = np.argmax(self.fitness_scores)
        self.best_strategy = self.population[best_idx]
        
        # Save the best strategy
        self.save_best_strategy()
        
        self.generation += num_generations
    
    def _evolve_one_generation(self):
        """Evolve the population by one generation using selection, crossover, and mutation"""
        # Selection: Select parents based on fitness
        parents = self._selection()
        
        # Create a new generation
        new_population = []
        
        # Elitism: Keep the best strategy
        best_idx = np.argmax(self.fitness_scores)
        new_population.append(self.population[best_idx])
        
        # Crossover and mutation to create offspring
        while len(new_population) < self.population_size:
            # Select parents
            parent1, parent2 = random.sample(parents, 2)
            
            # Crossover
            child = self._crossover(parent1, parent2)
            
            # Mutation
            child = self._mutate(child)
            
            # Add to new population
            new_population.append(child)
        
        # Update population
        self.population = new_population
        
        # Reset fitness scores
        self.fitness_scores = [0] * self.population_size
    
    def _selection(self):
        """Select parents for next generation based on fitness
        
        Returns:
            list: selected parents
        """
        # Ensure fitness scores are positive for selection
        fitness = np.array(self.fitness_scores)
        fitness = fitness - min(fitness) + 1e-6  # Add small constant to avoid zeros
        
        # Calculate selection probabilities
        sum_fitness = np.sum(fitness)
        if sum_fitness == 0:
            # If all strategies have zero fitness, select uniformly
            probs = np.ones(len(fitness)) / len(fitness)
        else:
            probs = fitness / sum_fitness
        
        # Select parents
        parents_idx = np.random.choice(
            len(self.population), 
            size=self.population_size // 2, 
            p=probs,
            replace=True
        )
        parents = [self.population[idx] for idx in parents_idx]
        
        return parents
    
    def _crossover(self, parent1, parent2):
        """Create a child by combining two parents
        
        Args:
            parent1, parent2: Parent strategies
            
        Returns:
            numpy array: Child strategy
        """
        # Single point crossover
        crossover_point = random.randint(1, len(parent1) - 1)
        child = np.concatenate([parent1[:crossover_point], parent2[crossover_point:]])
        return child
    
    def _mutate(self, strategy):
        """Mutate a strategy with small random changes
        
        Args:
            strategy: Strategy to mutate
            
        Returns:
            numpy array: Mutated strategy
        """
        mutated = strategy.copy()
        
        # For each weight
        for i in range(len(mutated)):
            # Apply mutation with probability mutation_rate
            if random.random() < self.mutation_rate:
                # Add random noise to the weight
                mutation = random.uniform(-0.5, 0.5)
                mutated[i] += mutation
                
                # Keep weights within reasonable bounds
                mutated[i] = max(-1, min(1, mutated[i]))
        
        return mutated
    
    def update_fitness(self, strategy_idx, result):
        """Update fitness score for a strategy based on game result
        
        Args:
            strategy_idx: Index of strategy in population
            result: Game result (1 for win, 0 for draw, -1 for loss)
        """
        if 0 <= strategy_idx < len(self.fitness_scores):
            # Win provides the most fitness, draw is neutral, loss reduces fitness
            if result == 1:  # Win
                reward = 1.0
            elif result == 0:  # Draw
                reward = 0.1
            else:  # Loss
                reward = -0.5
                
            self.fitness_scores[strategy_idx] += reward
    
    def play_tournament(self, game_simulator, generations=50, games_per_strategy=10):
        """Run a tournament to evolve better strategies
        
        Args:
            game_simulator: Function that simulates a game with a given strategy
            generations: Number of generations to evolve
            games_per_strategy: Number of games to play per strategy per generation
        """
        print(f"Starting genetic algorithm tournament - {generations} generations")
        
        for gen in range(generations):
            print(f"Generation {gen+1}/{generations}")
            
            # Play games with each strategy
            for i, strategy in enumerate(self.population):
                total_score = 0
                
                # Play multiple games per strategy to get a better fitness estimate
                for _ in range(games_per_strategy):
                    # Simulate game and get result
                    result = game_simulator(strategy)
                    total_score += result
                
                # Update fitness (average score across games)
                self.fitness_scores[i] = total_score / games_per_strategy
            
            # Evolve to the next generation
            self._evolve_one_generation()
            
            # Display best fitness so far
            best_fitness = max(self.fitness_scores)
            print(f"  Best fitness: {best_fitness:.4f}")
        
        # After tournament, save the best strategy
        best_idx = np.argmax(self.fitness_scores)
        self.best_strategy = self.population[best_idx]
        self.save_best_strategy()
        print(f"Tournament complete. Best strategy saved with fitness: {max(self.fitness_scores):.4f}")
    
    def learn_from_game(self, board, move, result):
        """Learn from a completed game
        
        Args:
            board: Final board state
            move: Last move made (row, col)
            result: Game result (1 for win, 0 for draw, -1 for loss)
        """
        # If we have a best strategy, update it based on game results
        if self.best_strategy is not None:
            # Extract features from final board
            features = self.extract_features(board)
            
            # Calculate current evaluation
            current_eval = np.dot(features, self.best_strategy)
            
            # Adjust strategy weights based on result
            learning_rate = 0.01
            
            # Calculate error (difference between actual result and prediction)
            error = result - current_eval
            
            # Update weights based on error and features
            self.best_strategy += learning_rate * error * features
            
            # Save updated strategy if it was a win
            if result > 0:
                self.save_best_strategy()

# Test the genetic algorithm
if __name__ == "__main__":
    genetic_ai = GeneticAlgorithm(population_size=20)
    
    # Basic test board
    board = [
        ['X', None, 'O'],
        [None, 'X', None],
        ['O', None, None]
    ]
    
    # Choose a move
    move = genetic_ai.choose_action(board)
    print(f"Chosen move: {move}")
    
    # Simulate learning from game result
    board[move[0]][move[1]] = 'X'  # Make the move
    genetic_ai.learn_from_game(board, move, 1)  # Learn from win
    
    print("Test complete.")
