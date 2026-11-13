from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.guest import (
    ConfirmacionDelete,
    ConfirmacionListResponse,
    ConfirmacionUpsert,
    ConfirmacionUpsertResponse,
)
from app.services.guests import delete_guest, list_guests, upsert_guest

router = APIRouter(tags=["confirmaciones"])


@router.get("/confirmaciones", response_model=ConfirmacionListResponse)
def get_confirmaciones(db: Session = Depends(get_db)) -> ConfirmacionListResponse:
    return ConfirmacionListResponse(rows=list_guests(db))


@router.post("/confirmaciones", response_model=ConfirmacionUpsertResponse)
def post_confirmacion(
    payload: ConfirmacionUpsert,
    db: Session = Depends(get_db),
) -> ConfirmacionUpsertResponse:
    try:
        row, rows = upsert_guest(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ConfirmacionUpsertResponse(row=row, rows=rows)


@router.delete("/confirmaciones", response_model=ConfirmacionListResponse)
def delete_confirmacion(
    payload: ConfirmacionDelete,
    db: Session = Depends(get_db),
) -> ConfirmacionListResponse:
    rows = delete_guest(db, payload.id)
    return ConfirmacionListResponse(rows=rows)
