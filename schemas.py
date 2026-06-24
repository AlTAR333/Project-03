from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str

class InterrogationRequest(BaseModel):
    session_id: int
    suspect_id: str
    message: str

class AccusationRequest(BaseModel):
    session_id: int
    accused_suspect: str

class AuthRequest(BaseModel):
    username: str
    password: str