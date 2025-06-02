from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, Set
import json
import logging
from core.deps import get_current_user_websocket
from models.user import User
from services.notification_service import notification_service

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Store active connections by user_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a WebSocket connection and add it to the user's connection set"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection from the user's connection set"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user entry if no connections left
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        logger.info(f"User {user_id} disconnected")

    async def send_to_user(self, user_id: str, message: dict):
        """Send a message to all connections of a specific user"""
        if user_id in self.active_connections:
            connections_to_remove = set()
            
            for connection in self.active_connections[user_id].copy():
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
                    connections_to_remove.add(connection)
            
            # Remove failed connections
            for connection in connections_to_remove:
                self.active_connections[user_id].discard(connection)
                
            # Clean up empty user entries
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def broadcast_to_all(self, message: dict):
        """Send a message to all connected users"""
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)

    def get_user_connection_count(self, user_id: str) -> int:
        """Get the number of active connections for a user"""
        return len(self.active_connections.get(user_id, set()))

    def get_total_connections(self) -> int:
        """Get the total number of active connections"""
        return sum(len(connections) for connections in self.active_connections.values())

# Global connection manager instance
manager = ConnectionManager()

@router.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket endpoint for real-time notifications"""
    
    # Authenticate user
    try:
        user = await get_current_user_websocket(token)
        if not user:
            await websocket.close(code=4001, reason="Authentication required")
            return
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # Connect user
    await manager.connect(websocket, user.user_id)
    
    try:
        # Send initial unread count
        unread_count = await notification_service.get_unread_count(user.user_id)
        await websocket.send_text(json.dumps({
            "type": "unread_count",
            "data": unread_count
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for incoming messages (ping/pong, etc.)
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif message.get("type") == "refresh_notifications":
                    # Send updated unread count
                    unread_count = await notification_service.get_unread_count(user.user_id)
                    await websocket.send_text(json.dumps({
                        "type": "unread_count",
                        "data": unread_count
                    }))
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                break
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"WebSocket error for user {user.user_id}: {e}")
    finally:
        manager.disconnect(websocket, user.user_id)


# Function to send notification to user (to be called from other services)
async def send_notification_to_user(user_id: str, notification_data: dict):
    """Send a real-time notification to a specific user"""
    await manager.send_to_user(user_id, {
        "type": "new_notification", 
        "data": notification_data
    })
    
    # Also send updated unread count
    unread_count = await notification_service.get_unread_count(user_id)
    await manager.send_to_user(user_id, {
        "type": "unread_count",
        "data": unread_count
    })


# Function to send unread count update to user
async def send_unread_count_update(user_id: str):
    """Send updated unread count to a specific user"""
    unread_count = await notification_service.get_unread_count(user_id)
    await manager.send_to_user(user_id, {
        "type": "unread_count",
        "data": unread_count
    })


# Endpoint to get WebSocket connection statistics (for debugging)
@router.get("/ws/stats")
async def get_websocket_stats(current_user: User = Depends(get_current_user_websocket)):
    """Get WebSocket connection statistics"""
    return {
        "total_connections": manager.get_total_connections(),
        "user_connections": manager.get_user_connection_count(current_user.user_id),
        "active_users": len(manager.active_connections)
    } 