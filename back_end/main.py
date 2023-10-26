from typing import Mapping, Any, List, Dict, Tuple
import os
from http_daemon import delay_open_url, serve_pages


class Player():
    def __init__(self, id:str) -> None:
        self.id = id
        self.x = 50
        self.y = 50
        self.what_i_know = 0
        
def find_player(player_id: str) -> Player:
    # if the player exists, return it
    if player_id in players:
        return players[player_id]
    else:
        #if the player just joined
        new_player = Player(player_id, )
        players[player_id] = new_player
        return new_player
        
    
players: Dict[str, Player] = {}

history: List[Player] = []

def update(payload: Mapping[str, Any]) -> Mapping[str, Any]:
    action = payload.get("action")
    updates: List[Tuple[str, int, int]] = []
    
    # if the action sent from front end to back end is move
    if action == 'move':
        # find the player that matches the id sent in payload
        player = find_player(payload["id"])
        
        # set the x and y coords for the player
        player.x = payload["x"]
        player.y = payload["y"]
        
        # add the player to history
        history.append(player)
             
    elif action == "iwantupdates":
        
        #find the player that matches the update payload and 
        #find it's latest history input
        player = find_player(payload["id"])
        client_knowledge = player.what_i_know
        
        for i in range (client_knowledge, len(history)):
            update_player = history[i]
            updates.append((update_player.id, update_player.x, update_player.y))
        # update what i know to it's latest entry in history 
        player.what_i_know = len(history)
    
    response = {"updates": updates}
    
    print(f'update was called with {payload}')
    return response

def main() -> None:
    # Get set up
    os.chdir(os.path.join(os.path.dirname(__file__), '../front_end'))

    # Serve pages
    port = 8987
    delay_open_url(f'http://localhost:{port}/game.html', .1)
    serve_pages(port, {
        'ajax.html': update,
    })

if __name__ == "__main__":
    main()
