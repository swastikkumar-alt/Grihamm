import os
import json
import subprocess
import sys
from pathlib import Path

# Paths
HOLODECK_DIR = Path(r"d:\Grihamm\Holodeck_AI")
VENV_PYTHON = HOLODECK_DIR / "venv" / "Scripts" / "python.exe"
ASSETS_DIR = Path(r"d:\Grihamm\Holodeck_Assets")
WEBAPP_PUBLIC = Path(r"d:\Grihamm\webapp\public")

def run_holodeck(query):
    print(f"--- Running Holodeck for query: {query} ---")
    
    # Run main.py
    cmd = [
        str(VENV_PYTHON),
        "ai2holodeck/main.py",
        "--query", query,
        "--save_dir", "./data/scenes",
        "--generate_image", "True",
        "--add_time", "False"  # Fixed name for easier tracking
    ]
    
    # Environment variables
    env = os.environ.copy()
    env["OBJATHOR_ASSETS_BASE_DIR"] = str(ASSETS_DIR)
    env["PYTHONPATH"] = str(HOLODECK_DIR) # Fix ModuleNotFoundError
    
    process = subprocess.run(cmd, cwd=HOLODECK_DIR, env=env, capture_output=True, text=True)
    
    if process.returncode != 0:
        print("Error running Holodeck:")
        print(process.stderr)
        return False
    
    print(process.stdout)
    return True

def translate_scene(query):
    query_name = query.replace(" ", "_").replace("'", "")[:30]
    scene_file = HOLODECK_DIR / "data" / "scenes" / query_name / f"{query_name}.json"
    
    if not scene_file.exists():
        print(f"Scene file not found: {scene_file}")
        return False
    
    with open(scene_file, 'r') as f:
        holodeck_data = json.load(f)
        
    # Find room dimensions (AI2-THOR rooms are complex, we'll simplify)
    # Usually floor is at y=0, we look at room dimensions or object bounds
    room_width = 10.0
    room_length = 10.0
    
    if holodeck_data.get("rooms"):
        # Very simplified room size calculation
        room_width = max([r.get("width", 5) for r in holodeck_data["rooms"]])
        room_length = max([r.get("length", 5) for r in holodeck_data["rooms"]])

    translated = {
        "room": {
            "width": room_width,
            "length": room_length,
            "floorColor": "#1a1a1a",
            "wallColor": "#2a2a2a"
        },
        "objects": []
    }
    
    for obj in holodeck_data.get("objects", []):
        # Map AI2-THOR object to Grihamm format
        # Grihamm expects: position: [x, z, rotation], width, length, height
        pos = obj.get("position", {"x": 0, "y": 0, "z": 0})
        rot = obj.get("rotation", {"x": 0, "y": 0, "z": 0})
        
        # Simple color mapping based on object type or random
        color = "#888"
        if "wood" in obj.get("assetId", "").lower(): color = "#8B4513"
        elif "metal" in obj.get("assetId", "").lower(): color = "#C0C0C0"
        elif "fabric" in obj.get("assetId", "").lower(): color = "#4682B4"
        
        translated["objects"].append({
            "name": obj.get("assetId", "unknown").split("_")[0],
            "position": [pos["x"], pos["z"], rot["y"] * (3.14159 / 180.0)], # Convert to radians
            "width": 0.8,  # Default if not found
            "length": 0.8,
            "height": 1.0,
            "color": color
        })
        
    output_file = WEBAPP_PUBLIC / "scene_data.json"
    with open(output_file, 'w') as f:
        json.dump(translated, f, indent=2)
        
    print(f"--- Translated scene saved to {output_file} ---")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        query = "a modern living room"
    else:
        query = sys.argv[1]
        
    if run_holodeck(query):
        translate_scene(query)
