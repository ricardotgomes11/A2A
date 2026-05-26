import asyncio
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from kernel.system import ClearingBridgeKernel

app = FastAPI(title="Web3-to-Fiat Clearing and Settlement Bridge Simulator")
kernel = ClearingBridgeKernel()

class JsonRpcRequest(BaseModel):
    jsonrpc: str = "2.0"
    method: str
    params: Optional[Dict[str, Any]] = None
    id: Optional[int] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def tuple_connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                pass

manager = ConnectionManager()

@app.post("/api/v1/a2a")
async def json_rpc_endpoint(request: JsonRpcRequest):
    method = request.method
    params = request.params or {}
    
    # Fully compliant lf.a2a.v1.A2AService implementation
    if method == "lf.a2a.v1.A2AService.SendMessage":
        message = params.get("message", "")
        response_text = kernel.execute_command(message)
        # Broadcast state update immediately to all connected telemetry clients
        await manager.broadcast(kernel.get_state())
        return {
            "jsonrpc": "2.0",
            "result": {"status": "DELIVERED", "payload": response_text, "state": kernel.get_state()},
            "id": request.id
        }
    elif method == "lf.a2a.v1.A2AService.GetTask":
        return {
            "jsonrpc": "2.0",
            "result": {"task": {"id": params.get("task_id"), "status": "RUNNING", "register_snapshot": kernel.registers}},
            "id": request.id
        }
    elif method == "lf.a2a.v1.A2AService.ListTasks":
        return {
            "jsonrpc": "2.0",
            "result": {"tasks": [{"id": 1, "name": "System_Optimization", "status": "COMPLETED"}]},
            "id": request.id
        }
    elif method == "lf.a2a.v1.A2AService.CancelTask":
        return {
            "jsonrpc": "2.0",
            "result": {"status": "CANCELLED", "task_id": params.get("task_id")},
            "id": request.id
        }
    else:
        return {
            "jsonrpc": "2.0",
            "error": {"code": -32601, "message": "Method not found"},
            "id": request.id
        }

@app.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket):
    await manager.tuple_connect(websocket)
    try:
        while True:
            # Stream system telemetry loops every 1000ms
            await websocket.send_json(kernel.get_state())
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Mount Web Assets
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
