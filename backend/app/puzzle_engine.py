"""
Maze Puzzle Game Engine

This module implements the core game logic for validating moves in maze puzzles.
Supports walls, keys, doors, portals, goals, and step limits.
"""

from typing import Dict, List, Any, Set, Tuple
import logging

logger = logging.getLogger(__name__)

# Move directions mapping
MOVES = {
    "UP": {"r": -1, "c": 0},
    "DOWN": {"r": 1, "c": 0},
    "LEFT": {"r": 0, "c": -1},
    "RIGHT": {"r": 0, "c": 1}
}


class PuzzleValidationError(Exception):
    """Exception raised for puzzle validation errors."""
    pass


def apply_move(pos: Dict[str, int], move: str) -> Dict[str, int]:
    """Apply a single move to a position.
    
    Args:
        pos: Current position {r: row, c: col}
        move: Move direction (UP, DOWN, LEFT, RIGHT)
        
    Returns:
        New position after applying the move
        
    Raises:
        PuzzleValidationError: If move direction is invalid
    """
    if move not in MOVES:
        raise PuzzleValidationError(f"Invalid move: {move}. Must be one of {list(MOVES.keys())}")
    
    delta = MOVES[move]
    return {
        "r": pos["r"] + delta["r"],
        "c": pos["c"] + delta["c"]
    }


def is_position_valid(pos: Dict[str, int], rows: int, cols: int) -> bool:
    """Check if a position is within the grid bounds.
    
    Args:
        pos: Position to check {r: row, c: col}
        rows: Number of rows in the grid
        cols: Number of columns in the grid
        
    Returns:
        True if position is valid, False otherwise
    """
    return 0 <= pos["r"] < rows and 0 <= pos["c"] < cols


def get_cell_content(grid: List[List[str]], pos: Dict[str, int]) -> str:
    """Get the content of a cell at the given position.
    
    Args:
        grid: 2D grid array
        pos: Position {r: row, c: col}
        
    Returns:
        Cell content as string
    """
    return grid[pos["r"]][pos["c"]]


def resolve_portals(
    pos: Dict[str, int],
    cells: List[List[str]],
    portals: Dict[str, Dict[str, int]],
    rows: int,
    cols: int,
    max_jumps: int = 10
) -> Tuple[Dict[str, int], List[Dict[str, int]], int]:
    """Resolve portal teleportation with proper chaining and validation.
    
    Args:
        pos: Starting position
        cells: 2D grid array
        portals: Portal mapping {portal_id: {r: row, c: col}}
        rows: Grid rows
        cols: Grid columns
        max_jumps: Maximum portal jumps to prevent infinite loops
        
    Returns:
        Tuple of (final_position, teleport_trace, jumps_made)
        
    Raises:
        PuzzleValidationError: If portal chain issues occur
    """
    jumps_made = 0
    visited_labels: Set[str] = set()
    teleport_trace: List[Dict[str, int]] = []
    current = pos.copy()
    
    while True:
        # Check bounds
        if not is_position_valid(current, rows, cols):
            raise PuzzleValidationError(f"Portal teleported to out-of-bounds position {current}")
        
        cell = get_cell_content(cells, current)
        
        # If not a portal, we're done
        if not (isinstance(cell, str) and cell.startswith("P")):
            break
        
        # Check jump limit
        if jumps_made >= max_jumps:
            raise PuzzleValidationError(f"Portal chain exceeded maximum jumps ({max_jumps})")
        
        # Check for loops
        if cell in visited_labels:
            raise PuzzleValidationError(f"Portal loop detected involving {cell}")
        
        # Check portal exists
        if cell not in portals:
            raise PuzzleValidationError(f"Portal {cell} not found in portal mapping")
        
        visited_labels.add(cell)
        target = portals[cell]
        
        # Validate target position
        if not is_position_valid(target, rows, cols):
            raise PuzzleValidationError(f"Portal {cell} targets out-of-bounds position {target}")
        
        current = {"r": target["r"], "c": target["c"]}
        teleport_trace.append(current.copy())
        jumps_made += 1
    
    # Final validation - check if we teleported into a wall
    if is_position_valid(current, rows, cols):
        final_cell = get_cell_content(cells, current)
        if final_cell == "W":
            raise PuzzleValidationError(f"Portal teleported into a wall at {current}")
    
    return current, teleport_trace, jumps_made


def validate_puzzle_grid(grid_data: Dict[str, Any]) -> bool:
    """Validate that a puzzle grid has all required components.
    
    Args:
        grid_data: Complete puzzle grid data
        
    Returns:
        True if grid is valid
        
    Raises:
        PuzzleValidationError: If grid is invalid
    """
    required_fields = ["rows", "cols", "start", "goal", "cells"]
    
    for field in required_fields:
        if field not in grid_data:
            raise PuzzleValidationError(f"Missing required field: {field}")
    
    rows, cols = grid_data["rows"], grid_data["cols"]
    
    # Validate grid dimensions
    if rows <= 0 or cols <= 0:
        raise PuzzleValidationError("Grid dimensions must be positive")
    
    # Validate cells array
    cells = grid_data["cells"]
    if len(cells) != rows:
        raise PuzzleValidationError(f"Expected {rows} rows, got {len(cells)}")
    
    for i, row in enumerate(cells):
        if len(row) != cols:
            raise PuzzleValidationError(f"Row {i} has {len(row)} columns, expected {cols}")
    
    # Validate start and goal positions
    start = grid_data["start"]
    goal = grid_data["goal"]
    
    if not is_position_valid(start, rows, cols):
        raise PuzzleValidationError(f"Start position {start} is out of bounds")
    
    if not is_position_valid(goal, rows, cols):
        raise PuzzleValidationError(f"Goal position {goal} is out of bounds")

    # Validate cell contents and invariants
    allowed_literals = {" ", "S", "G", "W", "K", "D"}
    start_count = 0
    goal_count = 0
    for r, row in enumerate(cells):
        for c, cell in enumerate(row):
            # All cells must be strings
            if not isinstance(cell, str):
                raise PuzzleValidationError(
                    f"Invalid cell type at ({r},{c}). Expected string, got {type(cell).__name__}"
                )
            # Allow portals like 'P1', 'P2', ... in addition to literals
            if cell not in allowed_literals and not cell.startswith("P"):
                raise PuzzleValidationError(
                    f"Unknown cell value '{cell}' at ({r},{c}). Allowed: {sorted(list(allowed_literals))} or 'P*'"
                )
            if cell == "S":
                start_count += 1
            elif cell == "G":
                goal_count += 1

    # Ensure the marked start/goal in grid align with coordinates provided
    if get_cell_content(cells, start) != "S":
        raise PuzzleValidationError(
            "Grid invariant violated: start position does not contain 'S'"
        )
    if get_cell_content(cells, goal) != "G":
        raise PuzzleValidationError(
            "Grid invariant violated: goal position does not contain 'G'"
        )

    # Basic sanity: exactly one 'S' and one 'G' keep puzzles well-formed
    if start_count != 1:
        raise PuzzleValidationError(
            f"Expected exactly one 'S' in grid, found {start_count}"
        )
    if goal_count != 1:
        raise PuzzleValidationError(
            f"Expected exactly one 'G' in grid, found {goal_count}"
        )

    return True


def validate_moves(grid_data: Dict[str, Any], moves: List[str]) -> Dict[str, Any]:
    """Validate a sequence of moves on a puzzle grid.
    
    This is the main engine function that processes moves and returns the result.
    
    Args:
        grid_data: Complete puzzle data including grid, rules, portals
        moves: List of move strings (UP, DOWN, LEFT, RIGHT)
        
    Returns:
        Dict containing:
            - success: bool
            - message: str
            - steps: int
            - keys_collected: list
            - trace: list of positions
            - final_position: dict (for debugging)
        
    Raises:
        PuzzleValidationError: If puzzle or moves are invalid
    """
    try:
        # Validate puzzle structure
        validate_puzzle_grid(grid_data)
        
        # Extract grid components
        rows, cols = grid_data["rows"], grid_data["cols"]
        cells = grid_data["cells"]
        start = grid_data["start"].copy()
        goal = grid_data["goal"]
        portals = grid_data.get("portals", {})
        rules = grid_data.get("rules", {})
        
        # Game state initialization
        pos = start.copy()
        keys_collected: Set[str] = set()
        trace = [pos.copy()]  # Track all positions visited
        steps = 0
        max_steps = rules.get("max_steps", 1000)
        doors_require_keys = rules.get("doors_require_keys", True)
        collect_all_keys = rules.get("collect_all_keys", False)
        
        # Precompute total keys if needed
        total_keys = sum(row.count("K") for row in cells) if collect_all_keys else 0
        
        logger.info(f"Starting puzzle validation: {len(moves)} moves, max_steps: {max_steps}")
        
        # Early exit if already at goal
        if pos == goal:
            if collect_all_keys and len(keys_collected) < total_keys:
                logger.info("At goal but need to collect all keys first")
            else:
                return {
                    "success": True,
                    "message": "Already at goal!",
                    "steps": 0,
                    "keys_collected": list(keys_collected),
                    "trace": trace,
                    "final_position": pos
                }
        
        # Process each move
        for i, move in enumerate(moves):
            # Normalize move
            move = move.strip().upper()
            steps += 1
            
            # Check step limit first
            if steps > max_steps:
                return {
                    "success": False,
                    "message": f"Step limit exceeded ({max_steps})",
                    "steps": steps,
                    "keys_collected": list(keys_collected),
                    "trace": trace,
                    "final_position": pos
                }
            
            try:
                # Calculate new position
                new_pos = apply_move(pos, move)
                
                # Check bounds
                if not is_position_valid(new_pos, rows, cols):
                    return {
                        "success": False,
                        "message": f"Move {i+1} ({move}) goes out of bounds",
                        "steps": steps,
                        "keys_collected": list(keys_collected),
                        "trace": trace,
                        "final_position": pos
                    }
                
                # Get cell content
                cell = get_cell_content(cells, new_pos)
                
                # Check for wall collision
                if cell == "W":
                    return {
                        "success": False,
                        "message": f"Move {i+1} ({move}) hits a wall at {new_pos}",
                        "steps": steps,
                        "keys_collected": list(keys_collected),
                        "trace": trace,
                        "final_position": pos
                    }
                
                # Handle portals with proper chaining
                if isinstance(cell, str) and cell.startswith("P"):
                    try:
                        resolved_pos, teleport_trace, portal_jumps = resolve_portals(
                            new_pos, cells, portals, rows, cols
                        )
                        if portal_jumps > 0:
                            logger.info(f"Portal teleportation: {cell} -> {resolved_pos} ({portal_jumps} jumps)")
                            new_pos = resolved_pos
                            # Add teleport trace to main trace
                            trace.extend(teleport_trace)
                            # Get final cell content after teleportation
                            cell = get_cell_content(cells, new_pos)
                    except PuzzleValidationError as e:
                        return {
                            "success": False,
                            "message": f"Portal error: {str(e)}",
                            "steps": steps,
                            "keys_collected": list(keys_collected),
                            "trace": trace,
                            "final_position": pos
                        }
                
                # Update position
                pos = new_pos
                trace.append(pos.copy())
                
                # Handle cell interactions after moving and teleporting
                if cell == "K":
                    key_id = f"key_{pos['r']}_{pos['c']}"
                    keys_collected.add(key_id)
                    logger.info(f"Collected key at {pos}")
                
                elif cell == "D":
                    if doors_require_keys and len(keys_collected) == 0:
                        return {
                            "success": False,
                            "message": f"Door at {pos} requires a key",
                            "steps": steps,
                            "keys_collected": list(keys_collected),
                            "trace": trace,
                            "final_position": pos
                        }
                    logger.info(f"Passed through door at {pos}")
                
                # Check for goal by position (not just by 'G' cell)
                if pos == goal:
                    # Check if all keys need to be collected
                    if collect_all_keys and len(keys_collected) < total_keys:
                        return {
                            "success": False,
                            "message": f"Must collect all keys ({total_keys}) before reaching goal. Collected: {len(keys_collected)}",
                            "steps": steps,
                            "keys_collected": list(keys_collected),
                            "trace": trace,
                            "final_position": pos
                        }
                    
                    # Success!
                    return {
                        "success": True,
                        "message": f"Goal reached in {steps} steps!",
                        "steps": steps,
                        "keys_collected": list(keys_collected),
                        "trace": trace,
                        "final_position": pos
                    }
                
            except PuzzleValidationError as e:
                return {
                    "success": False,
                    "message": f"Move {i+1}: {str(e)}",
                    "steps": steps,
                    "keys_collected": list(keys_collected),
                    "trace": trace,
                    "final_position": pos
                }
        
        # All moves processed but goal not reached
        return {
            "success": False,
            "message": "Moves exhausted without reaching goal",
            "steps": steps,
            "keys_collected": list(keys_collected),
            "trace": trace,
            "final_position": pos
        }
        
    except Exception as e:
        logger.error(f"Puzzle validation error: {str(e)}")
        raise PuzzleValidationError(f"Puzzle validation failed: {str(e)}")


def get_puzzle_statistics(grid_data: Dict[str, Any]) -> Dict[str, Any]:
    """Get statistics about a puzzle grid.
    
    Args:
        grid_data: Complete puzzle data
        
    Returns:
        Dict with puzzle statistics
    """
    try:
        validate_puzzle_grid(grid_data)
        
        cells = grid_data["cells"]
        stats = {
            "dimensions": {"rows": grid_data["rows"], "cols": grid_data["cols"]},
            "total_cells": grid_data["rows"] * grid_data["cols"],
            "walls": 0,
            "keys": 0,
            "doors": 0,
            "portals": 0,
            "empty_cells": 0,
            "start": grid_data["start"],
            "goal": grid_data["goal"],
            "max_steps": grid_data.get("rules", {}).get("max_steps", 1000),
        }
        
        for row in cells:
            for cell in row:
                if cell == "W":
                    stats["walls"] += 1
                elif cell == "K":
                    stats["keys"] += 1
                elif cell == "D":
                    stats["doors"] += 1
                elif cell.startswith("P"):
                    stats["portals"] += 1
                elif cell == " ":
                    stats["empty_cells"] += 1
        
        return stats
        
    except Exception as e:
        logger.error(f"Error getting puzzle statistics: {str(e)}")
        return {"error": str(e)}