from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.database import SessionLocal


def get_session():
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

